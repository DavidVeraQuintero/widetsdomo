# Deploy — Render + Neon

## Paso 1 — Neon (base de datos PostgreSQL)

1. Ir a **https://neon.tech** → crear cuenta gratis
2. **New Project** → nombre: `widetsdomo`
3. Copiar el **Connection string**:
   ```
   postgresql://usuario:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## Paso 2 — Generar variables de entorno

Ejecutar en terminal (dentro de `C:\widetsdomo`):

**Hash de contraseña** (reemplaza `TU_CONTRASEÑA` con la tuya):
```bash
node -e "import('bcryptjs').then(b=>b.default.hash('TU_CONTRASEÑA',12).then(console.log))"
```

**JWT Secret** (64 bytes aleatorios):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Guardar ambos resultados para el paso 3.

---

## Paso 3 — Render (servidor Node.js)

1. Ir a **https://render.com** → crear cuenta gratis
2. **New → Web Service**
3. Conectar repo GitHub: `DavidVeraQuintero/widetsdomo`
4. Configurar el servicio:
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** Free
5. Agregar **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Connection string de Neon |
| `JWT_SECRET` | hex generado en paso 2 |
| `ADMIN_USER` | `admin` |
| `ADMIN_PASSWORD_HASH` | hash bcrypt generado en paso 2 |
| `NODE_ENV` | `production` |

6. Click **Create Web Service** → esperar ~3 min
7. URL pública: `https://widetsdomo.onrender.com`

---

## Paso 4 — Hubitat Maker API

En la app **Maker API** dentro de Hubitat:

1. Activar **"Allow Access via Cloud"**
2. Copiar el **Cloud Endpoint URL** → pegarlo en el dashboard como `cloudUrl` del hub
3. Configurar **Webhook URL**:
   ```
   https://widetsdomo.onrender.com/api/hub-webhook
   ```

---

## Paso 5 — Primer login

Abrir `https://widetsdomo.onrender.com` en el navegador:
- **Usuario:** `admin`
- **Contraseña:** la que configuraste en el paso 2

---

## Notas

- Render free tier se **duerme** después de 15 min sin visitas → primera petición tarda ~30s
- Las imágenes subidas se pierden en cada redeploy (disco efímero) — pendiente Cloudinary
- Para desarrollo local sin Neon: el servidor usa `server/data.db` (SQLite) automáticamente
