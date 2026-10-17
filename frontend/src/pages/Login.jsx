import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { ErrorNote, Field, Logo } from '../components/ui.jsx';

const DEMO = [
  { label: 'Admin', email: 'admin@ecocycle.in', password: 'admin123' },
  { label: 'Collector', email: 'rahul@ecocycle.in', password: 'collect123' },
  { label: 'User', email: 'priya@example.com', password: 'user123' },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { const u = await login(form); nav(homeFor(u.role)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-moss-900 p-10 text-white lg:flex">
        <Link to="/"><Logo light /></Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Every device recycled is a landfill avoided.</h2>
          <p className="mt-4 max-w-md text-white/65">Log in to submit, track or manage e-waste collection and recycling.</p>
        </div>
        <p className="text-xs text-white/40">E-Waste Management System</p>
      </div>

      <div className="grid place-items-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-black/55">Log in to your account</p>
          </div>
          <ErrorNote message={error} />
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></Field>
          <Field label="Password"><input className="input" type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="current-password" /></Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
          <p className="text-center text-sm text-black/55">New here? <Link to="/register" className="font-semibold text-moss-700 hover:underline">Create an account</Link></p>

          <div className="rounded-xl border border-dashed border-black/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Demo accounts (click to fill)</p>
            <div className="flex flex-wrap gap-2">
              {DEMO.map((d) => (
                <button type="button" key={d.label} className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setForm({ email: d.email, password: d.password })}>{d.label}</button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
