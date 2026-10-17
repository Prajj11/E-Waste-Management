import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CalendarDays, Truck, ChevronDown } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, Empty, ErrorNote, Loading, PageHeader, Timeline, fmtDate } from '../../components/ui.jsx';

const FILTERS = ['All', 'Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'];

export default function MyRequests() {
  const { data, loading, error } = useAsync(() => api.requests(), []);
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);
  if (loading) return <Loading />;
  const list = (data || []).filter((r) => filter === 'All' || r.status === filter);

  return (
    <>
      <PageHeader title="My requests" subtitle="Track every item from submission to recycling."
        action={<Link to="/user/submit" className="btn-primary">New request</Link>} />
      <ErrorNote message={error} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-moss-800 text-white' : 'bg-white ring-1 ring-black/10 hover:bg-black/5'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 && <div className="card"><Empty title="No requests match" hint="Try a different filter or submit a new item." /></div>}
        {list.map((r) => {
          const open = openId === r.id;
          return (
            <div key={r.id} className="card overflow-hidden">
              <button className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}>
                <div>
                  <p className="font-semibold">#{r.id} · {r.itemName} <span className="font-normal text-black/45">× {r.quantity}</span></p>
                  <p className="text-xs text-black/50">{r.categoryName} · {r.condition}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{r.status}</Badge>
                  <ChevronDown size={18} className={`text-black/40 transition ${open ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {open && (
                <div className="grid gap-6 border-t border-black/5 bg-black/[0.015] p-5 sm:grid-cols-2">
                  <div className="space-y-3 text-sm">
                    <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-moss-600" />{r.pickupAddress}</p>
                    <p className="flex gap-2"><CalendarDays size={16} className="shrink-0 text-moss-600" />Preferred: {fmtDate(r.preferredDate)}</p>
                    <p className="flex gap-2"><Truck size={16} className="shrink-0 text-moss-600" />{r.collectorName ? `${r.collectorName} · scheduled ${fmtDate(r.scheduledDate)}` : 'Collector not assigned yet'}</p>
                    {r.remarks && <p className="rounded-lg bg-white p-3 text-black/65 ring-1 ring-black/5">“{r.remarks}”</p>}
                  </div>
                  <div><p className="label">Status history</p><Timeline history={r.history} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
