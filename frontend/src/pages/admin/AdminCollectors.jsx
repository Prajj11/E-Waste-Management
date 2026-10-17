import { Truck, MapPin } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, ErrorNote, Loading, PageHeader } from '../../components/ui.jsx';

export default function AdminCollectors() {
  const { data, loading, error } = useAsync(() => api.collectors(), []);
  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="Collectors" subtitle="Field staff who pick up e-waste. Collectors register themselves; you assign them to requests." />
      <ErrorNote message={error} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-moss-100 font-display font-bold text-moss-800">{c.fullName.split(' ').map((n) => n[0]).join('')}</span>
              <div><p className="font-bold">{c.fullName}</p><Badge tone={c.available ? 'Completed' : 'Pending'}>{c.available ? 'Available' : 'Unavailable'}</Badge></div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-black/65">
              <p className="flex items-center gap-2"><Truck size={16} className="text-moss-600" />{c.vehicleNo}</p>
              <p className="flex items-center gap-2"><MapPin size={16} className="text-moss-600" />{c.area}</p>
            </div>
            <p className="mt-4 border-t border-black/5 pt-3 text-sm"><strong>{c.activeJobs}</strong> <span className="text-black/50">active pickups</span></p>
          </div>
        ))}
      </div>
    </>
  );
}
