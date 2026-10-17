import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, ErrorNote, Field, Loading, PageHeader } from '../../components/ui.jsx';

const CONDITIONS = ['Working', 'Damaged', 'Dead'];
const today = () => new Date().toISOString().slice(0, 10);

export default function SubmitEwaste() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: cats, loading } = useAsync(() => api.categories(), []);
  const [form, setForm] = useState({ categoryId: '', itemName: '', quantity: 1, condition: 'Working', pickupAddress: user.address || '', preferredDate: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <Loading />;
  const cat = cats?.find((c) => String(c.id) === String(form.categoryId));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.createRequest(form); setDone(true); setTimeout(() => nav('/user/requests'), 1400); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  if (done) {
    return (
      <div className="card mx-auto mt-10 grid max-w-md place-items-center gap-3 p-10 text-center">
        <CheckCircle2 className="text-moss-600" size={48} />
        <h2 className="text-xl font-bold">Request submitted</h2>
        <p className="text-sm text-black/55">An admin will assign a collector shortly. Redirecting to your requests…</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Submit e-waste" subtitle="Tell us about the item and when we can pick it up." />
      <form onSubmit={submit} className="card max-w-3xl space-y-5 p-6 sm:p-8">
        <ErrorNote message={error} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select className="input" required value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Select a category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Item name"><input className="input" required value={form.itemName} onChange={set('itemName')} placeholder="e.g. Dell Inspiron 15" /></Field>
          <Field label="Quantity"><input className="input" type="number" min="1" max="500" required value={form.quantity} onChange={set('quantity')} /></Field>
          <Field label="Condition">
            <div className="grid grid-cols-3 gap-2">
              {CONDITIONS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, condition: c })}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${form.condition === c ? 'border-moss-600 bg-moss-50 text-moss-800' : 'border-black/15 bg-white hover:bg-black/5'}`}>{c}</button>
              ))}
            </div>
          </Field>
        </div>

        {cat?.hazardLevel === 'High' && (
          <div className="flex gap-3 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p><strong>{cat.name}</strong> is a <Badge tone="High">High</Badge> hazard category. Please keep items intact and do not open or puncture them.</p>
          </div>
        )}

        <Field label="Pickup address"><textarea className="input" rows={2} required value={form.pickupAddress} onChange={set('pickupAddress')} /></Field>
        <Field label="Preferred pickup date"><input className="input sm:max-w-xs" type="date" min={today()} required value={form.preferredDate} onChange={set('preferredDate')} /></Field>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Request collection'}</button>
          <button type="button" className="btn-ghost" onClick={() => nav('/user')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
