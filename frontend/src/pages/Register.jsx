import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { ErrorNote, Field, Logo } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ role: 'USER', fullName: '', email: '', phone: '', password: '', address: '', vehicleNo: '', area: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true); setError('');
    try { const u = await register(form); nav(homeFor(u.role)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <form onSubmit={submit} className="card w-full max-w-lg space-y-5 p-7">
        <Link to="/"><Logo /></Link>
        <div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-black/55">Join as a household user or as a collector.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
          {[['USER', 'I have e-waste'], ['COLLECTOR', 'I collect e-waste']].map(([r, l]) => (
            <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${form.role === r ? 'bg-white shadow-sm' : 'text-black/55'}`}>{l}</button>
          ))}
        </div>

        <ErrorNote message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="input" required value={form.fullName} onChange={set('fullName')} /></Field>
          <Field label="Phone"><input className="input" required pattern="[0-9]{10}" title="10-digit phone number" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label="Password"><input className="input" type="password" required value={form.password} onChange={set('password')} /></Field>
        </div>
        <Field label="Address"><textarea className="input" rows={2} required value={form.address} onChange={set('address')} /></Field>

        {form.role === 'COLLECTOR' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle number"><input className="input" required value={form.vehicleNo} onChange={set('vehicleNo')} placeholder="GA-07-T-0000" /></Field>
            <Field label="Service area"><input className="input" required value={form.area} onChange={set('area')} placeholder="North Goa" /></Field>
          </div>
        )}

        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-black/55">Already registered? <Link to="/login" className="font-semibold text-moss-700 hover:underline">Log in</Link></p>
      </form>
    </div>
  );
}
