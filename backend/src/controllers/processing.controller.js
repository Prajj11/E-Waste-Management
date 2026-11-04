import { ProcessingRecord, Request, Facility } from '../models/index.js';
import { HttpError } from '../middleware/errors.js';

const POPULATE_OPTS = [
  {
    path: 'requestId',
    select: 'itemName categoryId quantity status',
    populate: { path: 'categoryId', select: 'name' },
  },
  {
    path: 'facilityId',
    select: 'name location capacityKg certification',
  },
];

export async function list(req, res) {
  const records = await ProcessingRecord.find()
    .populate(POPULATE_OPTS)
    .sort({ createdAt: -1 });

  res.json(records.map((p) => p.toJSON()));
}

export async function start(req, res) {
  const { requestId, facilityId, weightKg } = req.body;
  if (!requestId || !facilityId || weightKg === undefined || weightKg === null) {
    throw new HttpError(400, 'Request, facility and weight are required');
  }

  const weightNum = Number(weightKg);
  if (isNaN(weightNum) || weightNum <= 0) {
    throw new HttpError(400, 'Weight must be greater than 0');
  }

  const request = await Request.findById(requestId);
  if (!request) {
    throw new HttpError(404, 'Request not found');
  }
  if (request.status !== 'Collected') {
    throw new HttpError(400, 'Only collected items can be sent for processing');
  }

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    throw new HttpError(404, 'Facility not found');
  }
  if (weightNum > facility.capacityKg) {
    throw new HttpError(400, `Item weight (${weightNum} kg) exceeds facility capacity (${facility.capacityKg} kg)`);
  }

  const existingRecord = await ProcessingRecord.findOne({ requestId });
  if (existingRecord) {
    throw new HttpError(400, 'Processing record already exists for this request');
  }

  const record = await ProcessingRecord.create({
    requestId,
    facilityId,
    weightKg: weightNum,
    processStatus: 'In Progress',
  });

  // Update request status to 'Processing' with rollback guard
  try {
    request.status = 'Processing';
    request.history.push({ status: 'Processing', at: new Date() });
    await request.save();
  } catch (err) {
    await ProcessingRecord.findByIdAndDelete(record._id);
    throw err;
  }

  const populated = await ProcessingRecord.findById(record._id).populate(POPULATE_OPTS);
  res.status(201).json(populated.toJSON());
}

export async function complete(req, res) {
  const { id } = req.params;
  const { finalStatus } = req.body;

  if (!['Recycled', 'Disposed'].includes(finalStatus)) {
    throw new HttpError(400, 'finalStatus must be Recycled or Disposed');
  }

  const record = await ProcessingRecord.findById(id);
  if (!record) {
    throw new HttpError(404, 'Record not found');
  }
  if (record.finalStatus) {
    throw new HttpError(400, 'This record is already completed');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const prevFinalStatus = record.finalStatus;
  const prevProcessStatus = record.processStatus;
  const prevProcessedOn = record.processedOn;

  record.finalStatus = finalStatus;
  record.processStatus = 'Completed';
  record.processedOn = todayStr;
  await record.save();

  // Update associated request status with rollback guard
  const request = await Request.findById(record.requestId);
  if (request) {
    try {
      request.status = finalStatus;
      request.history.push({ status: finalStatus, at: new Date() });
      await request.save();
    } catch (err) {
      record.finalStatus = prevFinalStatus;
      record.processStatus = prevProcessStatus;
      record.processedOn = prevProcessedOn;
      await record.save();
      throw err;
    }
  }

  const populated = await ProcessingRecord.findById(record._id).populate(POPULATE_OPTS);
  res.json(populated.toJSON());
}
