import { Link } from 'react-router-dom';
import { ClipboardList, Clock, Recycle, Users, ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, ErrorNote, Loading, PageHeader, StatCard, fmtDate } from '../../components/ui.jsx';

export const STATUS_COLORS = { Pending: '#e7a22b', Assigned: '#4a9fd0', Collected: '#6366c9', Processing: '#8b5cc7', Recycled: '#5a9340', Disposed: '#8a8a82' };

export default function AdminDashboard() {
  const { data, loading, error } = useAsync(() => Promise.all([api.summary(), api.requests()]), []);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  const [s, reqs] = data;
  const t = s.totals;
  const pie = s.byStatus.filter((x) => x.count > 0);

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Overview of collection, processing and recycling." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total requests" value={t.requests} hint={`${t.users} registered users`} />
        <StatCard icon={Clock} label="Pending assignment" value={t.pending} tone="amber" hint="Needs a collector" />
        <StatCard icon={Users} label="Collected & beyond" value={t.collected} tone="sky" hint={`${t.collectors} active collectors`} />
        <StatCard icon={Recycle} label="Recycling rate" value={`${t.recyclingRate}%`} tone="violet" hint={`${t.recycledKg} kg recycled · ${t.disposedKg} kg disposed`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="mb-4 font-bold">Requests per month</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={s.monthly} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0000000f" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#0000000a' }} />
                <Bar dataKey="requests" fill="#437630" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-2 font-bold">By status</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {pie.map((e) => <Cell key={e.status} fill={STATUS_COLORS[e.status]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            {pie.map((e) => <span key={e.status} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[e.status] }} />{e.status} ({e.count})</span>)}
          </div>
        </div>
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">Needs attention</h2>
        <Link to="/admin/requests" className="flex items-center gap-1 text-sm font-semibold text-moss-700 hover:underline">All requests <ArrowRight size={14} /></Link>
      </div>
      <div className="card divide-y divide-black/5">
        {reqs.filter((r) => r.status === 'Pending').length === 0 && <p className="p-6 text-sm text-black/50">Nothing pending, great work.</p>}
        {reqs.filter((r) => r.status === 'Pending').map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-semibold">{r.itemName} × {r.quantity}</p><p className="text-xs text-black/50">{r.userName} · {r.categoryName} · pickup {fmtDate(r.preferredDate)}</p></div>
            <Badge>{r.status}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}
