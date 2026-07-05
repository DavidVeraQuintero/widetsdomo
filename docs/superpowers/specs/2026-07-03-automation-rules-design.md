# Automation Rules Engine — Design Spec
**Date:** 2026-07-03  
**Branch:** feat/fix-responsive-simple  
**Status:** Approved

---

## 1. Objetivo

Reemplazar el widget `ReglaAutomatica` actual (condiciones de texto fijas, sin conexión real a dispositivos) por un sistema de reglas de automatización real donde el usuario puede:

- Seleccionar cualquier dispositivo que tenga un tipo de widget asignado en la pestaña Hubs
- Definir condiciones sobre su estado (puerta abierta, temperatura >= 25°, hora >= 20:00)
- Agrupar condiciones con AND/OR por grupo, grupos conectados entre sí con AND
- Definir múltiples acciones (encender luz, apagar enchufe, bloquear cerradura, etc.)
- Activar/desactivar cada regla individualmente

Las reglas corren en el browser (edge-triggered). Funcionan mientras el dashboard esté abierto.

---

## 2. Modelo de datos

Cada widget con ID `regla-auto` guarda su regla en `config`:

```json
{
  "name": "Luces nocturnas",
  "enabled": true,
  "conditionGroups": [
    {
      "id": "g1",
      "operator": "OR",
      "conditions": [
        {
          "id": "c1",
          "type": "device",
          "hubId": "hub-1",
          "deviceId": "42",
          "widgetTypeId": "puerta",
          "attribute": "contact",
          "operator": "eq",
          "value": "open"
        },
        {
          "id": "c2",
          "type": "device",
          "hubId": "hub-1",
          "deviceId": "43",
          "widgetTypeId": "puerta",
          "attribute": "contact",
          "operator": "eq",
          "value": "open"
        }
      ]
    },
    {
      "id": "g2",
      "operator": "AND",
      "conditions": [
        {
          "id": "c3",
          "type": "time",
          "operator": "gte",
          "value": "20:00"
        }
      ]
    }
  ],
  "actions": [
    {
      "id": "a1",
      "hubId": "hub-1",
      "deviceId": "55",
      "widgetTypeId": "lampara-simple",
      "command": "on",
      "arg": null
    },
    {
      "id": "a2",
      "hubId": "hub-1",
      "deviceId": "60",
      "widgetTypeId": "enchufe",
      "command": "on",
      "arg": null
    }
  ]
}
```

**Regla de evaluación entre grupos:** siempre AND. Todos los grupos deben ser verdaderos.  
**Regla de evaluación dentro de un grupo:** el campo `operator` del grupo (AND u OR).

---

## 3. Condiciones disponibles por tipo de widget

| widgetTypeId | attribute | operadores | valores posibles |
|---|---|---|---|
| `puerta`, `ventana` | `contact` | `eq` | `open`, `closed` |
| `lampara-simple`, `enchufe` | `switch` | `eq` | `on`, `off` |
| `lampara-dimmer`, `tira-led` | `switch` | `eq` | `on`, `off` |
| `sensor-movimiento` | `motion` | `eq` | `active`, `inactive` |
| `sensor-presencia` | `presence` | `eq` | `present`, `not present` |
| `cerradura` | `lock` | `eq` | `locked`, `unlocked` |
| `sensor-temp` | `temperature` | `eq`, `gte`, `lte` | número (°C) |
| `sensor-luz` | `illuminance` | `eq`, `gte`, `lte` | número (lux) |
| `sensor-humo` | `smoke` | `eq` | `detected`, `clear` |
| `sensor-inundacion` | `water` | `eq` | `wet`, `dry` |
| `enchufe` (medidor) | `power` | `eq`, `gte`, `lte` | número (watts) |
| `tiempo` (especial) | — | `eq`, `gte`, `lte` | `HH:MM` |

---

## 4. Acciones disponibles por tipo de widget

| widgetTypeId | comandos | arg |
|---|---|---|
| `lampara-simple`, `enchufe` | `on`, `off`, `toggle` | — |
| `lampara-dimmer`, `tira-led` | `on`, `off`, `setLevel` | nivel 0-100 |
| `lampara-rgb` | `on`, `off`, `setColor` | `{ hue, saturation, level }` |
| `lampara-cct` | `on`, `off`, `setColorTemperature` | valor Kelvin |
| `cerradura` | `lock`, `unlock` | — |
| `persiana-roller`, `cortina`, `toldo`, `veneciana` | `open`, `close`, `setPosition` | posición 0-100 |
| `ventilador` | `on`, `off` | — |
| `termostato`, `aire-acondicionado` | `on`, `off` | — |

---

## 5. Motor de reglas (RulesEngine)

### Ubicación
Componente invisible montado una sola vez en `App.jsx`:
```jsx
<RulesEngine />
```

El motor encuentra las reglas buscando todos los widgets con `type === 'regla-auto'` en todos los dashboards del dashboardStore.

### Archivos nuevos
```
src/rules/
├── rulesEngine.js        — componente React invisible con la lógica
├── deviceConditions.js   — mapa widgetTypeId → { attribute, operators, values }
└── deviceActions.js      — mapa widgetTypeId → [{ command, hasArg, argType }]
```

### Lógica de evaluación

**Edge-triggered:** el motor mantiene un Map `ruleId → lastResult (boolean)`. Solo ejecuta acciones cuando la regla transiciona de `false` a `true`. Si ya era `true` y sigue siendo `true`, no ejecuta nada.

**Triggers de re-evaluación:**
- Cambio en `deviceStates` del hubStore → re-evalúa todas las reglas que referencian ese dispositivo
- `setInterval` cada 60 segundos → re-evalúa todas las reglas con condiciones de tipo `time`

**Algoritmo:**
```
para cada regla enabled:
  resultado = conditionGroups.every(grupo =>
    grupo.operator === 'AND'
      ? grupo.conditions.every(c => evalCondition(c))
      : grupo.conditions.some(c => evalCondition(c))
  )

  si resultado === true && lastResult[ruleId] === false:
    ejecutar todas las acciones de la regla
    lastResult[ruleId] = true
  si resultado === false:
    lastResult[ruleId] = false
```

**Evaluación de condición de dispositivo:**
```
deviceStates["hubId:deviceId"][attribute]  operador  value
```

**Evaluación de condición de tiempo:**
```
horaActual (HH:MM)  operador  value (HH:MM)
```
Para `eq`: coincide si el minuto actual es exactamente igual (ventana de 1 minuto por el interval).

**Ejecución de acciones:**  
Llama a `sendCommand(hubId, deviceId, command, arg)` del hubStore. El debounce de 300ms ya está incorporado en `sendCommand`.

---

## 6. UI — Widget ReglaAutomatica

### Vista widget (3 tamaños)

**1x2 / 2x1:** nombre + estado (Activa / Pausada) + toggle  
**2x2:** muestra resumen de condiciones (hasta 3) y acciones (hasta 2) + toggle

### Modal de configuración (long press)

Secciones en orden:

1. **Nombre** — input de texto

2. **Condiciones** — lista de grupos
   - Cada grupo: badge AND/OR clickeable (toggle), lista de condiciones, botón `+ condición`, botón `×` para eliminar grupo
   - Botón `+ agregar grupo` al final
   - Entre grupos: separador visual "AND" (fijo, no editable)

3. **Acciones** — lista de acciones
   - Cada acción: ícono del widget type + nombre dispositivo + comando + botón `×`
   - Botón `+ agregar acción`

4. **Botón Guardar**

### Flujo — agregar condición

Click `+ condición` dentro de un grupo abre un picker inline o sub-modal con dos pasos:

**Paso 1 — Tipo:**  
`[Dispositivo]` `[Tiempo]`

**Paso 2a — Si Dispositivo:**
- Lista de dispositivos asignados en Hubs (agrupados por hub si hay más de uno)
- Muestra: nombre del dispositivo + ícono del widgetType asignado
- Al seleccionar: dropdown de atributo → dropdown de operador → valor (dropdown o input numérico)

**Paso 2b — Si Tiempo:**
- Dropdown operador: `a las (=)`, `después de (>=)`, `antes de (<=)`
- Input hora: `HH:MM`

### Flujo — agregar acción

Click `+ agregar acción` abre picker:
- Lista de dispositivos asignados (solo los que tienen comandos disponibles, es decir, no sensores)
- Al seleccionar: dropdown de comando
- Si el comando requiere arg (setLevel, setColor, setPosition): muestra input/slider adicional

---

## 7. Fuente de dispositivos para el picker

Los pickers de condición y acción leen de:
```js
hubStore.assignments        // { "hubId:deviceId": widgetTypeId }
hubStore.devices            // { hubId: Device[] }  (Device tiene .deviceId, .label)
```

Para cada entrada en `assignments`:
- `key = "hubId:deviceId"` → split para obtener hubId y deviceId
- `widgetTypeId` = valor del assignment
- `label` = `devices[hubId].find(d => d.deviceId === deviceId).label`

Para condiciones: mostrar todos los widgetTypes que tienen entradas en `deviceConditions.js`  
Para acciones: mostrar solo los widgetTypes que tienen entradas en `deviceActions.js` (excluye sensores puros)

---

## 8. Almacenamiento

Las reglas se guardan en `config` de cada widget `ReglaAutomatica`. El dashboardStore ya persiste todos los configs en localStorage y los sincroniza al servidor. No se necesitan cambios en el servidor ni en el schema de la DB.

---

## 9. Casos cubiertos

| Caso | Cómo se modela |
|---|---|
| A las 8pm encender luz | Grupo 1 (AND): `tiempo = 20:00` → acción: `on` |
| Puerta 1 OR puerta 2 abre → encender | Grupo 1 (OR): `puerta1=open`, `puerta2=open` → acción: `on` |
| (Puerta abierta) AND (hora >= 8pm) | Grupo 1: `puerta=open`, Grupo 2: `hora>=20:00` → acción: `on` |
| Consumo > 0 AND sin presencia → apagar | Grupo 1 (AND): `enchufe.power>=1`, `presencia=inactive` → acción: `off` |
| Humo detectado → alarma | Grupo 1: `smoke=detected` → acción: `arm` |

---

## 10. Fuera de alcance (esta versión)

- Reglas 24/7 sin browser (requiere Groovy app en Hubitat — futuro)
- Grupos anidados más de 2 niveles
- Notificaciones push / email como acción
- Delay en acciones ("encender 5 minutos después")
- Historial de ejecuciones de reglas
- Widget de Alarma (AlarmV2) como condición o acción — es local, sin conexión al hub, requiere diseño separado
- Reglas 24/7 vía app Groovy en Hubitat
