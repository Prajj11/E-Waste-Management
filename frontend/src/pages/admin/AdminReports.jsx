import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { ErrorNote, Loading, PageHeader, StatCard, Table } from '../../components/ui.jsx';
import { Package, Clock, Cog, Recycle } from 'lucide-react';

const toCsv = (rows) => {
  const head = Object.keys(rows[0] || {});
  return [head.join(','), ...rows.map((r) => head.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
};
const download = (name, text) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
};

export default function AdminReports() {
  const { data, loading, error } = useAsync(() => Promise.all([api.summary(), api.requests()]), []);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  const [s, reqs] = data;
  const t = s.totals;
  const get = (st) => s.byStatus.find((x) => x.status === st)?.count ?? 0;

  const exportRequests = () => download('ewaste-requests.csv', toCsv(reqs.map((r) => ({
    id: r.id, item: r.itemName, category: r.categoryName, quantity: r.quantity, condition: r.condition, user: r.userName, collector: r.collectorName, status: r.status, created: r.createdAt.slice(0, 10),
  }))));

  return (
    <>
      <PageHeader title="Reports" subtitle="Collected, pending, processed, recycled and disposed e-waste."
        action={<button className="btn-outline" onClick={exportRequests}><Download size={16} /> Export CSV</button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending" value={get('Pending')} tone="amber" />
        <StatCard icon={Package} label="Collected" value={t.collected} tone="sky" />
        <StatCard icon={Cog} label="Processed" value={t.processed} tone="violet" />
        <StatCard icon={Recycle} label="Recycled" value={`${t.recycledKg} kg`} hint={`${t.disposedKg} kg disposed`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Items by category (units)</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={s.byCategory} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#0000000f" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#0000000a' }} />
                <Bar dataKey="count" name="Units" fill="#5a9340" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Facility load (kg)</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={s.facilityLoad} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0000000f" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#0000000a' }} />
                <Legend />
                <Bar dataKey="processedKg" name="Processed" fill="#437630" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacityKg" name="Capacity" fill="#c6dfb3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Status summary</h2>
      <Table head={['Status', 'Requests', 'Share']}>
        {s.byStatus.map((x) => (
          <tr key={x.status}>
            <td className="td font-semibold">{x.status}</td>
            <td className="td">{x.count}</td>
            <td className="td">
              <div className="flex items-center gap-3">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-black/5"><div className="h-full bg-moss-600" style={{ width: `${t.requests ? (x.count / t.requests) * 100 : 0}%` }} /></div>
                <span className="text-xs text-black/50">{t.requests ? Math.round((x.count / t.requests) * 100) : 0}%</span>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
