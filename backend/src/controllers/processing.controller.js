import { rows, tx, oracledb } from '../config/db.js';
import { HttpError } from '../middleware/errors.js';

const SELECT = `
  SELECT p.record_id "id", p.request_id "requestId", r.item_name "itemName", c.name "categoryName",
         p.facility_id "facilityId", f.name "facilityName", p.weight_kg "weightKg",
         p.process_status "processStatus", p.final_status "finalStatus", TO_CHAR(p.processed_on,'YYYY-MM-DD') "processedOn"
  FROM processing_record p
  JOIN collection_request r ON r.request_id = p.request_id
  JOIN ewaste_category c    ON c.category_id = r.category_id
  JOIN recycling_facility f ON f.facility_id = p.facility_id`;

export const list = async (req, res) => res.json(await rows(`${SELECT} ORDER BY p.record_id DESC`));

export async function start(req, res) {
  const { requestId, facilityId, weightKg } = req.body;
  if (!requestId || !facilityId || !weightKg) throw new HttpError(400, 'Request, facility and weight are required');
  const [r] = await rows('SELECT status "status" FROM collection_request WHERE request_id = :id', { id: Number(requestId) });
  if (!r) throw new HttpError(404, 'Request not found');
  if (r.status !== 'Collected') throw new HttpError(400, 'Only collected items can be sent for processing');

  const id = await tx(async (run) => {
    const ins = await run(
      `INSERT INTO processing_record (request_id, facility_id, weight_kg) VALUES (:rid, :fid, :w) RETURNING record_id INTO :id`,
      { rid: Number(requestId), fid: Number(facilityId), w: Number(weightKg), id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });
    await run(`UPDATE collection_request SET status = 'Processing' WHERE request_id = :rid`, { rid: Number(requestId) });
    return ins.outBinds.id[0];
  });
  res.status(201).json((await rows(`${SELECT} WHERE p.record_id = :id`, { id }))[0]);
}

export async function complete(req, res) {
  const id = Number(req.params.id);
  const { finalStatus } = req.body;
  if (!['Recycled', 'Disposed'].includes(finalStatus)) throw new HttpError(400, 'finalStatus must be Recycled or Disposed');
  const [p] = await rows('SELECT request_id "requestId", final_status "finalStatus" FROM processing_record WHERE record_id = :id', { id });
  if (!p) throw new HttpError(404, 'Record not found');
  if (p.finalStatus) throw new HttpError(400, 'This record is already completed');
  await tx(async (run) => {
    await run(`UPDATE processing_record SET final_status = :fs, process_status = 'Completed', processed_on = TRUNC(SYSDATE) WHERE record_id = :id`, { fs: finalStatus, id });
    await run(`UPDATE collection_request SET status = :fs WHERE request_id = :rid`, { fs: finalStatus, rid: p.requestId });
  });
  res.json((await rows(`${SELECT} WHERE p.record_id = :id`, { id }))[0]);
}
