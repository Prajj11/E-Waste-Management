import { rows, query, oracledb } from '../config/db.js';
import { HttpError } from '../middleware/errors.js';

// ---- categories -----------------------------------------------------------------------------
const CAT = `SELECT category_id "id", name "name", description "description", hazard_level "hazardLevel" FROM ewaste_category`;
export const listCategories = async (req, res) => res.json(await rows(`${CAT} ORDER BY name`));

export async function addCategory(req, res) {
  const { name, description, hazardLevel } = req.body;
  if (!name) throw new HttpError(400, 'Category name is required');
  const r = await query(
    `INSERT INTO ewaste_category (name, description, hazard_level) VALUES (:name, :description, :hazard) RETURNING category_id INTO :id`,
    { name, description: description || null, hazard: hazardLevel || 'Low', id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });
  res.status(201).json((await rows(`${CAT} WHERE category_id = :id`, { id: r.outBinds.id[0] }))[0]);
}
export async function updateCategory(req, res) {
  const { name, description, hazardLevel } = req.body;
  const id = Number(req.params.id);
  const r = await query(`UPDATE ewaste_category SET name = :name, description = :description, hazard_level = :hazard WHERE category_id = :id`,
    { name, description: description || null, hazard: hazardLevel || 'Low', id });
  if (!r.rowsAffected) throw new HttpError(404, 'Category not found');
  res.json((await rows(`${CAT} WHERE category_id = :id`, { id }))[0]);
}
export async function deleteCategory(req, res) {
  const [used] = await rows('SELECT COUNT(*) "n" FROM collection_request WHERE category_id = :id', { id: Number(req.params.id) });
  if (used.n > 0) throw new HttpError(409, 'Category is used by existing requests');
  await query('DELETE FROM ewaste_category WHERE category_id = :id', { id: Number(req.params.id) });
  res.json({ deleted: true });
}

// ---- facilities -----------------------------------------------------------------------------
const FAC = `SELECT facility_id "id", name "name", location "location", capacity_kg "capacityKg", certification "certification" FROM recycling_facility`;
export const listFacilities = async (req, res) => res.json(await rows(`${FAC} ORDER BY name`));
export async function addFacility(req, res) {
  const { name, location, capacityKg, certification } = req.body;
  if (!name || !location || !capacityKg) throw new HttpError(400, 'Name, location and capacity are required');
  const r = await query(
    `INSERT INTO recycling_facility (name, location, capacity_kg, certification) VALUES (:name, :location, :cap, :cert) RETURNING facility_id INTO :id`,
    { name, location, cap: Number(capacityKg), cert: certification || null, id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });
  res.status(201).json((await rows(`${FAC} WHERE facility_id = :id`, { id: r.outBinds.id[0] }))[0]);
}
export async function deleteFacility(req, res) {
  const id = Number(req.params.id);
  const [used] = await rows('SELECT COUNT(*) "n" FROM processing_record WHERE facility_id = :id', { id });
  if (used.n > 0) throw new HttpError(409, 'Facility has processing records');
  await query('DELETE FROM recycling_facility WHERE facility_id = :id', { id });
  res.json({ deleted: true });
}

// ---- users & collectors ---------------------------------------------------------------------
export const listUsers = async (req, res) => res.json(await rows(
  `SELECT user_id "id", full_name "fullName", email "email", phone "phone", role "role", address "address",
          TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') "createdAt" FROM app_user ORDER BY user_id`));

export async function deleteUser(req, res) {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'You cannot delete your own account');
  const [used] = await rows('SELECT COUNT(*) "n" FROM collection_request WHERE user_id = :id', { id });
  if (used.n > 0) throw new HttpError(409, 'This user has e-waste requests and cannot be deleted');
  await query('DELETE FROM app_user WHERE user_id = :id', { id });
  res.json({ deleted: true });
}

export const listCollectors = async (req, res) => res.json(await rows(
  `SELECT co.collector_id "id", co.user_id "userId", u.full_name "fullName", co.vehicle_no "vehicleNo", co.area "area",
          co.available "available",
          (SELECT COUNT(*) FROM collection_request r WHERE r.collector_id = co.collector_id AND r.status IN ('Assigned','Collected')) "activeJobs"
   FROM collector co JOIN app_user u ON u.user_id = co.user_id ORDER BY u.full_name`)
  .then((list) => list.map((c) => ({ ...c, available: c.available === 1 }))));
