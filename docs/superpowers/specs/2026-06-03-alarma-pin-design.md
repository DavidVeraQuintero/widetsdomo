# Alarma — PIN de desarme

**Fecha:** 2026-06-03  
**Widget:** `src/components/widgets/Alarma.jsx`

## Objetivo

Proteger el desarme de la alarma con un PIN numérico para evitar que cualquier usuario pueda desactivarla con un simple clic.

---

## Modelo de datos

Se añade un campo al `config` del widget:

```js
config.pin  // string "1234"–"123456" | null (sin PIN configurado)
```

El estado de intentos fallidos y bloqueo es **estado local React** (no se persiste en config), se reinicia al recargar la página.

---

## Componente `PinModal`

Modal dedicado que se abre al pulsar "Desarmar" cuando `config.pin` está configurado.

**Contenido:**
- Título: "🔐 Introduce el PIN"
- Dots de progreso: N círculos (`○`/`●`) según la longitud del PIN, que se llenan al pulsar dígitos
- Teclado 3×4: botones 1–9, `⌫` (borrar último dígito), `0`, `✓` (confirmar)
- Estado de error: texto rojo "PIN incorrecto" + shake animation en los dots
- Estado de bloqueo: texto "Demasiados intentos. Espera Xs" con cuenta regresiva en tiempo real

**Comportamiento:**
- Al confirmar PIN correcto → llama `onDisarm()` y cierra el modal
- Al confirmar PIN incorrecto → incrementa contador de intentos, muestra error
- Tras 3 intentos fallidos → bloqueo de 60 segundos con cuenta regresiva
- Al pulsar fuera del modal → cierra sin desarmar

---

## Configuración del PIN en `AlarmaModal` (long-press)

Sección visible **solo cuando la alarma está desarmada** (`armed === false`).

**Sin PIN configurado:**
- Botón "Configurar PIN" que expande un mini-teclado 3×4 inline
- El usuario ingresa el PIN (4–6 dígitos) dos veces para confirmar
- Se rechaza si los PINs no coinciden o si tiene menos de 4 dígitos

**Con PIN configurado:**
- Muestra "PIN: ●●●●" (dots sin revelar longitud real)
- Botón "Cambiar PIN" → pide el PIN actual primero, luego el nuevo (con confirmación)
- Botón "Eliminar PIN" → pide el PIN actual para confirmar eliminación

**Con alarma armada:**
- Esta sección no aparece.

---

## Cambios al flujo existente

| Acción | Sin PIN | Con PIN |
|--------|---------|---------|
| Pulsar "Desarmar" (widget) | Desarma directo | Abre `PinModal` |
| Pulsar "Desarmar" (modal) | Desarma directo | Abre `PinModal` |
| Pulsar icono 1×1 (armado) | Desarma directo | Abre `PinModal` |
| Pulsar "Armar" | Arma directo | Arma directo |

---

## Estados de bloqueo

```
failedAttempts: number   // 0–3, reset al éxito o al expirar bloqueo
lockedUntil: number      // timestamp ms, 0 si no hay bloqueo activo
```

- Máximo 3 intentos fallidos consecutivos
- Al llegar a 3 → `lockedUntil = Date.now() + 60_000`
- Cuenta regresiva actualizada cada segundo con `setInterval`
- Al expirar el bloqueo → `failedAttempts = 0`, `lockedUntil = 0`

---

## Archivos a modificar

- `src/components/widgets/Alarma.jsx` — único archivo modificado
