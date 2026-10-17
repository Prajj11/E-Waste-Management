import { useState } from 'react';
import { MapPin, CalendarDays, Phone, PackageCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, Empty, ErrorNote, Field, Loading, Modal, PageHeader, StatCard, fmtDate } from '../../components/ui.jsx';
import { ClipboardList, Clock, CheckCheck } from 'lucide-react';

export default function CollectorPickups() {
  const { data, loading, error, reload } = useAsync(() => api.requests(), []);
  const [target, setTarget] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  const list = data || [];
  const todo = list.filter((r) => r.status === 'Assigned');
  const done = list.filter((r) => r.status !== 'Assigned');

  const confirm = async () => {
    setBusy(true); setErr('');
    try { await api.setStatus(target.id, { status: 'Collected', remarks }); setTarget(null); setRemarks(''); reload(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="My pickups" subtitle="Items assigned to you by the admin." />
      <ErrorNote message={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Assigned jobs" value={list.length} />
        <StatCard icon={Clock} label="Pending pickup" value={todo.length} tone="amber" />
        <StatCard icon={CheckCheck} label="Collected" value={done.length} tone="sky" />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">To collect</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {todo.length === 0 && <div className="card md:col-span-2"><Empty title="You're all caught up" hint="New assignments will appear here." /></div>}
        {todo.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">{r.itemName}</p>
                <p className="text-sm text-black/50">{r.categoryName} · qty {r.quantity} · {r.condition}</p>
              </div>
              <Badge>{r.status}</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-moss-600" />{r.pickupAddress}</p>
              <p className="flex gap-2"><CalendarDays size={16} className="shrink-0 text-moss-600" />Scheduled {fmtDate(r.scheduledDate)}</p>
              <p className="flex gap-2"><Phone size={16} className="shrink-0 text-moss-600" />Customer: {r.userName}</p>
            </div>
            <button className="btn-primary mt-5 w-full" onClick={() => setTarget(r)}><PackageCheck size={16} /> Mark as collected</button>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Completed</h2>
      <div className="card divide-y divide-black/5">
        {done.length === 0 && <Empty title="No completed pickups yet" />}
        {done.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-semibold">{r.itemName}</p><p className="text-xs text-black/50">Collected {fmtDate(r.collectedOn)} · {r.userName}</p></div>
            <Badge>{r.status}</Badge>
          </div>
        ))}
      </div>

      <Modal open={!!target} onClose={() => setTarget(null)} title="Confirm collection">
        <p className="mb-4 text-sm text-black/60">Confirm you have collected <strong>{target?.itemName}</strong> from {target?.userName}.</p>
        <ErrorNote message={err} />
        <Field label="Remarks (optional)"><textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Condition on pickup, handover notes…" /></Field>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setTarget(null)}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Confirm'}</button>
        </div>
      </Modal>
    </>
  );
}
