# EcoCycle Backend · Express & MongoDB API

The backend REST API for **EcoCycle – E-Waste Management System**, migrated from Oracle Database to **Node.js, Express, and MongoDB (via Mongoose)**.

---

## 1. Architecture Overview

- **Runtime**: Node.js (ES Module format, `"type": "module"`)
- **Web Framework**: Express 4.x
- **Database**: MongoDB (via Mongoose 8.x ODM)
- **Authentication**: Stateless JSON Web Tokens (JWT) using `jsonwebtoken`
- **Security**: Password hashing using `bcryptjs` (salt rounds: 10), CORS enabled
- **Error Handling**: Centralized error middleware supporting custom `HttpError`, MongoDB unique conflicts (`code 11000`), Mongoose `ValidationError`, and `CastError`

```
Client (React SPA) 
      ↓ [HTTP REST: /api/* with Bearer JWT]
Express Router (/routes/index.js)
      ↓ [requireAuth, requireRole middlewares]
Controllers (auth, requests, catalog, processing, reports)
      ↓ [Mongoose Queries / Aggregations]
MongoDB Collections (users, categories, facilities, requests, processingrecords)
```

---

## 2. Directory Structure

```
backend/
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── package-lock.json         # Lockfile
├── README.md                 # Backend documentation
├── scripts/
│   ├── hash.js               # CLI helper to generate bcrypt hashes
│   └── seedMongo.js          # MongoDB seeder for demo accounts & master data
├── test/
│   └── runTests.js           # 40-check automated test suite
└── src/
    ├── server.js             # Express application & server entrypoint
    ├── config/
    │   └── db.js             # Mongoose connection & shutdown logic
    ├── middleware/
    │   ├── auth.js           # JWT verification & Role-Based Access Control (RBAC)
    │   └── errors.js         # HTTP error class and MongoDB error mappings
    ├── models/
    │   ├── index.js          # Models barrel export
    │   ├── User.js           # Users & Collectors collection schema
    │   ├── Category.js       # E-waste categories collection schema
    │   ├── Facility.js       # Recycling facilities collection schema
    │   ├── Request.js        # Collection requests & embedded status history
    │   └── ProcessingRecord.js # Facility processing and recycling outcomes
    ├── controllers/
    │   ├── auth.controller.js       # Login and Registration handlers
    │   ├── catalog.controller.js    # Categories, facilities, users, collectors CRUD
    │   ├── requests.controller.js   # Requests creation, listing, assignment, status
    │   ├── processing.controller.js # Facility processing and completion
    │   └── reports.controller.js    # Analytics totals & aggregations
    └── routes/
        └── index.js          # Central API route definitions
```

---

## 3. Installation & Environment Configuration

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Local MongoDB or MongoDB Atlas URI:
MONGODB_URI=mongodb://127.0.0.1:27017/ecocycle
# Atlas example:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ecocycle?retryWrites=true&w=majority

JWT_SECRET=your-secret-key-replace-with-secure-random-string
JWT_EXPIRES_IN=8h
```

---

## 4. Starting the Server & Database Seeding

### Start in Development Mode (Nodemon auto-reload):
```bash
npm run dev
```

### Start in Production Mode:
```bash
npm start
```

### Health Check:
Test that the server is responding:
```bash
curl http://localhost:5000/api/health
# Response: {"ok":true,"timestamp":"2026-11-04T18:00:00.000Z"}
```

### Seed Initial Demo Data:
Once MongoDB is online, populate demo users, categories, facilities, and initial requests:
```bash
npm run seed
```

#### Pre-configured Demo Accounts:
| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ecocycle.in` | `admin123` | Full administrative control & reports |
| **Collector** | `rahul@ecocycle.in` | `collect123` | Field agent in South Goa (vehicle `GA-07-T-4421`) |
| **Collector** | `meera@ecocycle.in` | `collect123` | Field agent in North Goa (vehicle `GA-03-K-9087`) |
| **Citizen** | `priya@example.com` | `user123` | Citizen user in Panaji |

---

## 5. MongoDB Collections & Schema Reference (For Database Coordination)

All models include a custom `toJSON` transform that replaces internal `_id` with `id`, removes `__v`, and strips `passwordHash` to maintain 100% frontend compatibility.

### 1. `users` Collection (`User.js`)
Stores citizens, collectors, and administrators in a single collection.
```javascript
{
  "_id": ObjectId("..."),
  "fullName": "Priya Desai",           // String, required, trim
  "email": "priya@example.com",        // String, required, unique, lowercase
  "passwordHash": "$2a$10$...",        // String, required (bcrypt hash)
  "phone": "9800000004",               // String, optional
  "role": "USER",                      // Enum: ['USER', 'COLLECTOR', 'ADMIN'], default 'USER'
  "address": "Panaji, Goa",            // String, optional
  "vehicleNo": "GA-07-T-4421",         // String, optional (for COLLECTOR)
  "area": "South Goa",                 // String, optional (for COLLECTOR)
  "createdAt": ISODate("...")          // Timestamp
}
```

### 2. `categories` Collection (`Category.js`)
E-waste item categories and hazard ratings.
```javascript
{
  "_id": ObjectId("..."),
  "name": "Laptops & Computers",       // String, required, unique, trim
  "description": "Laptops, monitors",  // String, optional
  "hazardLevel": "Medium",             // Enum: ['Low', 'Medium', 'High'], default 'Low'
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### 3. `facilities` Collection (`Facility.js`)
Authorized recycling and disposal processing facilities.
```javascript
{
  "_id": ObjectId("..."),
  "name": "GreenLoop Recyclers",       // String, required, trim
  "location": "Verna Industrial Area", // String, required
  "capacityKg": 5000,                  // Number, required, min: 1
  "certification": "CPCB Authorised",  // String, optional
  "createdAt": ISODate("...")
}
```

### 4. `requests` Collection (`Request.js`)
Core lifecycle tracking collection requests. Status history is stored as an **embedded subdocument array**.
```javascript
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),           // Ref: 'User', required
  "categoryId": ObjectId("..."),       // Ref: 'Category', required
  "itemName": "Dell Inspiron 15",      // String, required
  "quantity": 1,                       // Number, default 1, min: 1
  "condition": "Damaged",              // Enum: ['Working', 'Damaged', 'Dead']
  "pickupAddress": "Vasco, Goa",       // String, required
  "preferredDate": "2026-11-10",       // String (YYYY-MM-DD), required
  "status": "Assigned",                // Enum: ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed']
  "collectorId": ObjectId("..."),      // Ref: 'User' (role: COLLECTOR), default null
  "scheduledDate": "2026-11-12",       // String (YYYY-MM-DD), default null
  "collectedOn": null,                 // String (YYYY-MM-DD), default null
  "remarks": null,                     // String, optional
  "history": [                         // Embedded array of status transitions
    { "status": "Pending", "at": ISODate("2026-11-04T10:00:00Z") },
    { "status": "Assigned", "at": ISODate("2026-11-04T12:00:00Z") }
  ],
  "createdAt": ISODate("...")
}
```

### 5. `processingrecords` Collection (`ProcessingRecord.js`)
Physical facility processing and recycling outcomes.
```javascript
{
  "_id": ObjectId("..."),
  "requestId": ObjectId("..."),        // Ref: 'Request', required, unique
  "facilityId": ObjectId("..."),       // Ref: 'Facility', required
  "weightKg": 15.5,                    // Number, required, min: 0.01
  "processStatus": "In Progress",      // Enum: ['In Progress', 'Completed'], default 'In Progress'
  "finalStatus": "Recycled",           // Enum: ['Recycled', 'Disposed', null], default null
  "processedOn": "2026-11-05",         // String (YYYY-MM-DD), default null
  "createdAt": ISODate("...")
}
```

---

## 6. Request Lifecycle & State Machine

Status transitions are strictly validated in `requests.controller.js`:

```
[Pending]
    ↓ (Admin assigns collector & scheduled date)
[Assigned]
    ↓ (Assigned collector marks pickup on arrival)
[Collected]
    ↓ (Admin creates processing record for facility)
[Processing]
    ↓ (Facility completes processing)
[Recycled] OR [Disposed]
```

- Collectors can only view and update requests assigned to them, and can only transition `Assigned` $\rightarrow$ `Collected`.
- Every transition automatically appends a new entry to the request's embedded `history` array.

---

## 7. API Endpoints Specification

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| `POST` | `/api/auth/register` | Public | Register new citizen (`USER`) or field agent (`COLLECTOR`). |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password, returns JWT and user profile. |
| **Categories** | | | |
| `GET` | `/api/categories` | Authenticated | List all e-waste categories. |
| `POST` | `/api/categories` | Admin | Create category with hazard level (*Low*, *Medium*, *High*). |
| `PUT` | `/api/categories/:id`| Admin | Update category details. |
| `DELETE`| `/api/categories/:id`| Admin | Delete category (blocked if used by requests). |
| **Requests** | | | |
| `GET` | `/api/requests` | Authenticated | List requests (USER: own requests; COLLECTOR: assigned; ADMIN: all). |
| `POST` | `/api/requests` | User | Submit new e-waste collection request. |
| `PATCH`| `/api/requests/:id/assign` | Admin | Assign request to a collector with scheduled date. |
| `PATCH`| `/api/requests/:id/status` | Admin / Collector | Update request status (follows lifecycle rules). |
| **Catalog & Admin** | | | |
| `GET` | `/api/users` | Admin | List all registered users (passwords omitted). |
| `DELETE`| `/api/users/:id` | Admin | Delete user (blocked if user has requests or is self). |
| `GET` | `/api/collectors` | Admin | List collectors with calculated `activeJobs` count. |
| `GET` | `/api/facilities` | Authenticated | List recycling facilities. |
| `POST` | `/api/facilities` | Admin | Register new recycling facility. |
| `DELETE`| `/api/facilities/:id` | Admin | Delete facility (blocked if processing records exist). |
| **Processing** | | | |
| `GET` | `/api/processing` | Admin | List all facility processing records. |
| `POST` | `/api/processing` | Admin | Send collected item to facility (status $\rightarrow$ Processing). |
| `PATCH`| `/api/processing/:id` | Admin | Mark completion as `Recycled` or `Disposed`. |
| **Reports** | | | |
| `GET` | `/api/reports/summary` | Admin | Analytics KPI totals, status counts, monthly trends, facility loads. |

---

## 8. Running Automated Tests

A 40-test automated verification suite is included:
```bash
npm test
```
The test suite validates:
1. Module loading and export structure.
2. 100% of the 20 REST API endpoints registered and mounted.
3. JWT token generation, expiration, and role validation.
4. Mongoose models, default values, validations, and `toJSON` transforms.
5. Error handlers for MongoDB unique constraint (11000) and CastError.
6. Business rules: lifecycle transitions, role escalation guards, and self-deletion prevention.
7. Database connectivity reporting.

