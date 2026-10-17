import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, ErrorNote, Field, Loading, Modal, PageHeader, Table, Timeline, fmtDate } from '../../components/ui.jsx';

const FILTERS = ['All', 'Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'];

export default function AdminRequests() {
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.requests(), api.collectors()]), []);
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const [assign, setAssign] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ collectorId: '', scheduledDate: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  const [reqs, collectors] = data;
  const list = reqs.filter((r) => (filter === 'All' || r.status === filter) &&
    `${r.itemName} ${r.userName} ${r.categoryName}`.toLowerCase().includes(q.toLowerCase()));

  const openAssign = (r) => { setAssign(r); setErr(''); setForm({ collectorId: r.collectorId || '', scheduledDate: r.scheduledDate || r.preferredDate || '' }); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api.assignRequest(assign.id, form); setAssign(null); reload(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Collection requests" subtitle="Assign collectors and follow every request." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search item, user or category" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-moss-800 text-white' : 'bg-white ring-1 ring-black/10 hover:bg-black/5'}`}>{f}</button>
          ))}
        </div>
      </div>

      <Table head={['#', 'Item', 'User', 'Category', 'Pickup', 'Collector', 'Status', '']}>
        {list.map((r) => (
          <tr key={r.id} className="hover:bg-black/[0.02]">
            <td className="td text-black/40">{r.id}</td>
            <td className="td"><p className="font-semibold">{r.itemName}</p><p className="text-xs text-black/45">qty {r.quantity} · {r.condition}</p></td>
            <td className="td">{r.userName}</td>
            <td className="td">{r.categoryName}</td>
            <td className="td">{fmtDate(r.scheduledDate || r.preferredDate)}</td>
            <td className="td">{r.collectorName || <span className="text-black/35">—</span>}</td>
            <td className="td"><Badge>{r.status}</Badge></td>
            <td className="td whitespace-nowrap text-right">
              <button className="btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => setDetail(r)}>History</button>
              {['Pending', 'Assigned'].includes(r.status) && (
                <button className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => openAssign(r)}>{r.status === 'Pending' ? 'Assign' : 'Reassign'}</button>
              )}
            </td>
          </tr>
        ))}
        {list.length === 0 && <tr><td colSpan={8} className="td py-10 text-center text-black/45">No requests found</td></tr>}
      </Table>

      <Modal open={!!assign} onClose={() => setAssign(null)} title={`Assign collector · #${assign?.id}`}>
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-black/60">{assign?.itemName} from {assign?.userName}<br /><span className="text-black/45">{assign?.pickupAddress}</span></p>
          <ErrorNote message={err} />
          <Field label="Collector">
            <select className="input" required value={form.collectorId} onChange={(e) => setForm({ ...form, collectorId: e.target.value })}>
              <option value="">Select collector</option>
              {collectors.map((c) => <option key={c.id} value={c.id}>{c.fullName} · {c.area} ({c.activeJobs} active)</option>)}
            </select>
          </Field>
          <Field label="Scheduled date"><input className="input" type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setAssign(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Assign'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Request #${detail?.id} history`}>
        {detail && <Timeline history={detail.history} />}
      </Modal>
    </>
  );
}
