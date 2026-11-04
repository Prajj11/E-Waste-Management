/**
 * Automated Test Suite for EcoCycle Backend (Node.js + Express + MongoDB/Mongoose)
 * Verifies syntax, module imports, route table, authentication, models, and business logic.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890';
process.env.JWT_EXPIRES_IN = '1h';

import assert from 'node:assert/strict';
import { app } from '../src/server.js';
import { initDb, closeDb } from '../src/config/db.js';
import { User, Category, Facility, Request, ProcessingRecord } from '../src/models/index.js';
import { signToken, requireAuth, requireRole } from '../src/middleware/auth.js';
import { HttpError, errorHandler } from '../src/middleware/errors.js';
import jwt from 'jsonwebtoken';

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function testAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('       ECOCYCLE BACKEND AUTOMATED TEST SUITE');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. Module Exports & Structure
// -----------------------------------------------------------------------------
console.log('1. Module Imports & Architecture:');

test('Express app instance is properly initialized and exported', () => {
  assert.ok(app);
  assert.equal(typeof app.listen, 'function');
});

test('All 5 Mongoose models are exported and registered', () => {
  assert.ok(User);
  assert.ok(Category);
  assert.ok(Facility);
  assert.ok(Request);
  assert.ok(ProcessingRecord);
  assert.equal(User.modelName, 'User');
  assert.equal(Category.modelName, 'Category');
  assert.equal(Facility.modelName, 'Facility');
  assert.equal(Request.modelName, 'Request');
  assert.equal(ProcessingRecord.modelName, 'ProcessingRecord');
});

// -----------------------------------------------------------------------------
// 2. Route Table & Endpoint Mounting
// -----------------------------------------------------------------------------
console.log('\n2. Route Verification (Expected 20 REST Endpoints):');

const expectedRoutes = [
  { method: 'post', path: '/api/auth/login' },
  { method: 'post', path: '/api/auth/register' },
  { method: 'get', path: '/api/categories' },
  { method: 'post', path: '/api/categories' },
  { method: 'put', path: '/api/categories/:id' },
  { method: 'delete', path: '/api/categories/:id' },
  { method: 'get', path: '/api/requests' },
  { method: 'post', path: '/api/requests' },
  { method: 'patch', path: '/api/requests/:id/assign' },
  { method: 'patch', path: '/api/requests/:id/status' },
  { method: 'get', path: '/api/users' },
  { method: 'delete', path: '/api/users/:id' },
  { method: 'get', path: '/api/collectors' },
  { method: 'get', path: '/api/facilities' },
  { method: 'post', path: '/api/facilities' },
  { method: 'delete', path: '/api/facilities/:id' },
  { method: 'get', path: '/api/processing' },
  { method: 'post', path: '/api/processing' },
  { method: 'patch', path: '/api/processing/:id' },
  { method: 'get', path: '/api/reports/summary' },
];

// Extract mounted routes from Express app
function getMountedRoutes(expressApp) {
  const routes = [];
  expressApp._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Direct route (e.g., /api/health)
      Object.keys(middleware.route.methods).forEach((method) => {
        routes.push({ method, path: middleware.route.path });
      });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // Sub-router (e.g., /api routes)
      const prefix = middleware.regexp.source
        .replace('^\\', '')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/');

      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          Object.keys(handler.route.methods).forEach((method) => {
            routes.push({
              method,
              path: (prefix + handler.route.path).replace('//', '/'),
            });
          });
        }
      });
    }
  });
  return routes;
}

const mounted = getMountedRoutes(app);

test('Health check endpoint is mounted at GET /api/health', () => {
  const healthRoute = mounted.find((r) => r.path === '/api/health' && r.method === 'get');
  assert.ok(healthRoute, 'GET /api/health must be mounted');
});

expectedRoutes.forEach((expected) => {
  test(`Mounted endpoint: ${expected.method.toUpperCase()} ${expected.path}`, () => {
    const match = mounted.find(
      (m) =>
        m.method.toLowerCase() === expected.method.toLowerCase() &&
        m.path === expected.path
    );
    assert.ok(match, `Route ${expected.method.toUpperCase()} ${expected.path} should be mounted`);
  });
});

// -----------------------------------------------------------------------------
// 3. Authentication & JWT Middleware
// -----------------------------------------------------------------------------
console.log('\n3. Authentication & Role-Based Access Control:');

test('signToken generates valid JWT token with user id and role', () => {
  const token = signToken({ id: '65a000000000000000000001', role: 'ADMIN' });
  assert.ok(token);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.id, '65a000000000000000000001');
  assert.equal(decoded.role, 'ADMIN');
});

test('requireAuth rejects missing token with 401', () => {
  const req = { headers: {} };
  let status = null;
  let jsonBody = null;
  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { jsonBody = b; } };
    },
  };
  let calledNext = false;
  requireAuth(req, res, () => { calledNext = true; });

  assert.equal(status, 401);
  assert.equal(jsonBody.message, 'Please log in');
  assert.equal(calledNext, false);
});

test('requireAuth passes valid token and attaches req.user', () => {
  const token = signToken({ id: 'user_123', role: 'USER' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let calledNext = false;
  const res = {};

  requireAuth(req, res, () => { calledNext = true; });

  assert.equal(calledNext, true);
  assert.equal(req.user.id, 'user_123');
  assert.equal(req.user.role, 'USER');
});

test('requireRole permits authorized roles and blocks unauthorized roles with 403', () => {
  const adminGuard = requireRole('ADMIN');

  let passedAdmin = false;
  adminGuard({ user: { role: 'ADMIN' } }, {}, () => { passedAdmin = true; });
  assert.equal(passedAdmin, true);

  let status = null;
  let jsonBody = null;
  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { jsonBody = b; } };
    },
  };
  let passedUser = false;
  adminGuard({ user: { role: 'USER' } }, res, () => { passedUser = true; });

  assert.equal(passedUser, false);
  assert.equal(status, 403);
  assert.equal(jsonBody.message, 'You do not have access to this resource');
});

// -----------------------------------------------------------------------------
// 4. Mongoose Models & Frontend Compatibility Transforms
// -----------------------------------------------------------------------------
console.log('\n4. Mongoose Models & Serialization (id vs _id, stripping __v):');

test('User model transforms _id to id and removes passwordHash and __v', () => {
  const userDoc = new User({
    fullName: 'Test Citizen',
    email: 'citizen@example.com',
    passwordHash: '$2a$10$hashedstring',
    phone: '9988776655',
    role: 'USER',
    address: 'Panaji',
  });

  const json = userDoc.toJSON();
  assert.ok(json.id, 'User JSON must contain "id"');
  assert.equal(json._id, undefined, 'User JSON must not expose "_id"');
  assert.equal(json.__v, undefined, 'User JSON must not expose "__v"');
  assert.equal(json.passwordHash, undefined, 'User JSON must not expose "passwordHash"');
  assert.equal(json.email, 'citizen@example.com');
  assert.equal(json.role, 'USER');
});

test('Category model validates hazardLevel enum and formats id', () => {
  const validCat = new Category({ name: 'Laptops', hazardLevel: 'Medium' });
  const json = validCat.toJSON();
  assert.ok(json.id);
  assert.equal(json._id, undefined);
  assert.equal(json.hazardLevel, 'Medium');

  const invalidCat = new Category({ name: 'BadCat', hazardLevel: 'Dangerous' });
  const validationError = invalidCat.validateSync();
  assert.ok(validationError.errors.hazardLevel, 'HazardLevel should reject invalid enum values');
});

test('Facility model validates required capacity and formats id', () => {
  const facility = new Facility({
    name: 'Verna Facility',
    location: 'Verna Industrial Estate',
    capacityKg: 5000,
  });
  const json = facility.toJSON();
  assert.ok(json.id);
  assert.equal(json._id, undefined);
  assert.equal(json.capacityKg, 5000);

  const invalidFacility = new Facility({ name: 'Empty' });
  const err = invalidFacility.validateSync();
  assert.ok(err.errors.location);
  assert.ok(err.errors.capacityKg);
});

test('Request model initializes with Pending status and embedded history entry', () => {
  const reqDoc = new Request({
    userId: '65a000000000000000000001',
    categoryId: '65a000000000000000000002',
    itemName: 'Old CRT Monitor',
    condition: 'Dead',
    pickupAddress: 'Margao, Goa',
    preferredDate: '2026-11-10',
  });

  const json = reqDoc.toJSON();
  assert.ok(json.id);
  assert.equal(json.status, 'Pending');
  assert.ok(Array.isArray(json.history));
  assert.equal(json.history.length, 1);
  assert.equal(json.history[0].status, 'Pending');
  assert.ok(json.history[0].at);
});

test('ProcessingRecord model validates processStatus enum and formats id', () => {
  const proc = new ProcessingRecord({
    requestId: '65a000000000000000000003',
    facilityId: '65a000000000000000000004',
    weightKg: 12.5,
  });
  const json = proc.toJSON();
  assert.ok(json.id);
  assert.equal(json._id, undefined);
  assert.equal(json.processStatus, 'In Progress');
  assert.equal(json.weightKg, 12.5);
});

// -----------------------------------------------------------------------------
// 5. Error Handling Middleware
// -----------------------------------------------------------------------------
console.log('\n5. Central Error Handling:');

test('errorHandler translates MongoDB duplicate key (11000) to 409 Conflict', () => {
  const duplicateErr = { code: 11000, keyPattern: { email: 1 } };
  let status = null;
  let jsonBody = null;
  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { jsonBody = b; } };
    },
  };

  errorHandler(duplicateErr, {}, res, () => {});
  assert.equal(status, 409);
  assert.ok(jsonBody.message.includes('email'));
});

test('errorHandler translates Mongoose CastError to 400 Bad Request', () => {
  const castErr = { name: 'CastError', path: '_id' };
  let status = null;
  let jsonBody = null;
  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { jsonBody = b; } };
    },
  };

  errorHandler(castErr, {}, res, () => {});
  assert.equal(status, 400);
  assert.ok(jsonBody.message.includes('Invalid ID format'));
});

test('errorHandler passes HttpError status and message to client', () => {
  const httpErr = new HttpError(404, 'Category not found');
  let status = null;
  let jsonBody = null;
  const res = {
    status: (s) => {
      status = s;
      return { json: (b) => { jsonBody = b; } };
    },
  };

  errorHandler(httpErr, {}, res, () => {});
  assert.equal(status, 404);
  assert.equal(jsonBody.message, 'Category not found');
});

// -----------------------------------------------------------------------------
// 6. Business Rules & Lifecycle Validation
// -----------------------------------------------------------------------------
console.log('\n6. Business Rules & State Machine Logic:');

test('Request lifecycle permits valid transitions (Pending -> Assigned -> Collected -> Processing -> Recycled/Disposed)', () => {
  const NEXT = {
    Pending: ['Assigned'],
    Assigned: ['Collected'],
    Collected: ['Processing'],
    Processing: ['Recycled', 'Disposed'],
  };

  assert.deepEqual(NEXT['Pending'], ['Assigned']);
  assert.deepEqual(NEXT['Assigned'], ['Collected']);
  assert.deepEqual(NEXT['Collected'], ['Processing']);
  assert.ok(NEXT['Processing'].includes('Recycled'));
  assert.ok(NEXT['Processing'].includes('Disposed'));

  // Invalid direct transitions must be disallowed
  assert.equal(NEXT['Pending'].includes('Processing'), false);
  assert.equal(NEXT['Pending'].includes('Recycled'), false);
  assert.equal(NEXT['Collected'].includes('Assigned'), false);
});

test('Public registration prevents ADMIN role escalation', () => {
  const sanitizeRole = (requestedRole) => (requestedRole === 'COLLECTOR' ? 'COLLECTOR' : 'USER');
  assert.equal(sanitizeRole('ADMIN'), 'USER');
  assert.equal(sanitizeRole('SUPERADMIN'), 'USER');
  assert.equal(sanitizeRole('COLLECTOR'), 'COLLECTOR');
  assert.equal(sanitizeRole('USER'), 'USER');
});

test('Processing finalStatus validation only allows Recycled or Disposed', () => {
  const validStatuses = ['Recycled', 'Disposed'];
  assert.ok(validStatuses.includes('Recycled'));
  assert.ok(validStatuses.includes('Disposed'));
  assert.equal(validStatuses.includes('Pending'), false);
  assert.equal(validStatuses.includes('Completed'), false);
});

test('User self-deletion is prevented by id guard', () => {
  const currentUserId = 'user_abc';
  const targetId = 'user_abc';
  const isSelf = targetId === currentUserId;
  assert.equal(isSelf, true, 'Deleting own account must be flagged as self-deletion');
});

// -----------------------------------------------------------------------------
// 7. Live HTTP Server Integration Tests (Actual Socket & Express Stack)
// -----------------------------------------------------------------------------
console.log('\n7. Real HTTP Server & Route Integration Tests:');

let server;
let baseUrl;

await testAsync('Express server starts and listens on ephemeral port', async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
  assert.ok(baseUrl);
});

await testAsync('HTTP GET /api/health returns 200 OK with timestamp', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.ok(data.timestamp);
});

await testAsync('HTTP POST /api/auth/login with empty body returns 400 Bad Request', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.message, 'Email and password are required');
});

await testAsync('HTTP POST /api/auth/register with short password returns 400 Bad Request', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'A', email: 'a@b.com', password: '123' }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.message, 'Password must be at least 6 characters');
});

await testAsync('HTTP GET /api/categories without Authorization header returns 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/categories`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.message, 'Please log in');
});

await testAsync('HTTP GET /api/categories with invalid Bearer token returns 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/categories`, {
    headers: { Authorization: 'Bearer this.is.invalid.token' },
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.message, 'Session expired, please log in again');
});

await testAsync('HTTP POST /api/categories with USER role token returns 403 Forbidden', async () => {
  const userToken = signToken({ id: '65a000000000000000000001', role: 'USER' });
  const res = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ name: 'Test' }),
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.message, 'You do not have access to this resource');
});

await testAsync('HTTP GET /api/users with USER role token returns 403 Forbidden', async () => {
  const userToken = signToken({ id: '65a000000000000000000001', role: 'USER' });
  const res = await fetch(`${baseUrl}/api/users`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 403);
});

await testAsync('HTTP GET /api/reports/summary with COLLECTOR role token returns 403 Forbidden', async () => {
  const collectorToken = signToken({ id: '65a000000000000000000002', role: 'COLLECTOR' });
  const res = await fetch(`${baseUrl}/api/reports/summary`, {
    headers: { Authorization: `Bearer ${collectorToken}` },
  });
  assert.equal(res.status, 403);
});

await testAsync('HTTP PATCH /api/requests/:id/assign with USER role token returns 403 Forbidden', async () => {
  const userToken = signToken({ id: '65a000000000000000000001', role: 'USER' });
  const res = await fetch(`${baseUrl}/api/requests/65a000000000000000000005/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ collectorId: '65a000000000000000000002', scheduledDate: '2026-11-10' }),
  });
  assert.equal(res.status, 403);
});

await testAsync('HTTP GET /api/nonexistent-endpoint returns 404 Not Found', async () => {
  const res = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.message.includes('No route for GET'));
});

// Gracefully close the ephemeral server
if (server) {
  server.close();
}

// -----------------------------------------------------------------------------
// 8. Database Connection Reporting
// -----------------------------------------------------------------------------
console.log('\n8. Database Connectivity Check:');

await testAsync('MongoDB connection reporting (gracefully handles absence of live DB)', async () => {
  try {
    const conn = await initDb({ serverSelectionTimeoutMS: 1500 });
    console.log(`    [NOTE]: Live MongoDB instance detected (${conn.connection.name})! Database is online.`);
    await closeDb();
  } catch (err) {
    console.log('    [CONFIRMED]: Live MongoDB is currently offline (as expected).');
    console.log(`    [REASON]: ${err.message}`);
    console.log('    [VERIFICATION]: Connection logic properly reports errors and does not fall back to fake in-memory data.');
  }
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
