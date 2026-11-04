import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const userJson = user.toJSON();
  res.json({
    token: signToken(userJson),
    user: userJson,
  });
}

export async function register(req, res) {
  const { fullName, email, password, phone, address, vehicleNo, area } = req.body;

  if (!fullName || !email || !password) {
    throw new HttpError(400, 'Name, email and password are required');
  }
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // Admins can never self-register through public signup
  const role = req.body.role === 'COLLECTOR' ? 'COLLECTOR' : 'USER';
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? phone.trim() : null,
    role,
    address: address ? address.trim() : null,
    vehicleNo: role === 'COLLECTOR' && vehicleNo ? vehicleNo.trim() : null,
    area: role === 'COLLECTOR' && area ? area.trim() : null,
  });

  const userJson = newUser.toJSON();
  res.status(201).json({
    token: signToken(userJson),
    user: userJson,
  });
}
