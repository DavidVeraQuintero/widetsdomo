import pkg from 'pg';
const { Pool } = pkg;

// ── State ─────────────────────────────────────────────────────────────────────
let sqlite = null;
let pool = null;

async function q(sql, params = []) {
  if (pool) {
    const { rows } = await pool.query(sql, params);
    return rows;
  }
  // SQLite: convert $1,$2 → ?,? and run synchronously
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  const stmt = sqlite.prepare(sqliteSql);
  if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP)/i.test(sql)) {
    stmt.run(...params);
    return [];
  }
  return stmt.all(...params);
}

// ── Init ─────────────────────────────────────────────────────────────────────
export async function initDB() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS meta  (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS images(id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS hubs  (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    console.log('[db] PostgreSQL conectado');
  } else {
    const path = (await import('node:path')).default;
    const { fileURLToPath } = await import('node:url');
    const Database = (await import('better-sqlite3')).default;
    const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.db');
    sqlite = new Database(dbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS meta  (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS images(id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS hubs  (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    console.log('[db] SQLite local en', dbPath);
  }
}

// ── Config helpers ───────────────────────────────────────────────────────────
async function getConfig(key) {
  const rows = await q('SELECT value FROM config WHERE key = $1', [key]);
  return rows[0]?.value ?? null;
}

async function setConfig(key, value) {
  await q(
    'INSERT INTO config (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, String(value)]
  );
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function getWipedAt() {
  return parseInt((await getConfig('wiped_at')) || '0');
}

export async function resetAllData() {
  const wipedAt = Date.now();
  await q('DELETE FROM dashboards');
  await q('DELETE FROM meta');
  await q('DELETE FROM images');
  await q('DELETE FROM hubs');
  await setConfig('wiped_at', String(wipedAt));
  return wipedAt;
}

export async function saveDashboard(id, name, stateJson) {
  await q(
    `INSERT INTO dashboards (id,name,state_json,updated_at) VALUES ($1,$2,$3,$4)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, state_json=excluded.state_json, updated_at=excluded.updated_at`,
    [id, name, stateJson, Date.now()]
  );
}

export async function deleteDashboard(id) {
  await q('DELETE FROM dashboards WHERE id = $1', [id]);
}

export async function removeDashboardFromMeta(id) {
  const rows = await q("SELECT value FROM meta WHERE key='singleton'");
  if (!rows[0]) return;
  try {
    const meta = JSON.parse(rows[0].value);
    if (!Array.isArray(meta.dashboards)) return;
    meta.dashboards = meta.dashboards.filter(d => d.id !== id);
    await q("UPDATE meta SET value=$1 WHERE key='singleton'", [JSON.stringify(meta)]);
  } catch {}
}

export async function getDashboard(id) {
  const rows = await q('SELECT * FROM dashboards WHERE id=$1', [id]);
  return rows[0] ?? null;
}

export async function getAllDashboards() {
  return q('SELECT * FROM dashboards');
}

export async function saveMeta(valueJson) {
  await q(
    "INSERT INTO meta (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [valueJson]
  );
}

export async function getMeta() {
  const rows = await q("SELECT * FROM meta WHERE key='singleton'");
  return rows[0] ?? null;
}

export async function addImage(id, filename) {
  await q(
    'INSERT INTO images (id,filename,created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [id, filename, Date.now()]
  );
}

export async function removeImage(id) {
  await q('DELETE FROM images WHERE id=$1', [id]);
}

export async function getImages() {
  return q('SELECT * FROM images');
}

export async function saveHubs(json) {
  await q(
    "INSERT INTO hubs (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [json]
  );
}

export async function getHubs() {
  const rows = await q("SELECT value FROM hubs WHERE key='singleton'");
  if (!rows[0]) return { hubs: [], assignments: {} };
  const parsed = JSON.parse(rows[0].value);
  if (Array.isArray(parsed)) return { hubs: parsed, assignments: {} };
  return { hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
}

export async function getAllState() {
  const dashboards = (await getAllDashboards()).map(row => ({
    id: row.id, name: row.name, state: JSON.parse(row.state_json),
  }));
  const metaRow = await getMeta();
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = await getImages();
  const { hubs, assignments } = await getHubs();
  const wipedAt = await getWipedAt();
  return { dashboards, meta, images, hubs, assignments, wipedAt };
}
