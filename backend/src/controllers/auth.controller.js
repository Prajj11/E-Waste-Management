import bcrypt from 'bcryptjs';
import { query, rows, tx, oracledb } from '../config/db.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';

const USER_COLS = `user_id "id", full_name "fullName", email "email", phone "phone", role "role", address "address",
                   TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') "createdAt"`;

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const [u] = await rows(`SELECT ${USER_COLS}, password_hash "passwordHash" FROM app_user WHERE LOWER(email) = LOWER(:email)`, { email });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) throw new HttpError(401, 'Invalid email or password');
  delete u.passwordHash;
  res.json({ token: signToken(u), user: u });
}

export async function register(req, res) {
  const { fullName, email, password, phone, address, vehicleNo, area } = req.body;
  if (!fullName || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const role = req.body.role === 'COLLECTOR' ? 'COLLECTOR' : 'USER'; // admins are never self-registered
  const hash = await bcrypt.hash(password, 10);

  const id = await tx(async (run) => {
    const r = await run(
      `INSERT INTO app_user (full_name, email, password_hash, phone, role, address)
       VALUES (:fullName, :email, :hash, :phone, :role, :address) RETURNING user_id INTO :id`,
      { fullName, email, hash, phone: phone || null, role, address: address || null, id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    const newId = r.outBinds.id[0];
    if (role === 'COLLECTOR') {
      await run(`INSERT INTO collector (user_id, vehicle_no, area) VALUES (:uid, :vehicleNo, :area)`, { uid: newId, vehicleNo: vehicleNo || null, area: area || null });
    }
    return newId;
  }).catch((e) => { if (e.errorNum === 1) throw new HttpError(409, 'An account with this email already exists'); throw e; });

  const [u] = await rows(`SELECT ${USER_COLS} FROM app_user WHERE user_id = :id`, { id });
  res.status(201).json({ token: signToken(u), user: u });
}
