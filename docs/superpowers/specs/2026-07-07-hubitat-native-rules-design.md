# Hubitat Native Automation Rules — Design Spec
**Date:** 2026-07-07
**Status:** Approved

---

## 1. Objetivo

Las reglas de automatización actualmente corren en el browser (solo mientras el dashboard está abierto). Este feature las hace vivir en el Hubitat C8 Pro como una Groovy app nativa, ejecutándose 24/7 en milisegundos al evento, sin depender del browser ni del servidor.

El usuario crea y edita las reglas en la UI existente, las prueba localmente con un botón, y cuando está conforme las guarda en Hubitat.

---

## 2. Arquitectura general

```
Frontend (React)
   │
   ├─ [Probar]  → rulesEngine.js corre la regla en browser (motor existente)
   │              Modal informa al usuario que active las condiciones
   │
   └─ [Guardar en Hubitat]
          │
          ▼
     hubClient.js  ─── POST /apps/api/{autoAppId}/rules?access_token={hub.token}
          │
          ▼
     Hub Proxy (server/hubProxy.js — existente)
          │
          ▼
     Hubitat C8 Pro — WidetsDemoAutomations.groovy
          ├─ Guarda regla en estado interno
          ├─ Suscribe a atributos de dispositivos
          └─ Al evento: evalúa condiciones → ejecuta acciones nativamente
```

**Flag `hubitatSynced`:** cuando se guarda en Hubitat, la regla recibe `config.hubitatSynced = true`. El `rulesEngine.js` filtra y omite estas reglas — sin doble disparo.

---

## 3. Groovy App — WidetsDemoAutomations.groovy

### Archivo
`hubitat-app/WidetsDemoAutomations.groovy`

### Endpoints HTTP (OAuth habilitado)

| Método | Path | Body | Descripción |
|---|---|---|---|
| `GET` | `/rules` | — | Lista todas las reglas |
| `POST` | `/rules` | JSON regla | Upsert por `id` |
| `PUT` | `/rules/:id/enable` | `{ "enabled": true/false }` | Activa o pausa |
| `DELETE` | `/rules/:id` | — | Elimina regla |

### Autenticación
El token es el mismo que el Maker API (`hub.token`). El usuario lo ingresa en las preferencias de la Groovy app durante la instalación. La app valida que `params.access_token == settings.accessToken`.

### Estado interno
```groovy
state.rules = [
  "widget-id-1": { id, name, enabled, conditionGroups, actions },
  "widget-id-2": { ... }
]
state.lastResults = [ "widget-id-1": false, ... ]
```

### Lógica de suscripciones
Al instalar, actualizar o recibir `POST /rules`:
1. Desuscribe todos los eventos anteriores (`unsubscribe()`)
2. Para cada regla `enabled`, itera sus `conditionGroups → conditions`
3. Por cada condición de tipo `device`: `subscribe(getDevice(deviceId), attribute, "onDeviceEvent")`

### Evaluación al evento (`onDeviceEvent`)
```
para cada regla enabled que referencia el dispositivo que cambió:
  resultado = conditionGroups.every(grupo =>
    grupo.operator == "AND"
      ? grupo.conditions.every(c => evalCondition(c))
      : grupo.conditions.some(c => evalCondition(c))
  )

  si resultado == true && lastResults[ruleId] == false:
    ejecutar acciones
    lastResults[ruleId] = true
  si resultado == false:
    lastResults[ruleId] = false
```

### Evaluación de condición
- **device**: `getDevice(deviceId).currentValue(attribute)  operador  value`
- **time**: hora actual HH:MM  operador  value

### Ejecución de acciones
```groovy
def dev = getDevice(action.deviceId)
if (action.arg != null) dev."${action.command}"(action.arg)
else dev."${action.command}"()
```

---

## 4. Cambios en hubClient.js

Tres funciones nuevas:

```js
// Upsert regla en Hubitat
export async function syncRuleToHubitat(hub, rule) { ... }

// Enable/disable regla en Hubitat
export async function setRuleEnabledOnHubitat(hub, ruleId, enabled) { ... }

// Eliminar regla de Hubitat
export async function deleteRuleFromHubitat(hub, ruleId) { ... }
```

Todas usan el hub proxy existente apuntando a `hub.autoAppId` con `hub.token`.

---

## 5. Cambios en hubStore.jsx

```js
// Obtener el hub de un widget (para saber a qué hub apuntar)
function getHubForWidget(widget) { ... }

// Wrappers que despachan las llamadas correctas
async function syncRule(widget) { ... }
async function setRuleEnabled(widgetId, enabled) { ... }
async function deleteRule(widgetId) { ... }
```

---

## 6. Cambios en rulesEngine.js

```js
// Filtrar reglas sincronizadas a Hubitat (excepto durante modo prueba)
const rules = state.widgets
  .filter(w => w.type === 'regla-auto')
  .filter(w => !w.config.hubitatSynced || w.config._testing);
```

El flag `_testing` es temporal, solo existe mientras el modal de prueba está abierto — nunca se persiste.

---

## 7. UI — Modal de configuración de regla

### Botones nuevos (sección inferior del modal)

```
┌─────────────────────────────────────────────────────┐
│  Nombre  / Condiciones / Acciones ...               │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  [  Probar  ]           [ Guardar en Hubitat ]      │
│                                                     │
│  ● En Hubitat    ○ Solo local                       │
└─────────────────────────────────────────────────────┘
```

**Badge de estado:**
- `● En Hubitat` — verde, cuando `config.hubitatSynced === true`
- `○ Solo local` — gris, cuando no está sincronizada

### Modal "Probar"

Aparece sobre el modal de config (que queda detrás):

```
┌────────────────────────────────────┐
│  Probando: "Luz sala nocturna"     │
│                                    │
│  Activa manualmente las            │
│  condiciones de la regla para      │
│  verificar que las acciones se     │
│  ejecuten correctamente.           │
│                                    │
│  El motor local está escuchando.   │
│                                    │
│        [ Cerrar prueba ]           │
└────────────────────────────────────┘
```

- Al abrir: se agrega `_testing: true` al config en memoria (no persiste)
- Al cerrar: se remueve `_testing`
- El `rulesEngine.js` incluye la regla durante prueba aunque tenga `hubitatSynced: true`

---

## 8. UI — Widget ReglaAutomatica (vista en dashboard)

Badge visible en tamaño 2x2:

```
┌──────────────────────┐
│  Luz sala nocturna   │
│                      │
│  Puerta → Luz sala   │
│  Hora >= 20:00       │
│                      │
│ [Hubitat] ●   ━━━○  │
└──────────────────────┘
```

- `[Hubitat]` verde: regla vive en el hub
- `[Local]` gris: solo en el browser
- Toggle: si `hubitatSynced` → llama `setRuleEnabled` en Hubitat al instante

---

## 9. Flujo — Eliminar widget con regla en Hubitat

```
Usuario elimina widget
   │
   ├─ hubitatSynced === false → elimina widget directo (sin cambios)
   │
   └─ hubitatSynced === true
          │
          ▼
     Modal: "Esta regla está activa en Hubitat.
             ¿Eliminarla también del hub?"
          │
       [Cancelar]   [Eliminar todo]
                         │
                         ▼
              deleteRuleFromHubitat(hub, ruleId)
              + elimina widget del dashboard
```

---

## 10. Configuración del hub — campo nuevo

En la UI de Hubs, al expandir un hub tipo Hubitat, nueva sección:

```
── Automatizaciones ───────────────────────────────
  App ID de automatizaciones:  [     ]
  (usa el mismo token del Maker API)
  [ Probar conexión ]
───────────────────────────────────────────────────
```

Nuevo campo en el modelo del hub: `autoAppId` (string numérico).
El token existente `hub.token` se reutiliza — no se agrega campo nuevo para token.

**Cómo obtener el App ID:**
1. Instalar `WidetsDemoAutomations.groovy` en Hubitat (Apps Code → New App)
2. Instalar desde Apps → Add User App → ingresar el Maker API token en preferencias
3. El App ID aparece en la URL de la app: `.../installedapp/configure/47` → `47`

---

## 11. Archivos a crear / modificar

| Archivo | Cambio |
|---|---|
| `hubitat-app/WidetsDemoAutomations.groovy` | **Nuevo** — Groovy app completa |
| `src/services/hubClient.js` | Agregar `syncRuleToHubitat`, `setRuleEnabledOnHubitat`, `deleteRuleFromHubitat` |
| `src/store/hubStore.jsx` | Agregar `autoAppId` al modelo de hub, wrappers para las 3 operaciones |
| `src/rules/rulesEngine.js` | Filtrar por `hubitatSynced && !_testing` |
| `src/widgets/ReglaAutomatica/` | Botones Probar/Guardar, modal de prueba, badge de estado |
| `src/components/HubSettings` (o similar) | Campo `autoAppId` + botón probar conexión |

---

## 12. Caso edge — hub sin autoAppId configurado

Si el usuario hace click en **Guardar en Hubitat** y el hub no tiene `autoAppId` configurado, se muestra un toast de error:

> "Configura el App ID de automatizaciones en la configuración del hub antes de guardar."

No se intenta el sync. La regla queda en estado `Solo local`.

---

## 13. Caso edge — reglas con condiciones de tiempo (`type: "time"`)

La Groovy app en esta versión solo evalúa condiciones de tipo `device` (suscripciones a atributos). Las condiciones de tipo `time` no se evalúan en Hubitat.

**Comportamiento:** si una regla contiene al menos una condición `type: "time"`, el botón **Guardar en Hubitat** muestra un aviso:

> "Esta regla contiene condiciones de hora. Esas condiciones solo se evaluarán mientras el dashboard esté abierto. Las condiciones de dispositivo sí se evaluarán en Hubitat."

El usuario puede guardar igual — las condiciones de dispositivo funcionarán 24/7, las de tiempo solo cuando el browser esté abierto (mismo comportamiento actual).

---

## 14. Fuera de alcance

- Condiciones de tipo `time` nativas en Hubitat (requiere `runAt` / `schedule` en Groovy — v2)
- Sincronización bidireccional (cambios hechos directamente en Hubitat reflejados en el dashboard)
- Múltiples hubs con reglas cruzadas (una condición de hub A → acción en hub B)
