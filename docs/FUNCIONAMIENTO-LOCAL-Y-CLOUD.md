# Funcionamiento Local y Cloud

## Arquitectura de conexión

El dashboard opera en modo **local-first**: cuando el dispositivo está en la misma red WiFi que el Hubitat, los comandos van directo al hub sin pasar por internet. El cloud actúa como fallback y como canal de sincronización entre dispositivos.

```
Dispositivo en casa (WiFi)
  └── https://192.168.x.x  →  Hubitat C8 Pro  (LAN, ~10ms)

Dispositivo fuera de casa (datos móviles)
  └── https://widetsdomo.onrender.com  →  Render proxy  →  Hubitat  (~300ms)

Hubitat (siempre, cuando hay internet)
  └── webhook POST  →  Render  →  WebSocket  →  todos los clientes conectados
```

---

## Escenarios

### 1. Internet + WiFi (en casa, todo funcionando)

| | |
|---|---|
| **Chip** | 🟢 verde — "Modo local (LAN directo)" |
| **Comandos** | Directo a `https://192.168.x.x` (~10ms) |
| **Sync** | Hubitat → webhook → Render → WebSocket → todos los clientes |
| **Auth** | `/api/me` confirma sesión con Render |

El app detecta que el Hubitat es alcanzable en LAN y prioriza esa ruta. El cloud solo recibe notificaciones vía webhook cuando algo cambia — no hay polling ni tráfico innecesario.

---

### 2. WiFi activo, internet caído

| | |
|---|---|
| **Chip** | 🟢 verde — "Modo local (LAN directo)" |
| **Comandos** | Directo a `https://192.168.x.x` (~10ms) |
| **Auth** | `localStorage` — si la sesión no expiró (30 días) no pide login |
| **App** | Carga desde cache del service worker (PWA) |

El dashboard funciona con normalidad. Los webhooks de Hubitat no llegan a Render mientras no hay internet, pero cuando la conexión se restaura el WebSocket se reconecta y Render envía `FULL_STATE` resincronizando el estado.

> **Requisito:** haber aceptado el certificado del Hubitat una vez en ese dispositivo  
> (`https://192.168.x.x` → Avanzado → Continuar de todas formas)

---

### 3. Datos móviles, fuera de casa

| | |
|---|---|
| **Chip** | 🟡 ámbar — "Conectado a la nube" |
| **Comandos** | Render proxy → Hubitat (~300ms) |
| **Auth** | `/api/me` con Render normalmente |

El app intenta `https://192.168.x.x` primero (timeout 1s), pero la IP privada no tiene ruta desde una red móvil y falla en ~50ms. Cae automáticamente a `/api/hub-proxy` en Render sin intervención del usuario.

---

### 4. Sin internet y sin WiFi

| | |
|---|---|
| **Chip** | Modal bloqueante — "Sin conexión" |
| **Comandos** | Bloqueados |
| **App** | Carga desde cache del service worker |
| **Auth** | `localStorage` si la sesión no expiró |
| **Estado** | Widgets visibles con el último estado conocido, no interactivos |

El modal se cierra automáticamente cuando cualquiera de las dos conexiones se restaura.

---

## Resumen

| Escenario | Chip | Latencia | Login |
|-----------|------|----------|-------|
| Internet + WiFi | 🟢 Local | ~10ms | Render |
| Solo WiFi | 🟢 Local | ~10ms | localStorage |
| Solo datos móviles | 🟡 Cloud | ~300ms | Render |
| Sin nada | Modal offline | — | localStorage |

---

## Prioridad de rutas (hubClient.js)

Cada comando al Hubitat sigue este orden hasta que uno funciona:

```
1. https://hub.ip        (LAN directo, timeout 1s)
2. /api/hub-proxy        (Render proxy, timeout 8s)
3. cloud.hubitat.com     (Maker API cloud, timeout 8s)
```

---

## Detección de conectividad (useConnectivity.js)

El hook verifica LAN e internet **en paralelo** cada 10 segundos:

- **LAN:** ping `no-cors` a `https://hub.ip` — liviano, sin problemas de CORS
- **Internet:** fetch a `/api/me` en Render

El modo resultante (`'local'` / `'cloud'` / `'offline'`) determina el chip visible y es la señal que usa el dashboard para reflejar el estado de conexión.

---

## Auth offline (App.jsx)

Al hacer login exitoso se guarda la expiración de sesión en `localStorage` (30 días).  
Cuando el app carga y Render no es alcanzable:

- Si `localStorage` tiene sesión válida → entra directo sin pedir login
- Si la sesión expiró o fue cerrada → muestra pantalla de login
- Si Render responde con 401 → borra `localStorage` y muestra login
