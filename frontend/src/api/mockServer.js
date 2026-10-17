// A tiny in-browser "server" that implements the same REST contract as backend/src/routes.
// It lets the frontend run stand-alone (VITE_USE_MOCK=true). State persists in localStorage.
import { seedData } from './seed.js';

const KEY = 'ecocycle_db_v1';
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const fresh = seedData();
  save(fresh);
  return fresh;
};
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
export const resetMockDb = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, msg) => { throw new HttpError(status, msg); };

const publicUser = ({ password, ...u }) => u;
const tokenFor = (u) => btoa(JSON.stringify({ id: u.id, role: u.role }));
const decode = (token) => { try { return JSON.parse(atob(token)); } catch { return null; } };

const FLOW = ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'];

// attach joined display fields, the way the SQL views do
const enrichRequest = (db, r) => ({
  ...r,
  categoryName: db.categories.find((c) => c.id === r.categoryId)?.name ?? '—',
  collectorName: db.collectors.find((c) => c.id === r.collectorId)?.fullName ?? null,
});
const enrichProcessing = (db, p) => {
  const r = db.requests.find((x) => x.id === p.requestId);
  return {
    ...p,
    itemName: r?.itemName ?? '—',
    categoryName: db.categories.find((c) => c.id === r?.categoryId)?.name ?? '—',
    facilityName: db.facilities.find((f) => f.id === p.facilityId)?.name ?? '—',
  };
};

const pushStatus = (r, status) => {
  r.status = status;
  r.history = [...(r.history || []), { status, at: new Date().toISOString() }];
};

const requireRole = (me, ...roles) => { if (!me || !roles.includes(me.role)) fail(403, 'You do not have access to this resource'); };

const summary = (db) => {
  const reqs = db.requests;
  const kg = (p) => p.weightKg || 0;
  const done = db.processing.filter((p) => p.finalStatus);
  const byStatus = FLOW.map((s) => ({ status: s, count: reqs.filter((r) => r.status === s).length }));
  const byCategory = db.categories
    .map((c) => ({ name: c.name, count: reqs.filter((r) => r.categoryId === c.id).reduce((a, r) => a + r.quantity, 0) }))
    .filter((c) => c.count > 0);
  const months = {};
  reqs.forEach((r) => {
    const k = r.createdAt.slice(0, 7);
    months[k] = (months[k] || 0) + 1;
  });
  const monthly = Object.keys(months).sort().map((k) => ({
    month: new Date(k + '-01').toLocaleString('en', { month: 'short' }),
    requests: months[k],
  }));
  const facilityLoad = db.facilities.map((f) => ({
    name: f.name,
    capacityKg: f.capacityKg,
    processedKg: Math.round(db.processing.filter((p) => p.facilityId === f.id).reduce((a, p) => a + kg(p), 0) * 10) / 10,
  }));
  const recycledKg = done.filter((p) => p.finalStatus === 'Recycled').reduce((a, p) => a + kg(p), 0);
  const disposedKg = done.filter((p) => p.finalStatus === 'Disposed').reduce((a, p) => a + kg(p), 0);
  return {
    totals: {
      users: db.users.filter((u) => u.role === 'USER').length,
      collectors: db.collectors.length,
      requests: reqs.length,
      pending: reqs.filter((r) => r.status === 'Pending').length,
      collected: reqs.filter((r) => ['Collected', 'Processing', 'Recycled', 'Disposed'].includes(r.status)).length,
      processed: reqs.filter((r) => ['Recycled', 'Disposed'].includes(r.status)).length,
      recycledKg: Math.round(recycledKg * 10) / 10,
      disposedKg: Math.round(disposedKg * 10) / 10,
      recyclingRate: recycledKg + disposedKg ? Math.round((recycledKg / (recycledKg + disposedKg)) * 100) : 0,
    },
    byStatus, byCategory, monthly, facilityLoad,
  };
};

// ---- router ---------------------------------------------------------------------------------
export async function mockRequest(method, path, body, token) {
  await delay();
  const db = load();
  const me = token ? decode(token) : null;
  const meUser = me ? db.users.find((u) => u.id === me.id) : null;
  const seg = path.replace(/^\/+|\/+$/g, '').split('/');
  const [res, id, action] = seg;
  const nid = id !== undefined ? Number(id) : undefined;
  const ok = (data) => { save(db); return data; };

  // auth
  if (res === 'auth' && id === 'login' && method === 'POST') {
    const u = db.users.find((x) => x.email.toLowerCase() === String(body.email).toLowerCase() && x.password === body.password);
    if (!u) fail(401, 'Invalid email or password');
    return { token: tokenFor(u), user: publicUser(u) };
  }
  if (res === 'auth' && id === 'register' && method === 'POST') {
    if (db.users.some((x) => x.email.toLowerCase() === body.email.toLowerCase())) fail(409, 'An account with this email already exists');
    const role = ['USER', 'COLLECTOR'].includes(body.role) ? body.role : 'USER'; // admins are never self-registered
    const u = { id: db.seq.user++, fullName: body.fullName, email: body.email, password: body.password, phone: body.phone || '', role, address: body.address || '', createdAt: new Date().toISOString() };
    db.users.push(u);
    if (role === 'COLLECTOR') db.collectors.push({ id: db.seq.collector++, userId: u.id, fullName: u.fullName, vehicleNo: body.vehicleNo || '—', area: body.area || '—', available: true });
    return ok({ token: tokenFor(u), user: publicUser(u) });
  }

  if (!meUser) fail(401, 'Please log in');

  // categories
  if (res === 'categories') {
    if (method === 'GET') return db.categories;
    requireRole(meUser, 'ADMIN');
    if (method === 'POST') { const c = { id: db.seq.category++, ...body }; db.categories.push(c); return ok(c); }
    if (method === 'PUT') { const c = db.categories.find((x) => x.id === nid); if (!c) fail(404, 'Not found'); Object.assign(c, body); return ok(c); }
    if (method === 'DELETE') {
      if (db.requests.some((r) => r.categoryId === nid)) fail(409, 'Category is used by existing requests');
      db.categories = db.categories.filter((x) => x.id !== nid); return ok({ deleted: true });
    }
  }

  // requests
  if (res === 'requests') {
    if (method === 'GET' && id === undefined) {
      let list = db.requests;
      if (meUser.role === 'USER') list = list.filter((r) => r.userId === meUser.id);
      if (meUser.role === 'COLLECTOR') {
        const col = db.collectors.find((c) => c.userId === meUser.id);
        list = list.filter((r) => r.collectorId === col?.id);
      }
      return list.map((r) => enrichRequest(db, r)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (method === 'GET') { const r = db.requests.find((x) => x.id === nid); if (!r) fail(404, 'Not found'); return enrichRequest(db, r); }
    if (method === 'POST') {
      requireRole(meUser, 'USER');
      const r = {
        id: db.seq.request++, userId: meUser.id, userName: meUser.fullName, categoryId: Number(body.categoryId), itemName: body.itemName,
        quantity: Number(body.quantity) || 1, condition: body.condition, pickupAddress: body.pickupAddress, preferredDate: body.preferredDate,
        status: 'Pending', collectorId: null, scheduledDate: null, collectedOn: null, remarks: '', createdAt: new Date().toISOString(),
        history: [{ status: 'Pending', at: new Date().toISOString() }],
      };
      db.requests.push(r);
      return ok(enrichRequest(db, r));
    }
    if (method === 'PATCH' && action === 'assign') {
      requireRole(meUser, 'ADMIN');
      const r = db.requests.find((x) => x.id === nid); if (!r) fail(404, 'Not found');
      r.collectorId = Number(body.collectorId); r.scheduledDate = body.scheduledDate; pushStatus(r, 'Assigned');
      return ok(enrichRequest(db, r));
    }
    if (method === 'PATCH' && action === 'status') {
      requireRole(meUser, 'ADMIN', 'COLLECTOR');
      const r = db.requests.find((x) => x.id === nid); if (!r) fail(404, 'Not found');
      if (!FLOW.includes(body.status)) fail(400, 'Invalid status');
      pushStatus(r, body.status);
      if (body.status === 'Collected') r.collectedOn = new Date().toISOString().slice(0, 10);
      if (body.remarks !== undefined) r.remarks = body.remarks;
      return ok(enrichRequest(db, r));
    }
  }

  // users / collectors
  if (res === 'users') {
    requireRole(meUser, 'ADMIN');
    if (method === 'GET') return db.users.map(publicUser);
    if (method === 'DELETE') {
      if (nid === meUser.id) fail(400, 'You cannot delete your own account');
      db.users = db.users.filter((u) => u.id !== nid);
      db.collectors = db.collectors.filter((c) => c.userId !== nid);
      return ok({ deleted: true });
    }
  }
  if (res === 'collectors') {
    requireRole(meUser, 'ADMIN');
    if (method === 'GET') return db.collectors.map((c) => ({ ...c, activeJobs: db.requests.filter((r) => r.collectorId === c.id && ['Assigned', 'Collected'].includes(r.status)).length }));
    if (method === 'PATCH') { const c = db.collectors.find((x) => x.id === nid); Object.assign(c, body); return ok(c); }
  }

  // facilities
  if (res === 'facilities') {
    if (method === 'GET') return db.facilities;
    requireRole(meUser, 'ADMIN');
    if (method === 'POST') { const f = { id: db.seq.facility++, ...body, capacityKg: Number(body.capacityKg) }; db.facilities.push(f); return ok(f); }
    if (method === 'DELETE') {
      if (db.processing.some((p) => p.facilityId === nid)) fail(409, 'Facility has processing records');
      db.facilities = db.facilities.filter((f) => f.id !== nid); return ok({ deleted: true });
    }
  }

  // processing & recycling
  if (res === 'processing') {
    requireRole(meUser, 'ADMIN');
    if (method === 'GET') return db.processing.map((p) => enrichProcessing(db, p)).sort((a, b) => b.id - a.id);
    if (method === 'POST') {
      const r = db.requests.find((x) => x.id === Number(body.requestId)); if (!r) fail(404, 'Request not found');
      if (r.status !== 'Collected') fail(400, 'Only collected items can be sent for processing');
      const p = { id: db.seq.processing++, requestId: r.id, facilityId: Number(body.facilityId), weightKg: Number(body.weightKg), processStatus: 'In Progress', finalStatus: null, processedOn: null };
      db.processing.push(p); pushStatus(r, 'Processing');
      return ok(enrichProcessing(db, p));
    }
    if (method === 'PATCH') {
      const p = db.processing.find((x) => x.id === nid); if (!p) fail(404, 'Not found');
      if (!['Recycled', 'Disposed'].includes(body.finalStatus)) fail(400, 'finalStatus must be Recycled or Disposed');
      p.finalStatus = body.finalStatus; p.processStatus = 'Completed'; p.processedOn = new Date().toISOString().slice(0, 10);
      pushStatus(db.requests.find((x) => x.id === p.requestId), body.finalStatus);
      return ok(enrichProcessing(db, p));
    }
  }

  if (res === 'reports' && id === 'summary') { requireRole(meUser, 'ADMIN'); return summary(db); }

  fail(404, `No route for ${method} /${seg.join('/')}`);
}
