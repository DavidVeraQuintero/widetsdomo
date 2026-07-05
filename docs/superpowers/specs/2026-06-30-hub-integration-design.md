# Hub Integration Design
**Date:** 2026-06-30  
**Status:** Approved

## Overview

Add optional home automation hub connectivity to the dashboard. When no hub is configured the app works exactly as today (demo mode — all widgets available). When a hub is connected, the sidebar gains device counts, widgets without matching devices are locked, and a device picker appears when dropping a widget onto the canvas.

Supports **Hubitat** (Maker API) and **Home Assistant** (REST API) as hub types. Designed for local-first use (home LAN without internet) with server sync when available.

---

## Architecture

### Connection strategy (local-first hybrid)

```
browser → try direct fetch to http://{hub-ip}/api/...
         ├─ success (LAN) → use response directly
         └─ timeout / CORS error → POST /api/hub-proxy
                                    { ip, token, path, method, body }
                                    └─ server fetches hub → returns result
```

- **Local mode (no internet):** browser calls hub directly over LAN.
- **Remote mode:** backend proxies the call to the hub.
- **Offline (no LAN):** fails gracefully; cached device list is used (stale but functional).

### New files

```
src/
  store/hubStore.jsx                 ← hub config + device list state
  components/Hubs/
    HubsTab.jsx                      ← 🏠 tab root: hub list + device catalog
    HubForm.jsx                      ← add / edit hub form (inline within tab)
    DeviceCatalog.jsx                ← filtered device list for selected hub
    DevicePickerModal.jsx            ← dialog shown when dropping a widget
  services/hubClient.js             ← connection logic: direct → proxy fallback

server/
  routes/hubProxy.js                ← POST /api/hub-proxy endpoint
```

### Modified files

```
src/App.jsx                          ← add 🏠 tab to TABS array
src/components/Sidebar/Sidebar.jsx   ← read hubStore, show badges + locked state
src/components/Canvas/CanvasWidget.jsx  ← trigger DevicePickerModal on drop
src/store/syncStore.jsx              ← sync hub config alongside meta
```

---

## Data model

### Hub config (persisted)

```js
{
  id: "hub-1234",           // generated on create
  name: "Casa — Hubitat",   // user-defined label
  type: "hubitat" | "homeassistant",
  ip: "192.168.11.15",      // IP or hostname (no protocol, no trailing slash)
  appId: "12",              // Hubitat only (Maker API App ID)
  token: "abc123...",       // Maker API access_token (Hubitat) or long-lived token (HA)
  enabled: true
}
```

**Hubitat API base:** `http://{ip}/apps/api/{appId}/devices?access_token={token}`  
**HA API base:** `http://{ip}/api/states` with `Authorization: Bearer {token}`

### Device (runtime, not persisted)

```js
{
  hubId: "hub-1234",
  deviceId: "42",           // hub's native device ID
  name: "Tira LED Cocina",
  type: "LamparaRGB",       // mapped to widget type key
  state: { on: false, level: 75, color: "#ff0000" },
  reachable: true,
  lastSeen: 1751234567890
}
```

### Storage

- Hub configs → `localStorage` key `domotica-hubs` (array of hub objects, tokens included)
- Devices → in-memory only (fetched on load / manual sync, never persisted)
- Sync → hub configs replicated to server alongside `metaStore` via existing sync channel

---

## Hub tab UI (🏠)

Added as 5th tab in the floating panel alongside Widgets / Props / Temas / Iconos.

**Main view:**
- Section "HUBS CONECTADOS" — list of configured hubs, each showing: status dot (green/amber), name, IP, device count, refresh (↻) and edit (✎) buttons.
- "+ Agregar" button opens inline form (replaces device list area).
- Section "DISPOSITIVOS" — filter pills (Todos / Luces / Enchufes / Sensores / …) + scrollable device list. Each row: icon, name, widget type, current state, reachability dot.
- Selecting a different hub updates the device list.

**Add/edit form (inline):**
- Hub type selector: Hubitat | Home Assistant (toggles which fields appear).
- Fields: Nombre, IP/URL, App ID (Hubitat only), Access Token.
- Auto-test on token/IP change: fires a lightweight ping to list devices. Shows "Conexión directa OK · N dispositivos" (green) or "Usando proxy del servidor" (amber) or error (red).
- Save → stores to `hubStore`, triggers device fetch, returns to main view.

---

## Sidebar integration

**When no hub is configured (demo mode):**  
Sidebar unchanged — all widgets available, no badges, no locks. Identical to current behavior.

**When at least one hub is configured:**
- Each widget item gains a green badge pill showing the count of matching devices across all enabled hubs.
- Widget types with **zero** matching devices become locked: reduced opacity, grayscale icon, 🔒 indicator, `cursor: not-allowed`, drag disabled.
- Hover tooltip on locked widget: "No tenés dispositivos de tipo {X} en tus hubs." + link "Ir a hubs →" that opens the 🏠 tab.
- Widgets that are NOT hub-dependent (Notas, Calendario, Clima, NavegadorDashboard, PanelEscenas, etc.) are **never** locked regardless of hub state.

**Device count mapping:**  
`hubStore` exposes a `deviceCountByWidgetType` map computed from the fetched device list. `Sidebar` reads this map; zero means locked.

---

## Device picker modal

Triggered when a user drops a hub-dependent widget onto the canvas **and** there are 2+ matching devices.

**Cases:**
| Devices found | Behavior |
|---|---|
| 0 | Widget is locked in sidebar — drop is blocked before this point |
| 1 | No dialog — device auto-assigned, widget placed immediately |
| 2+ | `DevicePickerModal` opens, listing all matching devices |

**Modal content:**
- Header: widget icon + type name + "Seleccioná el dispositivo a controlar".
- Device list: each row shows reachability dot, device name, hub name, last known state.
- Selection: single-select radio-style; first item pre-selected.
- Footer: "Cancelar" (removes the dropped widget) + "Agregar widget →" (confirms).
- On confirm: widget is created with `deviceId` and `hubId` stored in its properties.

---

## Backend: `/api/hub-proxy`

New route on the existing Express server.

```
POST /api/hub-proxy
Body: { ip, token, appId, type, path, method?, body? }
Response: hub's JSON response (proxied as-is)
```

- Validates that `ip` is a private/LAN address (security: prevents SSRF to public internet).
- Sets appropriate headers per hub type (Authorization for HA, access_token query param for Hubitat).
- Timeout: 8 seconds.
- No caching — always live.

---

## Behavior rules

1. **Demo mode is always preserved.** Removing all hubs or never configuring one returns the app to full demo mode.
2. **Sync is additive.** Hub configs sync to server; if a second client connects it gets the hub list automatically.
3. **Tokens are sensitive.** Stored in localStorage (same threat model as existing dashboard data). Not logged on the server proxy.
4. **Stale device list.** If the hub is unreachable on load, the last in-memory list is used (empty on first load). The 🏠 tab shows an amber "sin conexión" indicator; badges show last known counts.
5. **Multiple hubs.** Device counts are the sum across all enabled hubs. The device picker shows which hub each device belongs to.
6. **Non-lockable widget types** (always available regardless of hub): Notas, CalendarioDia, CalendarioMini, EstacionMeteorologica (manual), Temporizador, ReglaAutomatica, NavegadorDashboard, PanelEscenas, EscenaActiva, EscenaIndividual, EstadoHogar, Alarma, AlarmV2, Musica, CamaraIP (manual URL), ColorWheel.

---

## Out of scope

- Real-time push from hub (WebSocket/SSE) — polling or manual refresh only.
- Executing commands from the 🏠 catalog tab — devices are display-only there; control happens via dashboard widgets.
- Zigbee/Z-Wave pairing or hub firmware management.
- OAuth flows — tokens are entered manually by the user.
