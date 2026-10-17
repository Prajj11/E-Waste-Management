// Single place where the UI talks to "the server".
// VITE_USE_MOCK=true  -> in-browser mock (no backend needed)
// VITE_USE_MOCK=false -> real Express API (see /backend)
import { mockRequest } from './mockServer.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'ecocycle_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

async function request(method, path, body) {
  const token = tokenStore.get();
  if (USE_MOCK) return mockRequest(method, path, body, token);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || 'Request failed'); e.status = res.status; throw e; }
  return data;
}

export const api = {
  login: (b) => request('POST', '/auth/login', b),
  register: (b) => request('POST', '/auth/register', b),

  categories: () => request('GET', '/categories'),
  addCategory: (b) => request('POST', '/categories', b),
  updateCategory: (id, b) => request('PUT', `/categories/${id}`, b),
  deleteCategory: (id) => request('DELETE', `/categories/${id}`),

  requests: () => request('GET', '/requests'),
  createRequest: (b) => request('POST', '/requests', b),
  assignRequest: (id, b) => request('PATCH', `/requests/${id}/assign`, b),
  setStatus: (id, b) => request('PATCH', `/requests/${id}/status`, b),

  users: () => request('GET', '/users'),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
  collectors: () => request('GET', '/collectors'),

  facilities: () => request('GET', '/facilities'),
  addFacility: (b) => request('POST', '/facilities', b),
  deleteFacility: (id) => request('DELETE', `/facilities/${id}`),

  processing: () => request('GET', '/processing'),
  startProcessing: (b) => request('POST', '/processing', b),
  completeProcessing: (id, b) => request('PATCH', `/processing/${id}`, b),

  summary: () => request('GET', '/reports/summary'),
};
