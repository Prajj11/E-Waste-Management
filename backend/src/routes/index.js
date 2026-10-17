import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../middleware/errors.js';
import * as auth from '../controllers/auth.controller.js';
import * as reqs from '../controllers/requests.controller.js';
import * as cat from '../controllers/catalog.controller.js';
import * as proc from '../controllers/processing.controller.js';
import * as reports from '../controllers/reports.controller.js';

const r = Router();
const admin = [requireAuth, requireRole('ADMIN')];

// Registration and Login module
r.post('/auth/login', wrap(auth.login));
r.post('/auth/register', wrap(auth.register));

// Categories (everyone logged in can read, only admins change)
r.get('/categories', requireAuth, wrap(cat.listCategories));
r.post('/categories', ...admin, wrap(cat.addCategory));
r.put('/categories/:id', ...admin, wrap(cat.updateCategory));
r.delete('/categories/:id', ...admin, wrap(cat.deleteCategory));

// E-Waste submission + Collection module
r.get('/requests', requireAuth, wrap(reqs.list));
r.post('/requests', requireAuth, requireRole('USER'), wrap(reqs.create));
r.patch('/requests/:id/assign', ...admin, wrap(reqs.assign));
r.patch('/requests/:id/status', requireAuth, requireRole('ADMIN', 'COLLECTOR'), wrap(reqs.setStatus));

// Admin module
r.get('/users', ...admin, wrap(cat.listUsers));
r.delete('/users/:id', ...admin, wrap(cat.deleteUser));
r.get('/collectors', ...admin, wrap(cat.listCollectors));
r.get('/facilities', requireAuth, wrap(cat.listFacilities));
r.post('/facilities', ...admin, wrap(cat.addFacility));
r.delete('/facilities/:id', ...admin, wrap(cat.deleteFacility));

// Processing and Recycling module
r.get('/processing', ...admin, wrap(proc.list));
r.post('/processing', ...admin, wrap(proc.start));
r.patch('/processing/:id', ...admin, wrap(proc.complete));

// Reports module
r.get('/reports/summary', ...admin, wrap(reports.summary));

export default r;
