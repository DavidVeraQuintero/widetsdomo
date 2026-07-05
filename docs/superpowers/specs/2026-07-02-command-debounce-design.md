# Command Debounce — Diseño

**Fecha:** 2026-07-02  
**Estado:** Aprobado

## Problema

Cuando el usuario arrastra un slider de brillo o la rueda de color, cada evento de movimiento genera una llamada HTTP inmediata al Hubitat. 10 segundos de arrastre = decenas de requests innecesarios. Hubitat se satura procesando valores intermedios que nunca llegan a verse en el dispositivo.

## Solución

Debounce centralizado en `sendCommand` (hubStore). Un `Map` a nivel de módulo agrupa comandos por clave `hubId:deviceId:command`. Cada nueva llamada con la misma clave cancela el timer anterior y agenda uno nuevo de 300ms. Solo el último valor viaja al Hubitat.

## Comportamiento

- Clave de agrupación: `"${hubId}:${deviceId}:${command}"`
- Delay: **300ms** desde el último evento de esa clave
- Comandos distintos (ej. `setHue` vs `setLevel`) tienen timers independientes
- El sistema es uniforme: todos los comandos (incluidos `on`/`off`) pasan por el mismo debounce
- Resultado: N comandos durante un arrastre → 1 HTTP call 300ms después de soltar

## Ejemplo

```
t=0ms   setHue 40        → timer setHue: reset 300ms
t=50ms  setSaturation 80  → timer setSaturation: reset 300ms
t=100ms setLevel 60       → timer setLevel: reset 300ms
t=150ms setHue 55         → timer setHue: reset 300ms  (cancela t=0ms)
t=200ms setLevel 100      → timer setLevel: reset 300ms (cancela t=100ms)
t=500ms [silencio]        → envía setHue 55, setSaturation 80, setLevel 100
```

3 HTTP calls en lugar de 5 (o decenas si el usuario arrastra).

## Arquitectura

### Cambio único: `src/store/hubStore.jsx`

```js
// Módulo-level (fuera del componente) — no es estado React
const _pendingCmds = new Map(); // "hubId:deviceId:command" → timerId
const DEBOUNCE_MS = 300;

// Dentro de useCallback sendCommand:
const key = `${hubId}:${deviceId}:${command}`;
clearTimeout(_pendingCmds.get(key));
_pendingCmds.set(key, setTimeout(async () => {
  _pendingCmds.delete(key);
  try { await sendDeviceCommand(hub, deviceId, command, arg); }
  catch (err) { console.warn('[Hub] Command failed:', command, err.message); }
}, DEBOUNCE_MS));
```

### Sin cambios en:
- `useDeviceControl.js` — el hook no sabe nada del debounce
- Ningún widget — transparente para todos
- `hubClient.js` — `sendDeviceCommand` sigue igual

## Scope

- Solo modifica `sendCommand` en `hubStore.jsx`
- El `Map` `_pendingCmds` es module-level para sobrevivir re-renders
- No se limpia al desmontar HubProvider (los timers de 300ms son inofensivos si el hub desaparece porque `hub` estará vacío al resolverse)
