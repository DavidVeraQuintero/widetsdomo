import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      state_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS images (
      id         TEXT PRIMARY KEY,
      filename   TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hubs (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function getConfig(key) {
  const { rows } = await pool.query('SELECT value FROM config WHERE key = $1', [key]);
  return rows[0]?.value ?? null;
}

async function setConfig(key, value) {
  await pool.query(
    'INSERT INTO config (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
    [key, String(value)]
  );
}

export async function getWipedAt() {
  return parseInt((await getConfig('wiped_at')) || '0');
}

export async function resetAllData() {
  const wipedAt = Date.now();
  await pool.query('DELETE FROM dashboards; DELETE FROM meta; DELETE FROM images; DELETE FROM hubs;');
  await setConfig('wiped_at', String(wipedAt));
  return wipedAt;
}

export async function saveDashboard(id, name, stateJson) {
  await pool.query(
    `INSERT INTO dashboards (id,name,state_json,updated_at) VALUES ($1,$2,$3,$4)
     ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, state_json=EXCLUDED.state_json, updated_at=EXCLUDED.updated_at`,
    [id, name, stateJson, Date.now()]
  );
}

export async function deleteDashboard(id) {
  await pool.query('DELETE FROM dashboards WHERE id = $1', [id]);
}

export async function removeDashboardFromMeta(id) {
  const { rows } = await pool.query("SELECT value FROM meta WHERE key='singleton'");
  if (!rows[0]) return;
  try {
    const meta = JSON.parse(rows[0].value);
    if (!Array.isArray(meta.dashboards)) return;
    meta.dashboards = meta.dashboards.filter(d => d.id !== id);
    await pool.query("UPDATE meta SET value=$1 WHERE key='singleton'", [JSON.stringify(meta)]);
  } catch {}
}

export async function getDashboard(id) {
  const { rows } = await pool.query('SELECT * FROM dashboards WHERE id=$1', [id]);
  return rows[0] ?? null;
}

export async function getAllDashboards() {
  const { rows } = await pool.query('SELECT * FROM dashboards');
  return rows;
}

export async function saveMeta(valueJson) {
  await pool.query(
    "INSERT INTO meta (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
    [valueJson]
  );
}

export async function getMeta() {
  const { rows } = await pool.query("SELECT * FROM meta WHERE key='singleton'");
  return rows[0] ?? null;
}

export async function addImage(id, filename) {
  await pool.query(
    'INSERT INTO images (id,filename,created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [id, filename, Date.now()]
  );
}

export async function removeImage(id) {
  await pool.query('DELETE FROM images WHERE id=$1', [id]);
}

export async function getImages() {
  const { rows } = await pool.query('SELECT * FROM images');
  return rows;
}

export async function saveHubs(json) {
  await pool.query(
    "INSERT INTO hubs (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
    [json]
  );
}

export async function getHubs() {
  const { rows } = await pool.query("SELECT value FROM hubs WHERE key='singleton'");
  if (!rows[0]) return { hubs: [], assignments: {} };
  const parsed = JSON.parse(rows[0].value);
  if (Array.isArray(parsed)) return { hubs: parsed, assignments: {} };
  return { hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
}

export async function getAllState() {
  const dashboards = (await getAllDashboards()).map(row => ({
    id: row.id,
    name: row.name,
    state: JSON.parse(row.state_json),
  }));
  const metaRow = await getMeta();
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = await getImages();
  const { hubs, assignments } = await getHubs();
  const wipedAt = await getWipedAt();
  return { dashboards, meta, images, hubs, assignments, wipedAt };
}
