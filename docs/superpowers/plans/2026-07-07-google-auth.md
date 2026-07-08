# Google OAuth + Panel de Administración de Acceso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar autenticación con Google al dashboard: el admin configura qué emails pueden entrar, los usuarios ven el botón "Iniciar sesión con Google".

**Architecture:** El servidor verifica el JWT de Google contra `https://oauth2.googleapis.com/tokeninfo`, extrae el email, lo compara contra una whitelist guardada en la tabla `config` de la DB, y si coincide emite la misma cookie de sesión que el login actual. El admin (usuario/contraseña) sigue funcionando sin cambios; el formulario queda oculto detrás de un link discreto.

**Tech Stack:** Node.js v22, Express 5, better-sqlite3/pg (DB existente), `@react-oauth/google` v0.13.5 (ya instalado), `node:test` + `node:assert/strict` (test runner existente).

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `server/db.js` | Modificar | Agregar `getAccessConfig()` y `setAccessConfig()` |
| `server/auth.js` | Modificar | Agregar `verifyGoogleCredential(credential)` |
| `server/index.js` | Modificar | Agregar 4 endpoints nuevos |
| `server/test/accessConfig.test.js` | Crear | Tests para las helpers de DB |
| `server/test/googleAuth.test.js` | Crear | Tests para `verifyGoogleCredential` |
| `src/components/Login/Login.jsx` | Reescribir | Botón Google + toggle admin + nombre casa |
| `src/components/Login/Login.module.css` | Modificar | Estilos para botón Google, divisor, toggle admin |
| `src/components/Admin/AccessConfig.jsx` | Crear | Panel gestión de nombre de casa + emails |
| `src/components/Admin/AccessConfig.module.css` | Crear | Estilos del panel |
| `src/App.jsx` | Modificar | Pestaña "Cuenta" integra AccessConfig |

---

## Task 1: DB helpers — `getAccessConfig` y `setAccessConfig`

**Files:**
- Modify: `server/db.js` (agregar al final del archivo, junto a las otras funciones `export`)
- Create: `server/test/accessConfig.test.js`

### Qué hacen estas funciones

Leen y escriben dos claves en la tabla `config` existente:
- `house_name` → string con el nombre de la casa
- `google_allowed_emails` → JSON array de emails permitidos

La tabla `config` ya existe y tiene la estructura `(key TEXT PRIMARY KEY, value TEXT NOT NULL)`.

- [ ] **Step 1: Agregar las funciones a `server/db.js`**

Abrir `server/db.js` y agregar al final (después de `getAllState`):

```js
export async function getAccessConfig() {
  const nameRow = await q("SELECT value FROM config WHERE key='house_name'");
  const emailsRow = await q("SELECT value FROM config WHERE key='google_allowed_emails'");
  return {
    houseName: nameRow[0]?.value ?? '',
    allowedEmails: emailsRow[0] ? JSON.parse(emailsRow[0].value) : [],
  };
}

export async function setAccessConfig({ houseName, allowedEmails }) {
  await q(
    "INSERT INTO config (key,value) VALUES ('house_name',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [String(houseName)]
  );
  await q(
    "INSERT INTO config (key,value) VALUES ('google_allowed_emails',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [JSON.stringify(Array.isArray(allowedEmails) ? allowedEmails : [])]
  );
}
```

- [ ] **Step 2: Escribir los tests en `server/test/accessConfig.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initDB, getAccessConfig, setAccessConfig } from '../db.js';

test('getAccessConfig returns empty defaults when nothing stored', async () => {
  await initDB();
  // Note: puede haber datos de corridas previas; sólo verificamos la estructura
  const config = await getAccessConfig();
  assert.ok(typeof config.houseName === 'string');
  assert.ok(Array.isArray(config.allowedEmails));
});

test('setAccessConfig and getAccessConfig round-trip', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Test House', allowedEmails: ['a@test.com', 'b@test.com'] });
  const config = await getAccessConfig();
  assert.equal(config.houseName, 'Test House');
  assert.deepEqual(config.allowedEmails, ['a@test.com', 'b@test.com']);
});

test('setAccessConfig overwrites previous values', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Casa 1', allowedEmails: ['x@x.com'] });
  await setAccessConfig({ houseName: 'Casa 2', allowedEmails: ['y@y.com'] });
  const config = await getAccessConfig();
  assert.equal(config.houseName, 'Casa 2');
  assert.deepEqual(config.allowedEmails, ['y@y.com']);
});

test('setAccessConfig handles empty emails array', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Sin emails', allowedEmails: [] });
  const config = await getAccessConfig();
  assert.deepEqual(config.allowedEmails, []);
});
```

- [ ] **Step 3: Correr los tests**

```
node --test server/test/accessConfig.test.js
```

Resultado esperado: 4 tests `pass`.

- [ ] **Step 4: Commit**

```bash
git add server/db.js server/test/accessConfig.test.js
git commit -m "feat(db): add getAccessConfig and setAccessConfig helpers"
```

---

## Task 2: `verifyGoogleCredential` en `server/auth.js`

**Files:**
- Modify: `server/auth.js`
- Create: `server/test/googleAuth.test.js`

### Cómo funciona la verificación

Google firma el `credential` (JWT) con sus propias claves privadas. La forma más simple de verificarlo sin librerías extra es llamar a `https://oauth2.googleapis.com/tokeninfo?id_token=<credential>`. Google devuelve el payload del JWT incluyendo:
- `aud`: el Client ID de la app que emitió el token — debe ser igual a `GOOGLE_CLIENT_ID`
- `email`: el email del usuario

Si el `aud` no coincide, alguien podría usar un token de otra app de Google para entrar, lo cual es un agujero de seguridad.

- [ ] **Step 1: Agregar `verifyGoogleCredential` a `server/auth.js`**

Agregar al final del archivo (después de `verifyWsRequest`):

```js
export async function verifyGoogleCredential(credential) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) return null;
    const payload = await res.json();
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    return payload.email ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Escribir los tests en `server/test/googleAuth.test.js`**

Los tests mockean `globalThis.fetch` para no depender de la red.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleCredential } from '../auth.js';

test('verifyGoogleCredential returns email on valid token', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'my-client-id', email: 'user@gmail.com' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  const email = await verifyGoogleCredential('fake-jwt');
  assert.equal(email, 'user@gmail.com');
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when aud does not match CLIENT_ID', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'other-app-client-id', email: 'user@gmail.com' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  const email = await verifyGoogleCredential('fake-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when Google returns HTTP error', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false });
  const email = await verifyGoogleCredential('invalid-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when fetch throws', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network error'); };
  const email = await verifyGoogleCredential('any-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});
```

- [ ] **Step 3: Correr los tests**

```
node --test server/test/googleAuth.test.js
```

Resultado esperado: 4 tests `pass`.

- [ ] **Step 4: Commit**

```bash
git add server/auth.js server/test/googleAuth.test.js
git commit -m "feat(auth): add verifyGoogleCredential using Google tokeninfo API"
```

---

## Task 3: Nuevos endpoints en `server/index.js`

**Files:**
- Modify: `server/index.js`

Se agregan 4 endpoints. Los primeros dos son **públicos** (sin `authMiddleware`). Los últimos dos son **protegidos** (bajo el bloque `app.use('/api', authMiddleware)` existente).

- [ ] **Step 1: Agregar imports al inicio de `server/index.js`**

Buscar la línea que importa desde `'./db.js'` y agregar `getAccessConfig` y `setAccessConfig`:

```js
import {
  initDB, getAllState, saveDashboard, deleteDashboard, removeDashboardFromMeta,
  saveMeta, getImages, removeImage, getAllDashboards, saveHubs, getHubs, resetAllData,
  getAccessConfig, setAccessConfig,
} from './db.js';
```

Buscar la línea que importa desde `'./auth.js'` y agregar `verifyGoogleCredential`:

```js
import {
  verifyCredentials, generateToken, setSessionCookie, clearSessionCookie,
  authMiddleware, verifyWsRequest, verifyToken, verifyGoogleCredential,
} from './auth.js';
```

- [ ] **Step 2: Agregar los 2 endpoints públicos**

Insertar **antes** del bloque `// ─── Protected API routes ───` (antes de `app.use('/api', authMiddleware)`):

```js
// ─── Google OAuth (no auth middleware) ───────────────────────────────────────
app.get('/api/auth/google-client-id', async (_req, res) => {
  const { houseName } = await getAccessConfig();
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    houseName,
  });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body ?? {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google OAuth no configurado' });

  const email = await verifyGoogleCredential(credential);
  if (!email) return res.status(401).json({ error: 'Token de Google inválido' });

  const { allowedEmails } = await getAccessConfig();
  const normalizedEmail = email.toLowerCase();
  const allowed = allowedEmails.map(e => e.toLowerCase());
  if (!allowed.includes(normalizedEmail)) {
    return res.status(403).json({ error: 'Email no autorizado. Solicita acceso al administrador.' });
  }

  const token = generateToken();
  setSessionCookie(res, token);
  res.json({ ok: true });
});
```

- [ ] **Step 3: Agregar los 2 endpoints protegidos**

Insertar dentro del bloque protegido, **después** de `app.use('/api', imageRouter)`:

```js
app.get('/api/admin/config', async (_req, res) => {
  const config = await getAccessConfig();
  res.json(config);
});

app.post('/api/admin/config', async (req, res) => {
  const { houseName, allowedEmails } = req.body ?? {};
  if (typeof houseName !== 'string') return res.status(400).json({ error: 'houseName requerido' });
  if (!Array.isArray(allowedEmails)) return res.status(400).json({ error: 'allowedEmails debe ser array' });
  await setAccessConfig({ houseName, allowedEmails });
  res.json({ ok: true });
});
```

- [ ] **Step 4: Verificar arranque del servidor**

```
node server/index.js
```

Debes ver `Server running on http://0.0.0.0:3001` sin errores. Ctrl+C para detener.

- [ ] **Step 5: Verificar endpoints con curl**

```bash
# Debe devolver { clientId: "", houseName: "" } (o el valor de GOOGLE_CLIENT_ID si está en .env)
curl http://localhost:3001/api/auth/google-client-id
```

- [ ] **Step 6: Commit**

```bash
git add server/index.js
git commit -m "feat(api): add Google OAuth and admin config endpoints"
```

---

## Task 4: Reescribir `Login.jsx`

**Files:**
- Modify: `src/components/Login/Login.jsx` (reemplazar contenido completo)
- Modify: `src/components/Login/Login.module.css` (agregar clases nuevas)

### Comportamiento nuevo

1. Al montar, hace `GET /api/auth/google-client-id` → obtiene `{ clientId, houseName }`
2. Muestra el nombre de la casa en el título (o "Mi Hogar" si no está configurado)
3. Si hay `clientId`: muestra botón "Iniciar sesión con Google" de `@react-oauth/google`
4. Al hacer click en el botón de Google: el SDK abre el popup de Google y retorna un `credential` (JWT)
5. El `credential` se manda a `POST /api/auth/google` → si ok, llama `onAuth()`
6. Link "Acceso admin" (visible siempre o solo cuando hay Google configurado) expande el formulario usuario/contraseña al hacer click
7. El formulario admin funciona igual que antes

- [ ] **Step 1: Reemplazar `src/components/Login/Login.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './Login.module.css';

export default function Login({ onAuth }) {
  const [googleClientId, setGoogleClientId] = useState('');
  const [houseName, setHouseName] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google-client-id')
      .then(r => r.json())
      .then(d => {
        setGoogleClientId(d.clientId ?? '');
        setHouseName(d.houseName ?? '');
      })
      .catch(() => {});
  }, []);

  const handleGoogleSuccess = async ({ credential }) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No autorizado');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <div className={styles.card}>
      <div className={styles.logo}>🏠</div>
      <div className={styles.title}>{houseName || 'Mi Hogar'}</div>

      {googleClientId && (
        <>
          <div className={styles.googleBtn}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error al iniciar con Google')}
              width="256"
              theme="filled_black"
            />
          </div>
          {!showAdminForm && (
            <div className={styles.divider}><span>o</span></div>
          )}
        </>
      )}

      {!showAdminForm && (
        <button
          type="button"
          className={styles.adminToggle}
          onClick={() => setShowAdminForm(true)}
        >
          Acceso admin
        </button>
      )}

      {showAdminForm && (
        <form className={styles.adminSection} onSubmit={handleAdminSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Usuario</label>
            <input
              className={styles.input}
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            className={styles.btn}
            type="submit"
            disabled={loading || !user || !password}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      )}

      <div className={styles.error}>{error}</div>
    </div>
  );

  return (
    <div className={styles.page}>
      {googleClientId
        ? <GoogleOAuthProvider clientId={googleClientId}>{form}</GoogleOAuthProvider>
        : form
      }
    </div>
  );
}
```

- [ ] **Step 2: Agregar estilos nuevos a `src/components/Login/Login.module.css`**

Agregar al final del archivo (las clases existentes no cambian):

```css
.googleBtn {
  display: flex;
  justify-content: center;
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.adminToggle {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.28);
  font-size: 11px;
  cursor: pointer;
  text-align: center;
  letter-spacing: 0.06em;
  padding: 4px 0;
  transition: color 0.15s;
}

.adminToggle:hover {
  color: rgba(255, 255, 255, 0.5);
}

.adminSection {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
```

- [ ] **Step 3: Verificar visualmente**

Levantar dev server: `npm run dev` y abrir `http://localhost:5173`.

Verificar:
- La página de login carga sin errores de consola
- Si `GOOGLE_CLIENT_ID` no está en `.env`, se muestra solo el link "Acceso admin"
- Al hacer click en "Acceso admin" aparece el formulario usuario/contraseña
- El login con admin/contraseña sigue funcionando

- [ ] **Step 4: Commit**

```bash
git add src/components/Login/Login.jsx src/components/Login/Login.module.css
git commit -m "feat(login): add Google OAuth button with admin form toggle"
```

---

## Task 5: Crear `AccessConfig.jsx` — panel de gestión de acceso

**Files:**
- Create: `src/components/Admin/AccessConfig.jsx`
- Create: `src/components/Admin/AccessConfig.module.css`

Este panel permite al admin (único que tiene sesión activa actualmente):
1. Cambiar el nombre de la casa
2. Ver la lista de emails de Google autorizados
3. Agregar y quitar emails de la lista
4. Guardar cambios (un solo botón que guarda nombre + emails)

- [ ] **Step 1: Crear `src/components/Admin/AccessConfig.jsx`**

```jsx
import { useState, useEffect } from 'react';
import styles from './AccessConfig.module.css';

export default function AccessConfig() {
  const [houseName, setHouseName] = useState('');
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => {
        setHouseName(d.houseName ?? '');
        setEmails(d.allowedEmails ?? []);
      })
      .catch(() => {});
  }, []);

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || emails.includes(trimmed)) return;
    setEmails(prev => [...prev, trimmed]);
    setNewEmail('');
  };

  const removeEmail = (email) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseName, allowedEmails: emails }),
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <label className={styles.label}>Nombre de la casa</label>
        <input
          className={styles.input}
          type="text"
          value={houseName}
          onChange={e => setHouseName(e.target.value)}
          placeholder="Mi Hogar"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Cuentas Google permitidas</label>
        <div className={styles.emailList}>
          {emails.length === 0 && (
            <div className={styles.emptyHint}>Sin cuentas configuradas</div>
          )}
          {emails.map(email => (
            <div key={email} className={styles.emailRow}>
              <span className={styles.emailText}>{email}</span>
              <button
                className={styles.removeBtn}
                onClick={() => removeEmail(email)}
                title="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <input
            className={styles.input}
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="correo@gmail.com"
          />
          <button className={styles.addBtn} onClick={addEmail} disabled={!newEmail.trim()}>
            +
          </button>
        </div>
      </div>

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {status === 'ok' && <div className={styles.successMsg}>✓ Guardado</div>}
      {status === 'error' && <div className={styles.errorMsg}>Error al guardar</div>}
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/Admin/AccessConfig.module.css`**

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0 12px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--accent, #3b82f6);
}

.emailList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 28px;
}

.emptyHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.22);
  font-style: italic;
  padding: 4px 0;
}

.emailRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 6px 10px;
}

.emailText {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.removeBtn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.15s;
  flex-shrink: 0;
}

.removeBtn:hover {
  color: #f87171;
}

.addRow {
  display: flex;
  gap: 6px;
}

.addRow .input {
  flex: 1;
}

.addBtn {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #93c5fd;
  border-radius: 8px;
  font-size: 18px;
  line-height: 1;
  width: 36px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.addBtn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.28);
}

.addBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.saveBtn {
  background: var(--accent, #3b82f6);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 10px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.saveBtn:hover:not(:disabled) {
  opacity: 0.88;
}

.saveBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.successMsg {
  font-size: 12px;
  color: #4ade80;
  text-align: center;
}

.errorMsg {
  font-size: 12px;
  color: #f87171;
  text-align: center;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AccessConfig.jsx src/components/Admin/AccessConfig.module.css
git commit -m "feat(admin): add AccessConfig panel for house name and allowed Google emails"
```

---

## Task 6: Integrar `AccessConfig` en la pestaña "Cuenta" de `App.jsx`

**Files:**
- Modify: `src/App.jsx`

La pestaña "Cuenta" actualmente muestra nombre hardcodeado "admin" + botón logout. Se reemplaza por AccessConfig + botón logout.

- [ ] **Step 1: Agregar import de AccessConfig en `src/App.jsx`**

Buscar los imports al inicio del archivo y agregar:

```js
import AccessConfig from './components/Admin/AccessConfig.jsx';
```

- [ ] **Step 2: Reemplazar el contenido de la pestaña "cuenta"**

Buscar este bloque en `AppContent`:

```jsx
          {activeTab === 'cuenta'  && (
            <div className={styles.cuentaPanel}>
              <div className={styles.cuentaTitle}>👤 admin</div>
              <div className={styles.cuentaSub}>Sesión activa · cookie 30 días</div>
              <button className={styles.logoutBtn} onClick={onLogout}>
                ⏻ Cerrar sesión
              </button>
            </div>
          )}
```

Reemplazarlo con:

```jsx
          {activeTab === 'cuenta'  && (
            <div className={styles.cuentaPanel}>
              <AccessConfig />
              <button className={styles.logoutBtn} onClick={onLogout}>
                ⏻ Cerrar sesión
              </button>
            </div>
          )}
```

- [ ] **Step 3: Verificar visualmente**

Con el servidor corriendo (`node server/index.js`) y el dev server (`npm run dev`):

1. Ingresar con admin/contraseña
2. Hacer click en la pestaña "👤 Cuenta" del sidebar
3. Debe aparecer el panel con campo "Nombre de la casa" y sección de emails
4. Escribir un nombre de casa y hacer click en "Guardar cambios" → debe aparecer "✓ Guardado"
5. Recargar la página — el nombre guardado debe persistir
6. Agregar un email y guardar
7. Hacer logout

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): replace hardcoded cuenta panel with AccessConfig component"
```

---

## Task 7: Configurar Google Cloud Console y probar el flujo completo

Este task es manual (no hay código que escribir).

- [ ] **Step 1: Crear proyecto en Google Cloud Console**

1. Ir a https://console.cloud.google.com
2. Crear proyecto nuevo (ej. "Mi Casa Domotica")
3. Ir a **APIs & Services → OAuth consent screen**
4. Seleccionar "External", llenar nombre de app y email de soporte
5. Agregar tu email en "Test users" (mientras la app esté en modo test)

- [ ] **Step 2: Crear credenciales OAuth 2.0**

1. Ir a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
2. Tipo de aplicación: **Web application**
3. Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `http://localhost:3001` (server en dev)
   - `https://tu-app.onrender.com` (producción — reemplazar con URL real)
4. Copiar el Client ID generado

- [ ] **Step 3: Agregar `GOOGLE_CLIENT_ID` al entorno**

En el archivo `.env` local (crear si no existe):

```
GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com
```

En Render (dashboard → Environment): agregar la misma variable.

- [ ] **Step 4: Probar el flujo completo**

1. Levantar servidor: `node server/index.js`
2. Levantar dev: `npm run dev`
3. Abrir `http://localhost:5173`
4. Debe aparecer el botón "Iniciar sesión con Google" en la pantalla de login
5. Entrar como admin (link "Acceso admin"), ir a pestaña "Cuenta"
6. Agregar tu email de Google en la lista de permitidos, guardar
7. Hacer logout
8. Hacer click en "Iniciar sesión con Google" → seleccionar tu cuenta → debe entrar al dashboard
9. Probar con un email que NO esté en la lista → debe aparecer "Email no autorizado. Solicita acceso al administrador."

- [ ] **Step 5: Commit final**

```bash
git add .env.example  # si creás un .env.example con GOOGLE_CLIENT_ID=
git commit -m "docs: add GOOGLE_CLIENT_ID to env example"
```

---

## Resumen de variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `JWT_SECRET` | Sí (ya existe) | Secreto para firmar cookies de sesión |
| `ADMIN_USER` | Sí (ya existe) | Usuario del admin |
| `ADMIN_PASSWORD_HASH` | Sí (ya existe) | Hash bcrypt de la contraseña del admin |
| `GOOGLE_CLIENT_ID` | Para Google OAuth | Client ID de Google Cloud Console |
| `DATABASE_URL` | Para producción | PostgreSQL (si no, usa SQLite local) |
