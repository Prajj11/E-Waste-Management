// Replaces the REPLACE_WITH_BCRYPT placeholders created by database/02_seed.sql with real bcrypt hashes.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDb, closeDb, query } from '../src/config/db.js';

const DEMO_PASSWORDS = { ADMIN: 'admin123', COLLECTOR: 'collect123', USER: 'user123' };

await initDb();
for (const [role, pw] of Object.entries(DEMO_PASSWORDS)) {
  const hash = await bcrypt.hash(pw, 10);
  const r = await query(`UPDATE app_user SET password_hash = :hash WHERE role = :role AND password_hash = 'REPLACE_WITH_BCRYPT'`, { hash, role });
  console.log(`${role}: ${r.rowsAffected} account(s) updated`);
}
await closeDb();
