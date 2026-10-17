import { useState } from 'react';
import { Plus, Trash2, BadgeCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { ErrorNote, Field, Loading, Modal, PageHeader } from '../../components/ui.jsx';

const blank = { name: '', location: '', capacityKg: '', certification: '' };

export default function AdminFacilities() {
  const { data, loading, error, reload } = useAsync(() => api.facilities(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [err, setErr] = useState('');
  if (loading) return <Loading />;

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.addFacility(form); setOpen(false); setForm(blank); reload(); } catch (x) { setErr(x.message); }
  };
  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try { await api.deleteFacility(f.id); reload(); } catch (x) { setErr(x.message); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Recycling facilities" subtitle="Authorised partners that process collected e-waste."
        action={<button className="btn-primary" onClick={() => { setOpen(true); setErr(''); }}><Plus size={16} /> Add facility</button>} />
      <ErrorNote message={error || (!open && err)} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((f) => (
          <div key={f.id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-display text-lg font-bold">{f.name}</p><p className="text-sm text-black/50">{f.location}</p></div>
              <button className="btn-ghost !p-2 text-red-600" aria-label={`Delete ${f.name}`} onClick={() => remove(f)}><Trash2 size={16} /></button>
            </div>
            <p className="mt-4 text-3xl font-bold">{f.capacityKg.toLocaleString()}<span className="ml-1 text-sm font-medium text-black/45">kg capacity</span></p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-moss-700"><BadgeCheck size={16} />{f.certification}</p>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add recycling facility">
        <form onSubmit={save} className="space-y-4">
          <ErrorNote message={err} />
          <Field label="Facility name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Location"><input className="input" required value={form.location} onChange={set('location')} /></Field>
          <Field label="Capacity (kg)"><input className="input" type="number" min="1" required value={form.capacityKg} onChange={set('capacityKg')} /></Field>
          <Field label="Certification"><input className="input" required value={form.certification} onChange={set('certification')} placeholder="e.g. CPCB Authorised" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
