import 'dotenv/config';
import oracledb from 'oracledb';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

export async function initDb() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 1,
    poolMax: 8,
  });
  console.log('Oracle pool ready');
}

export const closeDb = () => pool?.close(5);

/** Run one statement. SELECTs return rows; DML auto-commits. */
export async function query(sql, binds = {}, opts = {}) {
  const conn = await pool.getConnection();
  try {
    const res = await conn.execute(sql, binds, { autoCommit: true, ...opts });
    return res;
  } finally {
    await conn.close();
  }
}
export const rows = async (sql, binds, opts) => (await query(sql, binds, opts)).rows ?? [];

/** Run several statements atomically: await tx(async (run) => { await run(sql1); await run(sql2); }) */
export async function tx(work) {
  const conn = await pool.getConnection();
  try {
    const run = (sql, binds = {}, opts = {}) => conn.execute(sql, binds, { autoCommit: false, ...opts });
    const out = await work(run);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

export { oracledb };
