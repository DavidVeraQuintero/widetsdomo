# Google OAuth + Panel de Administración de Acceso

**Fecha:** 2026-07-07  
**Estado:** Aprobado

## Resumen

Agregar autenticación con Google al dashboard domótico. El admin (usuario/contraseña existente) configura qué cuentas de Google pueden ingresar y el nombre de la casa. Los usuarios finales ven una pantalla de login con botón "Iniciar sesión con Google". Todos los usuarios autenticados tienen acceso total por ahora.

---

## Arquitectura

### Flujo Google OAuth (nuevo)

1. Frontend carga `GOOGLE_CLIENT_ID` desde `GET /api/auth/google-client-id`
2. Usuario hace click en "Iniciar sesión con Google"
3. `@react-oauth/google` abre el popup de Google y retorna un `credential` (JWT firmado por Google)
4. Frontend envía `POST /api/auth/google { credential }`
5. Servidor llama a `https://oauth2.googleapis.com/tokeninfo?id_token=<credential>`
6. Google responde con el payload: `{ email, aud, ... }`
7. Servidor verifica que `aud === GOOGLE_CLIENT_ID`
8. Servidor consulta `config.google_allowed_emails` en DB
9. Si el email está en la lista → emite cookie de sesión propia (igual que login actual) → `{ ok: true }`
10. Si no → `403 { error: "Email no autorizado" }`

### Flujo Admin (sin cambios)

- `POST /api/login` con usuario/contraseña sigue igual
- Cookie de sesión JWT de 30 días, mismo mecanismo

### Pantalla de login

- Muestra el nombre de la casa (cargado desde `/api/admin/config`)
- Botón "Iniciar sesión con Google" (visible siempre)
- Link discreto "Acceso admin" que expande el formulario usuario/contraseña al hacer click

---

## Backend

### Variable de entorno nueva

```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

El `CLIENT_ID` identifica la aplicación (no a los usuarios). Se obtiene una sola vez desde Google Cloud Console.

### Endpoints nuevos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/auth/google-client-id` | ninguna | Devuelve `{ clientId }` para el frontend |
| POST | `/api/auth/google` | ninguna | Verifica credential de Google, emite cookie |
| GET | `/api/admin/config` | authMiddleware | Lee `{ houseName, allowedEmails }` |
| POST | `/api/admin/config` | authMiddleware | Guarda `{ houseName, allowedEmails }` |

### Cambios en `server/auth.js`

Agregar función `verifyGoogleCredential(credential)`:
- Llama a `https://oauth2.googleapis.com/tokeninfo?id_token=<credential>`
- Valida que `aud === process.env.GOOGLE_CLIENT_ID`
- Retorna el email si válido, `null` si no

### DB

No requiere nuevas tablas. Usa la tabla `config` existente con claves:
- `house_name` → string con el nombre de la casa
- `google_allowed_emails` → JSON array de emails permitidos (ej. `["ana@gmail.com","juan@gmail.com"]`)

---

## Frontend

### Cambios en `src/main.jsx`

- Envolver `<App>` con `<GoogleOAuthProvider clientId={clientId}>` 
- El `clientId` se carga al inicio desde `GET /api/auth/google-client-id`

### `src/components/Login/Login.jsx` (reemplazo)

- Carga el nombre de la casa desde `GET /api/admin/config`
- Muestra botón de Google usando `useGoogleLogin` o `GoogleLogin` de `@react-oauth/google`
- Al recibir el credential, llama a `POST /api/auth/google`
- Link "Acceso admin" que expande el formulario usuario/contraseña existente
- Muestra errores claros: "Email no autorizado", "Error de conexión", etc.

### `src/components/Admin/AccessConfig.jsx` (nuevo)

Panel visible dentro de la pestaña "Cuenta" del sidebar (no se agrega una pestaña nueva):

- Campo de texto para el nombre de la casa
- Lista de emails permitidos con botón [x] para eliminar cada uno
- Campo para agregar nuevo email
- Botón "Guardar cambios" que llama a `POST /api/admin/config`
- Feedback visual al guardar (éxito / error)

### `src/App.jsx`

- Integrar `AccessConfig` en el panel de cuenta del admin

---

## Seguridad

- La verificación del token de Google ocurre **siempre en el servidor** — el frontend nunca decide si un usuario es válido
- `aud` del JWT se valida contra `GOOGLE_CLIENT_ID` para evitar tokens de otras apps
- La whitelist de emails vive en DB, solo el admin puede modificarla
- Las cookies de sesión son las mismas de siempre: `httpOnly`, `sameSite: lax`, `secure` en producción

---

## Configuración en Google Cloud Console

1. Crear proyecto en console.cloud.google.com
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Tipo: **Web application**
4. Authorized JavaScript origins:
   - `https://tu-app.onrender.com` (producción)
   - `http://localhost:5173` (desarrollo)
5. Copiar el Client ID al `.env` como `GOOGLE_CLIENT_ID`

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `server/auth.js` | + `verifyGoogleCredential()` |
| `server/index.js` | + 4 endpoints nuevos |
| `src/main.jsx` | + `GoogleOAuthProvider` wrapper |
| `src/components/Login/Login.jsx` | Reemplazo completo |
| `src/components/Admin/AccessConfig.jsx` | Nuevo componente |
| `src/App.jsx` | + integrar AccessConfig en panel cuenta |
| `.env` | + `GOOGLE_CLIENT_ID` |
