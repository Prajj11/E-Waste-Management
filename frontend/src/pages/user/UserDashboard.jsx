import { Link } from 'react-router-dom';
import { ClipboardList, Clock, Truck, Recycle, PackagePlus, ArrowRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Empty, ErrorNote, Loading, PageHeader, StatCard, fmtDate } from '../../components/ui.jsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.requests(), []);
  if (loading) return <Loading />;
  const list = data || [];
  const count = (...s) => list.filter((r) => s.includes(r.status)).length;

  return (
    <>
      <PageHeader
        title={`Hello, ${user.fullName.split(' ')[0]}`}
        subtitle="Here is what is happening with your e-waste."
        action={<Link to="/user/submit" className="btn-primary"><PackagePlus size={16} /> Submit e-waste</Link>}
      />
      <ErrorNote message={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total requests" value={list.length} />
        <StatCard icon={Clock} label="Awaiting pickup" value={count('Pending', 'Assigned')} tone="amber" />
        <StatCard icon={Truck} label="In transit / processing" value={count('Collected', 'Processing')} tone="sky" />
        <StatCard icon={Recycle} label="Recycled / disposed" value={count('Recycled', 'Disposed')} tone="violet" />
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">Recent requests</h2>
        <Link to="/user/requests" className="flex items-center gap-1 text-sm font-semibold text-moss-700 hover:underline">View all <ArrowRight size={14} /></Link>
      </div>
      <div className="card divide-y divide-black/5">
        {list.length === 0 && <Empty title="No requests yet" hint="Submit your first item and we will arrange the pickup." />}
        {list.slice(0, 4).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{r.itemName} <span className="font-normal text-black/45">× {r.quantity}</span></p>
              <p className="text-xs text-black/50">{r.categoryName} · Pickup {fmtDate(r.preferredDate)}</p>
            </div>
            <Badge>{r.status}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}
