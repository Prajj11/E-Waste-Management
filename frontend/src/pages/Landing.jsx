import { Link } from 'react-router-dom';
import { ArrowRight, PackagePlus, Truck, Recycle, ShieldCheck, BarChart3, Leaf } from 'lucide-react';
import { Logo } from '../components/ui.jsx';

const steps = [
  { icon: PackagePlus, title: 'Submit', text: 'Tell us what you have: category, condition, quantity and pickup slot.' },
  { icon: Truck, title: 'We collect', text: 'An admin assigns a collector who picks up from your doorstep.' },
  { icon: Recycle, title: 'Processed', text: 'Items go to a certified facility and are recycled or safely disposed of.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.1fr_.9fr] lg:pt-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-moss-100 px-3 py-1 text-xs font-semibold text-moss-800">
            <Leaf size={14} /> DBMS Lab Mini Project
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Give your old electronics <span className="text-moss-600">a second life.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-black/60">
            EcoCycle manages the whole journey of e-waste in one database: submission, doorstep collection, processing and final recycling, with live status tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary !px-6 !py-3 text-base">Submit e-waste <ArrowRight size={18} /></Link>
            <Link to="/login" className="btn-outline !px-6 !py-3 text-base">I already have an account</Link>
          </div>
        </div>

        <div className="card relative overflow-hidden bg-moss-900 p-7 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-moss-600/40 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-widest text-moss-300">Live tracking</p>
          <div className="mt-5 space-y-4">
            {['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled'].map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i < 4 ? 'bg-moss-400 text-moss-900' : 'bg-white text-moss-800'}`}>{i + 1}</span>
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-sm font-semibold">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-moss-100 text-moss-700"><Icon size={22} /></span>
              <h3 className="mt-4 text-lg font-bold">{i + 1}. {title}</h3>
              <p className="mt-1.5 text-sm text-black/60">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-2">
        <div className="card flex gap-4 p-6">
          <ShieldCheck className="shrink-0 text-moss-700" />
          <div><h3 className="font-bold">Role-based access</h3><p className="mt-1 text-sm text-black/60">Separate workspaces for users, collectors and administrators.</p></div>
        </div>
        <div className="card flex gap-4 p-6">
          <BarChart3 className="shrink-0 text-moss-700" />
          <div><h3 className="font-bold">Reports that matter</h3><p className="mt-1 text-sm text-black/60">Collected, pending, processed, recycled and disposed e-waste at a glance.</p></div>
        </div>
      </section>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-black/45">EcoCycle · E-Waste Management System</footer>
    </div>
  );
}
