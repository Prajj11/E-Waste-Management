import { Request, Category, User } from '../models/index.js';
import { HttpError } from '../middleware/errors.js';

const POPULATE_OPTS = [
  { path: 'userId', select: 'fullName email phone' },
  { path: 'categoryId', select: 'name hazardLevel' },
  { path: 'collectorId', select: 'fullName phone vehicleNo area' },
];

const NEXT_STATUS = {
  Pending: ['Assigned'],
  Assigned: ['Collected'],
  Collected: ['Processing'],
  Processing: ['Recycled', 'Disposed'],
};

export async function list(req, res) {
  const { id, role } = req.user;
  const filter = {};

  if (role === 'USER') {
    filter.userId = id;
  } else if (role === 'COLLECTOR') {
    filter.collectorId = id;
  }
  // ADMIN receives all requests without filter

  const requests = await Request.find(filter)
    .populate(POPULATE_OPTS)
    .sort({ createdAt: -1 });

  res.json(requests.map((r) => r.toJSON()));
}

export async function create(req, res) {
  const { categoryId, itemName, quantity, condition, pickupAddress, preferredDate } = req.body;

  if (!categoryId || !itemName || !condition || !pickupAddress || !preferredDate) {
    throw new HttpError(400, 'Please fill in all required fields');
  }

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    throw new HttpError(404, 'Selected category does not exist');
  }

  const newRequest = await Request.create({
    userId: req.user.id,
    categoryId,
    itemName: itemName.trim(),
    quantity: Number(quantity) || 1,
    condition,
    pickupAddress: pickupAddress.trim(),
    preferredDate,
    status: 'Pending',
    history: [{ status: 'Pending', at: new Date() }],
  });

  const populated = await Request.findById(newRequest._id).populate(POPULATE_OPTS);
  res.status(201).json(populated.toJSON());
}

export async function assign(req, res) {
  const { id } = req.params;
  const { collectorId, scheduledDate } = req.body;

  if (!collectorId || !scheduledDate) {
    throw new HttpError(400, 'Collector and scheduled date are required');
  }

  const collector = await User.findOne({ _id: collectorId, role: 'COLLECTOR' });
  if (!collector) {
    throw new HttpError(404, 'Collector not found');
  }

  const request = await Request.findById(id);
  if (!request) {
    throw new HttpError(404, 'Request not found');
  }

  if (!['Pending', 'Assigned'].includes(request.status)) {
    throw new HttpError(400, 'Only pending or assigned requests can be (re)assigned');
  }

  request.collectorId = collector._id;
  request.scheduledDate = scheduledDate;
  request.status = 'Assigned';
  request.history.push({ status: 'Assigned', at: new Date() });

  await request.save();

  const populated = await Request.findById(request._id).populate(POPULATE_OPTS);
  res.json(populated.toJSON());
}

export async function setStatus(req, res) {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const request = await Request.findById(id);
  if (!request) {
    throw new HttpError(404, 'Request not found');
  }

  const allowedNext = NEXT_STATUS[request.status] || [];
  if (!allowedNext.includes(status)) {
    throw new HttpError(400, `Cannot move a ${request.status} request to ${status}`);
  }

  if (req.user.role === 'COLLECTOR') {
    const collectorIdStr = request.collectorId ? request.collectorId.toString() : null;
    if (collectorIdStr !== req.user.id) {
      throw new HttpError(403, 'This pickup is not assigned to you');
    }
    if (status !== 'Collected') {
      throw new HttpError(403, 'Collectors can only mark items as collected');
    }
  }

  request.status = status;
  if (remarks !== undefined && remarks !== null) {
    request.remarks = remarks.trim();
  }
  if (status === 'Collected') {
    request.collectedOn = new Date().toISOString().slice(0, 10);
  }

  request.history.push({ status, at: new Date() });
  await request.save();

  const populated = await Request.findById(request._id).populate(POPULATE_OPTS);
  res.json(populated.toJSON());
}
