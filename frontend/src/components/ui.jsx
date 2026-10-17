import { useEffect } from 'react';
import { X, Leaf, Inbox, Loader2 } from 'lucide-react';

export const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  Assigned: 'bg-sky-100 text-sky-800 ring-sky-200',
  Collected: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  Processing: 'bg-violet-100 text-violet-800 ring-violet-200',
  Recycled: 'bg-moss-100 text-moss-800 ring-moss-200',
  Disposed: 'bg-stone-200 text-stone-700 ring-stone-300',
  'In Progress': 'bg-violet-100 text-violet-800 ring-violet-200',
  Completed: 'bg-moss-100 text-moss-800 ring-moss-200',
  High: 'bg-red-100 text-red-800 ring-red-200',
  Medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  Low: 'bg-moss-100 text-moss-800 ring-moss-200',
};

export const Badge = ({ children, tone }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[tone ?? children] || 'bg-stone-100 text-stone-700 ring-stone-200'}`}>
    {children}
  </span>
);

export const Logo = ({ light = false }) => (
  <div className="flex items-center gap-2.5">
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-white/15 text-white' : 'bg-moss-700 text-white'}`}>
      <Leaf size={20} />
    </span>
    <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>EcoCycle</span>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-black/55">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'moss' }) => {
  const tones = {
    moss: 'bg-moss-100 text-moss-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black/55">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-black/45">{hint}</p>}
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={`card max-h-[90vh] w-full overflow-auto p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
  </label>
);

export const Empty = ({ title = 'Nothing here yet', hint }) => (
  <div className="grid place-items-center gap-2 px-6 py-14 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full bg-moss-50 text-moss-600"><Inbox size={22} /></span>
    <p className="font-semibold">{title}</p>
    {hint && <p className="max-w-xs text-sm text-black/50">{hint}</p>}
  </div>
);

export const Loading = () => (
  <div className="grid place-items-center py-16 text-moss-700"><Loader2 className="animate-spin" /></div>
);

export const ErrorNote = ({ message }) =>
  message ? <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200" role="alert">{message}</p> : null;

export const Table = ({ head, children }) => (
  <div className="card overflow-x-auto">
    <table className="w-full min-w-[640px]">
      <thead className="border-b border-black/5 bg-black/[0.02]">
        <tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-black/5">{children}</tbody>
    </table>
  </div>
);

export const Timeline = ({ history = [] }) => (
  <ol className="relative ml-2 border-l-2 border-moss-200 pl-5">
    {history.map((h, i) => (
      <li key={i} className="relative pb-4 last:pb-0">
        <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-moss-600 ring-2 ring-moss-200" />
        <div className="flex items-center gap-2"><Badge>{h.status}</Badge></div>
        <p className="mt-1 text-xs text-black/45">{new Date(h.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </li>
    ))}
  </ol>
);

export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
