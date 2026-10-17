import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAsync } from '../../utils/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, ErrorNote, Loading, PageHeader, Table, fmtDate } from '../../components/ui.jsx';

const ROLE_TONE = { ADMIN: 'Processing', COLLECTOR: 'Assigned', USER: 'Recycled' };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.users(), []);
  const [err, setErr] = useState('');
  const [role, setRole] = useState('ALL');
  if (loading) return <Loading />;
  const list = data.filter((u) => role === 'ALL' || u.role === role);

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.fullName}?`)) return;
    try { await api.deleteUser(u.id); reload(); } catch (x) { setErr(x.message); }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Everyone registered in the system." />
      <ErrorNote message={error || err} />
      <div className="mb-4 flex gap-2">
        {['ALL', 'USER', 'COLLECTOR', 'ADMIN'].map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${role === r ? 'bg-moss-800 text-white' : 'bg-white ring-1 ring-black/10 hover:bg-black/5'}`}>{r.toLowerCase()}</button>
        ))}
      </div>
      <Table head={['Name', 'Email', 'Phone', 'Role', 'Joined', '']}>
        {list.map((u) => (
          <tr key={u.id}>
            <td className="td font-semibold">{u.fullName}</td>
            <td className="td text-black/60">{u.email}</td>
            <td className="td">{u.phone}</td>
            <td className="td"><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge></td>
            <td className="td">{fmtDate(u.createdAt)}</td>
            <td className="td text-right">
              {u.id !== me.id && <button className="btn-ghost !p-2 text-red-600" aria-label={`Delete ${u.fullName}`} onClick={() => remove(u)}><Trash2 size={16} /></button>}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
