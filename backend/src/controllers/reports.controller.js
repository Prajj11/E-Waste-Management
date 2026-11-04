import { Request, User, ProcessingRecord, Facility, Category } from '../models/index.js';

const STATUSES = ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'];
const round1 = (n) => Math.round((n || 0) * 10) / 10;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function summary(req, res) {
  // 1. Basic counts
  const [userCount, collectorCount, totalRequests] = await Promise.all([
    User.countDocuments({ role: 'USER' }),
    User.countDocuments({ role: 'COLLECTOR' }),
    Request.countDocuments(),
  ]);

  // 2. Status distribution
  const statusAgg = await Request.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusMap = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
  const byStatus = STATUSES.map((status) => ({
    status,
    count: statusMap[status] || 0,
  }));
  const n = (s) => statusMap[s] || 0;

  // 3. Category distribution (total units or request counts)
  const categoryAgg = await Request.aggregate([
    {
      $group: {
        _id: '$categoryId',
        count: { $sum: '$quantity' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const categories = await Category.find();
  const categoryNameMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));
  const byCategory = categoryAgg
    .map((item) => ({
      name: categoryNameMap[item._id?.toString()] || 'Uncategorized',
      count: item.count,
    }))
    .filter((c) => c.count > 0);

  // 4. Monthly request trends (grouped by year-month)
  const monthlyAgg = await Request.aggregate([
    {
      $project: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        requests: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthly = monthlyAgg.map((m) => ({
    month: MONTH_NAMES[m._id.month - 1] || `${m._id.month}`,
    requests: m.requests,
  }));

  // 5. Processing weight calculations (Recycled vs Disposed)
  const weightAgg = await ProcessingRecord.aggregate([
    {
      $group: {
        _id: '$finalStatus',
        totalWeight: { $sum: '$weightKg' },
      },
    },
  ]);
  const weightMap = Object.fromEntries(weightAgg.map((w) => [w._id, w.totalWeight]));
  const recycledKg = weightMap['Recycled'] || 0;
  const disposedKg = weightMap['Disposed'] || 0;
  const totalKg = recycledKg + disposedKg;
  const recyclingRate = totalKg > 0 ? Math.round((recycledKg / totalKg) * 100) : 0;

  // 6. Facility load
  const facilityLoadAgg = await ProcessingRecord.aggregate([
    {
      $group: {
        _id: '$facilityId',
        processedKg: { $sum: '$weightKg' },
      },
    },
  ]);
  const facilityLoadMap = Object.fromEntries(
    facilityLoadAgg.map((f) => [f._id?.toString(), f.processedKg])
  );

  const facilities = await Facility.find().sort({ name: 1 });
  const facilityLoad = facilities.map((f) => ({
    name: f.name,
    capacityKg: f.capacityKg,
    processedKg: round1(facilityLoadMap[f._id.toString()] || 0),
  }));

  res.json({
    totals: {
      users: userCount,
      collectors: collectorCount,
      requests: totalRequests,
      pending: n('Pending'),
      collected: n('Collected') + n('Processing') + n('Recycled') + n('Disposed'),
      processed: n('Recycled') + n('Disposed'),
      recycledKg: round1(recycledKg),
      disposedKg: round1(disposedKg),
      recyclingRate,
    },
    byStatus,
    byCategory,
    monthly,
    facilityLoad,
  });
}
