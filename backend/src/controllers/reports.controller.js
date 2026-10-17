import { rows } from '../config/db.js';

const STATUSES = ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'];
const round1 = (n) => Math.round((n || 0) * 10) / 10;

export async function summary(req, res) {
  const [byStatusRows, byCategory, monthly, facilityLoad, [counts], [kg]] = await Promise.all([
    rows(`SELECT status "status", request_count "count" FROM v_status_summary`),
    rows(`SELECT category_name "name", total_units "count" FROM v_category_summary WHERE total_units > 0 ORDER BY total_units DESC`),
    rows(`SELECT TO_CHAR(created_at,'Mon') "month", COUNT(*) "requests"
          FROM collection_request GROUP BY TO_CHAR(created_at,'YYYY-MM'), TO_CHAR(created_at,'Mon') ORDER BY TO_CHAR(created_at,'YYYY-MM')`),
    rows(`SELECT name "name", capacity_kg "capacityKg", processed_kg "processedKg" FROM v_facility_load`),
    rows(`SELECT (SELECT COUNT(*) FROM app_user WHERE role = 'USER') "users", (SELECT COUNT(*) FROM collector) "collectors",
                 (SELECT COUNT(*) FROM collection_request) "requests" FROM dual`),
    rows(`SELECT NVL(SUM(CASE WHEN final_status = 'Recycled' THEN weight_kg END),0) "recycled",
                 NVL(SUM(CASE WHEN final_status = 'Disposed' THEN weight_kg END),0) "disposed" FROM processing_record`),
  ]);

  const byStatus = STATUSES.map((s) => ({ status: s, count: byStatusRows.find((x) => x.status === s)?.count ?? 0 }));
  const n = (s) => byStatus.find((x) => x.status === s).count;
  const total = kg.recycled + kg.disposed;

  res.json({
    totals: {
      users: counts.users, collectors: counts.collectors, requests: counts.requests,
      pending: n('Pending'),
      collected: n('Collected') + n('Processing') + n('Recycled') + n('Disposed'),
      processed: n('Recycled') + n('Disposed'),
      recycledKg: round1(kg.recycled), disposedKg: round1(kg.disposed),
      recyclingRate: total ? Math.round((kg.recycled / total) * 100) : 0,
    },
    byStatus, byCategory, monthly,
    facilityLoad: facilityLoad.map((f) => ({ ...f, processedKg: round1(f.processedKg) })),
  });
}
