import { useState } from 'react';
import { Factory, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, Empty, ErrorNote, Field, Loading, Modal, PageHeader, Table, fmtDate } from '../../components/ui.jsx';

export default function AdminProcessing() {
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.requests(), api.processing(), api.facilities()]), []);
  const [send, setSend] = useState(null);
  const [form, setForm] = useState({ facilityId: '', weightKg: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  const [reqs, records, facilities] = data;
  const ready = reqs.filter((r) => r.status === 'Collected');

  const start = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api.startProcessing({ requestId: send.id, ...form }); setSend(null); setForm({ facilityId: '', weightKg: '' }); reload(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const finish = async (id, finalStatus) => { try { await api.completeProcessing(id, { finalStatus }); reload(); } catch (x) { setErr(x.message); } };

  return (
    <>
      <PageHeader title="Processing & recycling" subtitle="Send collected items to a facility and record the final outcome." />
      <ErrorNote message={err} />

      <h2 className="mb-3 text-lg font-bold">Ready for processing <span className="text-black/35">({ready.length})</span></h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ready.length === 0 && <div className="card md:col-span-2 lg:col-span-3"><Empty title="No collected items waiting" hint="Items appear here once a collector marks them as collected." /></div>}
        {ready.map((r) => (
          <div key={r.id} className="card flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-2"><p className="font-display font-bold">{r.itemName}</p><Badge>{r.status}</Badge></div>
              <p className="mt-1 text-sm text-black/50">{r.categoryName} · qty {r.quantity}</p>
              <p className="text-xs text-black/40">Collected {fmtDate(r.collectedOn)} by {r.collectorName}</p>
            </div>
            <button className="btn-primary mt-4" onClick={() => { setSend(r); setErr(''); }}><Factory size={16} /> Send to facility</button>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Processing records</h2>
      <Table head={['#', 'Item', 'Facility', 'Weight', 'Process', 'Final outcome', 'Date / action']}>
        {records.map((p) => (
          <tr key={p.id}>
            <td className="td text-black/40">{p.id}</td>
            <td className="td"><p className="font-semibold">{p.itemName}</p><p className="text-xs text-black/45">{p.categoryName}</p></td>
            <td className="td">{p.facilityName}</td>
            <td className="td">{p.weightKg} kg</td>
            <td className="td"><Badge>{p.processStatus}</Badge></td>
            <td className="td">{p.finalStatus ? <Badge>{p.finalStatus}</Badge> : <span className="text-black/35">—</span>}</td>
            <td className="td whitespace-nowrap">
              {p.finalStatus ? fmtDate(p.processedOn) : (
                <div className="flex gap-1.5">
                  <button className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => finish(p.id, 'Recycled')}><CheckCircle2 size={14} /> Recycled</button>
                  <button className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => finish(p.id, 'Disposed')}><Trash2 size={14} /> Disposed</button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!send} onClose={() => setSend(null)} title="Send to recycling facility">
        <form onSubmit={start} className="space-y-4">
          <p className="text-sm text-black/60">{send?.itemName} × {send?.quantity}</p>
          <ErrorNote message={err} />
          <Field label="Facility">
            <select className="input" required value={form.facilityId} onChange={(e) => setForm({ ...form, facilityId: e.target.value })}>
              <option value="">Select facility</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.location}</option>)}
            </select>
          </Field>
          <Field label="Total weight (kg)"><input className="input" type="number" step="0.1" min="0.1" required value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setSend(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Start processing'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
