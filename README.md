# EcoCycle · E-Waste Management System

DBMS Lab Mini Project.  
**Team**: Simra Faniband (24CE266), Simran K. Afonso (24CE267), Prajwal P. Naik (25CE90D).

---

## Project Structure

```
E-Waste-Management/
├── frontend/                                # React + Tailwind UI (built-in mock API & real API client)
├── backend/                                 # Node + Express REST API (connects to Oracle Database)
├── database/                                # Oracle SQL schema, seed data, and report queries
│   ├── 01_schema.sql
│   ├── 02_seed.sql
│   └── 03_report_queries.sql
├── EcoCycle_E-Waste_Management_Presentation.pptx # Project presentation slides
├── run.bat                                  # 1-Click launcher to run the project directly
└── .gitignore
```

---

## Quick Start (Windows)

Simply double-click **`run.bat`** from the root folder:

- It verifies dependencies and automatically launches the EcoCycle web application.
- It automatically opens your web browser to **`http://localhost:5173`**.
- If Oracle XE is running, it connects the backend API; otherwise, it launches in standalone Mock Mode with preloaded demo data so it works immediately with zero configuration.

---

## 1. Run the Frontend (Standalone / Mock Mode)

No backend or database setup is needed to test or demo the UI:

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Demo Logins (also clickable directly on the login page)

| Role      | Email               | Password   |
|:----------|:--------------------|:-----------|
| **Admin**     | `admin@ecocycle.in`   | `admin123`   |
| **Collector** | `rahul@ecocycle.in`   | `collect123` |
| **User**      | `priya@example.com`   | `user123`    |

*In mock mode, all data lives in the browser's `localStorage`. Clear site data to reset.*

---

## 2. Set Up the Oracle Database

```sql
-- Connect as SYSTEM (once):
CREATE USER ewaste IDENTIFIED BY ewaste QUOTA UNLIMITED ON USERS;
GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE TRIGGER, CREATE SEQUENCE TO ewaste;
```

```bash
# Connect as ewaste:
sqlplus ewaste/ewaste@//localhost:1521/XEPDB1
SQL> @database/01_schema.sql
SQL> @database/02_seed.sql
```

**Database Entities**:
- `app_user`, `ewaste_category`, `collector`, `recycling_facility`, `collection_request`, `status_history`, `processing_record`.
- A trigger logs every request status change; views feed the administrative analytics reports.
- `database/03_report_queries.sql` includes demonstration queries.

---

## 3. Run the Backend API

```bash
cd backend
npm install
# configure DB_PASSWORD, DB_CONNECT_STRING, JWT_SECRET in .env (created from .env.example)
npm run seed:users        # hashes seed passwords into bcrypt hashes in Oracle
npm run dev               # http://localhost:5000/api/health
```

---

## 4. Connect Frontend to the Backend

In `frontend/.env`, set:
```env
VITE_USE_MOCK=false
VITE_API_URL=/api
```
Restart the frontend (`npm run dev`). Vite proxies `/api` calls directly to `http://localhost:5000`.

---

## REST API Overview

| Method | Path | Access |
|:-------|:-----|:-------|
| `POST` | `/api/auth/login`, `/register` | Public |
| `GET` | `/api/categories` | Authenticated |
| `POST/PUT/DELETE` | `/api/categories` | Admin |
| `GET` | `/api/requests` | User (own), Collector (assigned), Admin (all) |
| `POST` | `/api/requests` | User |
| `PATCH` | `/api/requests/:id/assign` | Admin |
| `PATCH` | `/api/requests/:id/status` | Collector, Admin |
| `GET/DELETE` | `/api/users` | Admin |
| `GET` | `/api/collectors` | Admin |
| `GET/POST/DELETE` | `/api/facilities` | Read: Any, Write: Admin |
| `GET/POST/PATCH` | `/api/processing` | Admin |
| `GET` | `/api/reports/summary` | Admin |

**Request Lifecycle**:  
`Pending → Assigned → Collected → Processing → Recycled | Disposed`