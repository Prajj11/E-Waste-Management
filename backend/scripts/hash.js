// Usage: node scripts/hash.js mypassword   -> prints a bcrypt hash you can paste into app_user.password_hash
import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw) { console.error('Usage: node scripts/hash.js <password>'); process.exit(1); }
console.log(await bcrypt.hash(pw, 10));
