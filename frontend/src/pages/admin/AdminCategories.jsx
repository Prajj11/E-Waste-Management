import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { Badge, ErrorNote, Field, Loading, Modal, PageHeader, Table } from '../../components/ui.jsx';

const blank = { name: '', hazardLevel: 'Low', description: '' };

export default function AdminCategories() {
  const { data, loading, error, reload } = useAsync(() => api.categories(), []);
  const [edit, setEdit] = useState(null); // null | {id?, ...fields}
  const [err, setErr] = useState('');
  if (loading) return <Loading />;

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { edit.id ? await api.updateCategory(edit.id, edit) : await api.addCategory(edit); setEdit(null); reload(); }
    catch (x) { setErr(x.message); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try { await api.deleteCategory(c.id); reload(); } catch (x) { setErr(x.message); }
  };

  return (
    <>
      <PageHeader title="E-waste categories" subtitle="Types of electronic waste accepted by the system."
        action={<button className="btn-primary" onClick={() => { setEdit(blank); setErr(''); }}><Plus size={16} /> Add category</button>} />
      <ErrorNote message={error || (!edit && err)} />
      <Table head={['Category', 'Description', 'Hazard level', '']}>
        {data.map((c) => (
          <tr key={c.id}>
            <td className="td font-semibold">{c.name}</td>
            <td className="td text-black/60">{c.description}</td>
            <td className="td"><Badge tone={c.hazardLevel}>{c.hazardLevel}</Badge></td>
            <td className="td whitespace-nowrap text-right">
              <button className="btn-ghost !p-2" aria-label={`Edit ${c.name}`} onClick={() => { setEdit(c); setErr(''); }}><Pencil size={16} /></button>
              <button className="btn-ghost !p-2 text-red-600" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 size={16} /></button>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit category' : 'Add category'}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <ErrorNote message={err} />
            <Field label="Name"><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Hazard level">
              <select className="input" value={edit.hazardLevel} onChange={(e) => setEdit({ ...edit, hazardLevel: e.target.value })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </Field>
            <Field label="Description"><textarea className="input" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
