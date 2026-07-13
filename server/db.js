import pkg from 'pg';
import { randomUUID } from 'node:crypto';
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
  if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) {
    stmt.run(...params);
    return [];
  }
  return stmt.all(...params);
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

// ── Schema migration ──────────────────────────────────────────────────────────
async function migrateIfNeeded() {
  const version = parseInt((await getConfig('schema_version')) || '1');
  if (version >= 2) return;

  // Add homes table
  await q(`
    CREATE TABLE IF NOT EXISTS homes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);

  // Add home_members table
  await q(`
    CREATE TABLE IF NOT EXISTS home_members (
      home_id TEXT NOT NULL,
      email TEXT NOT NULL,
      PRIMARY KEY (home_id, email)
    )
  `);

  // Add home_id column to dashboards (may already exist on fresh installs)
  if (pool) {
    await q('ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS home_id TEXT');
  } else {
    try {
      await q('ALTER TABLE dashboards ADD COLUMN home_id TEXT');
    } catch {}
  }

  // Add home_id column to images (may already exist on fresh installs)
  if (pool) {
    await q('ALTER TABLE images ADD COLUMN IF NOT EXISTS home_id TEXT');
  } else {
    try {
      await q('ALTER TABLE images ADD COLUMN home_id TEXT');
    } catch {}
  }

  // Drop and recreate meta with new composite PK
  await q('DROP TABLE IF EXISTS meta');
  await q(`
    CREATE TABLE meta (
      home_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (home_id, key)
    )
  `);

  // Drop and recreate hubs with new composite PK
  await q('DROP TABLE IF EXISTS hubs');
  await q(`
    CREATE TABLE hubs (
      home_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (home_id, key)
    )
  `);

  await setConfig('schema_version', '2');
}

// ── Init ─────────────────────────────────────────────────────────────────────
export async function initDB() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL,
        home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS meta (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY (home_id, key)
      );
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL,
        home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS hubs (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY (home_id, key)
      );
      CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS homes (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS home_members (
        home_id TEXT NOT NULL, email TEXT NOT NULL,
        PRIMARY KEY (home_id, email)
      );
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
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL,
        home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL,
        home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS homes (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS home_members (
        home_id TEXT NOT NULL, email TEXT NOT NULL,
        PRIMARY KEY (home_id, email)
      );
    `);
    // meta and hubs need composite PK — create with new schema if not exists
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY (home_id, key)
      );
      CREATE TABLE IF NOT EXISTS hubs (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY (home_id, key)
      );
    `);
    console.log('[db] SQLite local en', dbPath);
  }
  await migrateIfNeeded();
}

// ── Public API — Homes CRUD ──────────────────────────────────────────────────
export async function createHome(name) {
  const id = randomUUID();
  const created_at = Date.now();
  await q(
    'INSERT INTO homes (id, name, created_at) VALUES ($1, $2, $3)',
    [id, name, created_at]
  );
  return { id, name, created_at };
}

export async function deleteHome(id) {
  // Manually delete members first (SQLite FK constraints disabled by default)
  await q('DELETE FROM home_members WHERE home_id = $1', [id]);
  await q('DELETE FROM dashboards WHERE home_id = $1', [id]);
  await q('DELETE FROM meta WHERE home_id = $1', [id]);
  await q('DELETE FROM hubs WHERE home_id = $1', [id]);
  await q('DELETE FROM images WHERE home_id = $1', [id]);
  await q('DELETE FROM homes WHERE id = $1', [id]);
}

export async function listHomes() {
  return q('SELECT id, name, created_at FROM homes ORDER BY created_at ASC');
}

export async function getHome(id) {
  const rows = await q('SELECT id, name, created_at FROM homes WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function addHomeMember(homeId, email) {
  const normalized = email.toLowerCase();
  await q(
    'INSERT INTO home_members (home_id, email) VALUES ($1, $2) ON CONFLICT(home_id, email) DO NOTHING',
    [homeId, normalized]
  );
}

export async function removeHomeMember(homeId, email) {
  const normalized = email.toLowerCase();
  await q('DELETE FROM home_members WHERE home_id = $1 AND email = $2', [homeId, normalized]);
}

export async function listHomeMembers(homeId) {
  const rows = await q('SELECT email FROM home_members WHERE home_id = $1 ORDER BY email ASC', [homeId]);
  return rows.map(r => r.email);
}

export async function getHomesByEmail(email) {
  const normalized = email.toLowerCase();
  return q(
    'SELECT h.id, h.name FROM homes h INNER JOIN home_members m ON h.id = m.home_id WHERE m.email = $1',
    [normalized]
  );
}

// ── Public API — Config ───────────────────────────────────────────────────────
export async function getWipedAt() {
  return parseInt((await getConfig('wiped_at')) || '0');
}

// ── Public API — Dashboards ───────────────────────────────────────────────────
export async function saveDashboard(homeId, id, name, stateJson) {
  await q(
    `INSERT INTO dashboards (id, home_id, name, state_json, updated_at) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET home_id=excluded.home_id, name=excluded.name, state_json=excluded.state_json, updated_at=excluded.updated_at`,
    [id, homeId, name, stateJson, Date.now()]
  );
}

export async function deleteDashboard(homeId, id) {
  await q('DELETE FROM dashboards WHERE id = $1 AND home_id = $2', [id, homeId]);
}

export async function removeDashboardFromMeta(homeId, id) {
  const rows = await q("SELECT value FROM meta WHERE home_id = $1 AND key = 'singleton'", [homeId]);
  if (!rows[0]) return;
  try {
    const meta = JSON.parse(rows[0].value);
    if (!Array.isArray(meta.dashboards)) return;
    meta.dashboards = meta.dashboards.filter(d => d.id !== id);
    await q("UPDATE meta SET value = $1 WHERE home_id = $2 AND key = 'singleton'", [JSON.stringify(meta), homeId]);
  } catch {}
}

export async function getDashboard(homeId, id) {
  const rows = await q('SELECT * FROM dashboards WHERE id = $1 AND home_id = $2', [id, homeId]);
  return rows[0] ?? null;
}

export async function getAllDashboards(homeId) {
  return q('SELECT * FROM dashboards WHERE home_id = $1', [homeId]);
}

// ── Public API — Meta ─────────────────────────────────────────────────────────
export async function saveMeta(homeId, valueJson) {
  await q(
    "INSERT INTO meta (home_id, key, value) VALUES ($1, 'singleton', $2) ON CONFLICT(home_id, key) DO UPDATE SET value=excluded.value",
    [homeId, valueJson]
  );
}

export async function getMeta(homeId) {
  const rows = await q("SELECT * FROM meta WHERE home_id = $1 AND key = 'singleton'", [homeId]);
  return rows[0] ?? null;
}

// ── Public API — Images ───────────────────────────────────────────────────────
export async function addImage(homeId, id, filename) {
  await q(
    'INSERT INTO images (id, home_id, filename, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [id, homeId, filename, Date.now()]
  );
}

export async function removeImage(homeId, id) {
  await q('DELETE FROM images WHERE id = $1 AND home_id = $2', [id, homeId]);
}

export async function getImages(homeId) {
  return q('SELECT * FROM images WHERE home_id = $1', [homeId]);
}

// ── Public API — Hubs ─────────────────────────────────────────────────────────
export async function saveHubs(homeId, json) {
  await q(
    "INSERT INTO hubs (home_id, key, value) VALUES ($1, 'singleton', $2) ON CONFLICT(home_id, key) DO UPDATE SET value=excluded.value",
    [homeId, json]
  );
}

export async function getHubs(homeId) {
  const rows = await q("SELECT value FROM hubs WHERE home_id = $1 AND key = 'singleton'", [homeId]);
  if (!rows[0]) return { hubs: [], assignments: {} };
  const parsed = JSON.parse(rows[0].value);
  if (Array.isArray(parsed)) return { hubs: parsed, assignments: {} };
  return { hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
}

export async function getAllHubsForAllHomes() {
  const rows = await q("SELECT home_id, value FROM hubs WHERE key = 'singleton'");
  return rows.map(row => {
    const parsed = JSON.parse(row.value);
    if (Array.isArray(parsed)) return { homeId: row.home_id, hubs: parsed, assignments: {} };
    return { homeId: row.home_id, hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
  });
}

// ── Public API — Combined state ───────────────────────────────────────────────
export async function getAllState(homeId) {
  const dashboards = (await getAllDashboards(homeId)).map(row => ({
    id: row.id, name: row.name, state: JSON.parse(row.state_json),
  }));
  const metaRow = await getMeta(homeId);
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = await getImages(homeId);
  const { hubs, assignments } = await getHubs(homeId);
  const wipedAt = await getWipedAt();
  return { dashboards, meta, images, hubs, assignments, wipedAt };
}

export async function resetHome(homeId) {
  const wipedAt = Date.now();
  await q('DELETE FROM dashboards WHERE home_id = $1', [homeId]);
  await q('DELETE FROM meta WHERE home_id = $1', [homeId]);
  await q('DELETE FROM images WHERE home_id = $1', [homeId]);
  await q('DELETE FROM hubs WHERE home_id = $1', [homeId]);
  await setConfig('wiped_at', String(wipedAt));
  return wipedAt;
}
