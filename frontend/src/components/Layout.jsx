import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PackagePlus, ClipboardList, Users, Truck, Factory, Recycle, BarChart3, Tags, LogOut, Menu, X, Route,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from './ui.jsx';

const NAV = {
  USER: [
    { to: '/user', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/user/submit', label: 'Submit E-Waste', icon: PackagePlus },
    { to: '/user/requests', label: 'My Requests', icon: ClipboardList },
  ],
  COLLECTOR: [
    { to: '/collector', label: 'My Pickups', icon: Route, end: true },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/requests', label: 'Collection Requests', icon: ClipboardList },
    { to: '/admin/processing', label: 'Processing & Recycling', icon: Recycle },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/collectors', label: 'Collectors', icon: Truck },
    { to: '/admin/facilities', label: 'Recycling Facilities', icon: Factory },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV[user.role] || [];

  const sidebar = (
    <div className="flex h-full flex-col bg-moss-900 px-4 py-5 text-white">
      <div className="px-2 pb-6"><Logo light /></div>
      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 rounded-xl bg-white/8 p-3">
        <p className="truncate text-sm font-semibold">{user.fullName}</p>
        <p className="text-xs capitalize text-white/55">{user.role.toLowerCase()}</p>
        <button onClick={() => { logout(); nav('/login'); }} className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-white">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button className="btn-ghost !p-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            {sidebar}
            <button className="absolute right-3 top-4 text-white" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>
    </div>
  );
}
