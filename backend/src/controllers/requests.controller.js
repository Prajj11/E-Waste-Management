import { rows, tx, oracledb } from '../config/db.js';
import { HttpError } from '../middleware/errors.js';

const SELECT = `
  SELECT request_id "id", user_id "userId", user_name "userName", category_id "categoryId", category_name "categoryName",
         item_name "itemName", quantity "quantity", item_condition "condition", pickup_address "pickupAddress",
         TO_CHAR(preferred_date,'YYYY-MM-DD') "preferredDate", status "status", collector_id "collectorId",
         collector_name "collectorName", TO_CHAR(scheduled_date,'YYYY-MM-DD') "scheduledDate",
         TO_CHAR(collected_on,'YYYY-MM-DD') "collectedOn", remarks "remarks",
         TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') "createdAt"
  FROM v_request_details`;

const withHistory = async (list) => {
  if (!list.length) return list;
  const hist = await rows(
    `SELECT request_id "requestId", status "status", TO_CHAR(changed_at,'YYYY-MM-DD"T"HH24:MI:SS') "at"
     FROM status_history ORDER BY history_id`
  );
  return list.map((r) => ({ ...r, history: hist.filter((h) => h.requestId === r.id).map(({ status, at }) => ({ status, at })) }));
};

export const getOne = async (id) => (await withHistory(await rows(`${SELECT} WHERE request_id = :id`, { id })))[0];

export async function list(req, res) {
  const { id, role } = req.user;
  let where = '', binds = {};
  if (role === 'USER') { where = 'WHERE user_id = :uid'; binds = { uid: id }; }
  if (role === 'COLLECTOR') { where = 'WHERE collector_id = (SELECT collector_id FROM collector WHERE user_id = :uid)'; binds = { uid: id }; }
  res.json(await withHistory(await rows(`${SELECT} ${where} ORDER BY created_at DESC`, binds)));
}

export async function create(req, res) {
  const { categoryId, itemName, quantity, condition, pickupAddress, preferredDate } = req.body;
  if (!categoryId || !itemName || !condition || !pickupAddress || !preferredDate) throw new HttpError(400, 'Please fill in all required fields');
  const newId = await tx(async (run) => {
    const r = await run(
      `INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date)
       VALUES (:uid, :categoryId, :itemName, :quantity, :condition, :pickupAddress, TO_DATE(:preferredDate,'YYYY-MM-DD'))
       RETURNING request_id INTO :id`,
      { uid: req.user.id, categoryId: Number(categoryId), itemName, quantity: Number(quantity) || 1, condition, pickupAddress, preferredDate,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );
    return r.outBinds.id[0];
  });
  res.status(201).json(await getOne(newId));
}

export async function assign(req, res) {
  const { collectorId, scheduledDate } = req.body;
  if (!collectorId || !scheduledDate) throw new HttpError(400, 'Collector and scheduled date are required');
  const id = Number(req.params.id);
  const [cur] = await rows('SELECT status "status" FROM collection_request WHERE request_id = :id', { id });
  if (!cur) throw new HttpError(404, 'Request not found');
  if (!['Pending', 'Assigned'].includes(cur.status)) throw new HttpError(400, 'Only pending or assigned requests can be (re)assigned');
  await tx((run) => run(
    `UPDATE collection_request SET collector_id = :collectorId, scheduled_date = TO_DATE(:scheduledDate,'YYYY-MM-DD'), status = 'Assigned'
     WHERE request_id = :id`, { collectorId: Number(collectorId), scheduledDate, id }));
  res.json(await getOne(id));
}

// allowed next statuses, enforced on the server
const NEXT = { Pending: ['Assigned'], Assigned: ['Collected'], Collected: ['Processing'], Processing: ['Recycled', 'Disposed'] };

export async function setStatus(req, res) {
  const id = Number(req.params.id);
  const { status, remarks } = req.body;
  const [cur] = await rows('SELECT status "status", collector_id "collectorId" FROM collection_request WHERE request_id = :id', { id });
  if (!cur) throw new HttpError(404, 'Request not found');
  if (!(NEXT[cur.status] || []).includes(status)) throw new HttpError(400, `Cannot move a ${cur.status} request to ${status}`);

  if (req.user.role === 'COLLECTOR') {
    const [mine] = await rows('SELECT collector_id "id" FROM collector WHERE user_id = :uid', { uid: req.user.id });
    if (!mine || mine.id !== cur.collectorId) throw new HttpError(403, 'This pickup is not assigned to you');
    if (status !== 'Collected') throw new HttpError(403, 'Collectors can only mark items as collected');
  }
  await tx((run) => run(
    `UPDATE collection_request
        SET status = :status, remarks = NVL(:remarks, remarks),
            collected_on = CASE WHEN :status = 'Collected' THEN TRUNC(SYSDATE) ELSE collected_on END
      WHERE request_id = :id`, { status, remarks: remarks ?? null, id }));
  res.json(await getOne(id));
}
