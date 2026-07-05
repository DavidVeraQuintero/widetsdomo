# Automation Rules Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el widget ReglaAutomatica con un motor de reglas real que permita seleccionar dispositivos del hub, definir condiciones agrupadas con AND/OR, y ejecutar múltiples acciones cuando las condiciones se cumplen.

**Architecture:** Las reglas se almacenan en el `config` de cada widget `regla-auto` (localStorage existente). Un componente invisible `RulesEngine` montado en `App.jsx` observa `deviceStates` del hubStore y evalúa las reglas con lógica edge-triggered (solo dispara al transicionar de false→true). La lógica de evaluación pura está separada en `src/rules/evaluateRule.js` para poder testarla con Node.

**Tech Stack:** React 18, hooks, createPortal, Node built-in test runner (node:test), hubStore WebSocket existente.

---

## Spec de referencia
`docs/superpowers/specs/2026-07-03-automation-rules-design.md`

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/rules/deviceConditions.js` | Crear | Metadatos de condiciones por widgetTypeId |
| `src/rules/deviceActions.js` | Crear | Metadatos de acciones por widgetTypeId |
| `src/rules/evaluateRule.js` | Crear | Funciones puras de evaluación (testables) |
| `server/test/evaluateRule.test.js` | Crear | Tests Node para evaluateRule |
| `src/rules/rulesEngine.js` | Crear | Componente invisible React (motor) |
| `src/App.jsx` | Modificar | Montar `<RulesEngine />` una sola vez |
| `src/catalog/widgetCatalog.jsx` | Modificar | defaultConfig nuevo para `regla-auto` |
| `src/components/widgets/ReglaAutomatica.jsx` | Reescribir | Widget face + modal de configuración |

---

## Task 1: Metadatos de condiciones y acciones

**Files:**
- Create: `src/rules/deviceConditions.js`
- Create: `src/rules/deviceActions.js`

- [ ] **Step 1: Crear deviceConditions.js**

```js
// src/rules/deviceConditions.js
export const DEVICE_CONDITIONS = {
  'puerta':          [{ attribute: 'contact',     operators: ['eq'],            valueType: 'enum',   values: ['open','closed'] }],
  'ventana':         [{ attribute: 'contact',     operators: ['eq'],            valueType: 'enum',   values: ['open','closed'] }],
  'lampara-simple':  [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-dimmer':  [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-rgb':     [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-cct':     [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'tira-led':        [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'tira-led-rgb':    [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'enchufe': [
    { attribute: 'switch', operators: ['eq'],            valueType: 'enum',   values: ['on','off'] },
    { attribute: 'power',  operators: ['eq','gte','lte'], valueType: 'number', unit: 'W' },
  ],
  'sensor-movimiento': [{ attribute: 'motion',    operators: ['eq'],            valueType: 'enum',   values: ['active','inactive'] }],
  'sensor-presencia':  [{ attribute: 'presence',  operators: ['eq'],            valueType: 'enum',   values: ['present','not present'] }],
  'cerradura':         [{ attribute: 'lock',       operators: ['eq'],            valueType: 'enum',   values: ['locked','unlocked'] }],
  'sensor-temp':       [{ attribute: 'temperature', operators: ['eq','gte','lte'], valueType: 'number', unit: '°C' }],
  'sensor-luz':        [{ attribute: 'illuminance', operators: ['eq','gte','lte'], valueType: 'number', unit: 'lux' }],
  'sensor-humo':       [{ attribute: 'smoke',      operators: ['eq'],            valueType: 'enum',   values: ['detected','clear'] }],
  'sensor-inundacion': [{ attribute: 'water',      operators: ['eq'],            valueType: 'enum',   values: ['wet','dry'] }],
};

export const TIME_CONDITION = { operators: ['eq','gte','lte'], valueType: 'time' };

export const OPERATOR_LABELS = { eq: '=', gte: '≥', lte: '≤' };

export const VALUE_LABELS = {
  open: 'abierta', closed: 'cerrada',
  on: 'encendida', off: 'apagada',
  active: 'activo', inactive: 'inactivo',
  present: 'presente', 'not present': 'ausente',
  locked: 'bloqueada', unlocked: 'desbloqueada',
  detected: 'detectado', clear: 'despejado',
  wet: 'mojado', dry: 'seco',
};
```

- [ ] **Step 2: Crear deviceActions.js**

```js
// src/rules/deviceActions.js
export const DEVICE_ACTIONS = {
  'lampara-simple': [
    { command: 'on',     label: 'Encender' },
    { command: 'off',    label: 'Apagar' },
    { command: 'toggle', label: 'Toggle' },
  ],
  'lampara-dimmer': [
    { command: 'on',       label: 'Encender' },
    { command: 'off',      label: 'Apagar' },
    { command: 'setLevel', label: 'Nivel', argType: 'level' },
  ],
  'lampara-rgb': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'lampara-cct': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'tira-led': [
    { command: 'on',       label: 'Encender' },
    { command: 'off',      label: 'Apagar' },
    { command: 'setLevel', label: 'Nivel', argType: 'level' },
  ],
  'tira-led-rgb': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'enchufe': [
    { command: 'on',     label: 'Encender' },
    { command: 'off',    label: 'Apagar' },
    { command: 'toggle', label: 'Toggle' },
  ],
  'cerradura': [
    { command: 'lock',   label: 'Bloquear' },
    { command: 'unlock', label: 'Desbloquear' },
  ],
  'persiana-roller': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'cortina': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'toldo': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'veneciana': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'ventilador':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'termostato':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'aire-acondicionado':[{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'calefactor':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
};

export const WIDGET_ICONS = {
  'lampara-simple': '💡', 'lampara-dimmer': '🔆', 'lampara-rgb': '🎨', 'lampara-cct': '💫',
  'tira-led-rgb': '✨', 'tira-led': '✨', 'enchufe': '🔌', 'termostato': '🌡',
  'aire-acondicionado': '❄', 'calefactor': '🔥', 'ventilador': '🌀',
  'puerta': '🚪', 'ventana': '🪟', 'cerradura': '🔒',
  'sensor-movimiento': '👁', 'sensor-presencia': '🧑', 'sensor-temp': '🌡',
  'sensor-humo': '🔥', 'sensor-inundacion': '💧', 'sensor-luz': '☀',
  'persiana-roller': '📋', 'cortina': '🎭', 'toldo': '⛺', 'veneciana': '🪞',
  'time': '⏰',
};
```

- [ ] **Step 3: Commit**

```bash
git add src/rules/deviceConditions.js src/rules/deviceActions.js
git commit -m "feat(rules): metadatos de condiciones y acciones por widget type"
```

---

## Task 2: Lógica pura de evaluación

**Files:**
- Create: `src/rules/evaluateRule.js`

- [ ] **Step 1: Crear evaluateRule.js**

```js
// src/rules/evaluateRule.js

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function compareValues(actual, operator, expected) {
  switch (operator) {
    case 'eq':  return String(actual) === String(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    default:    return false;
  }
}

export function evaluateCondition(condition, deviceStates, now) {
  if (condition.type === 'time') {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = timeToMinutes(condition.value);
    return compareValues(nowMins, condition.operator, targetMins);
  }
  const key = `${condition.hubId}:${condition.deviceId}`;
  const state = deviceStates[key];
  if (!state) return false;
  const actual = state[condition.attribute];
  if (actual === undefined || actual === null) return false;
  return compareValues(actual, condition.operator, condition.value);
}

export function evaluateGroup(group, deviceStates, now) {
  if (!group.conditions?.length) return false;
  if (group.operator === 'OR') {
    return group.conditions.some(c => evaluateCondition(c, deviceStates, now));
  }
  return group.conditions.every(c => evaluateCondition(c, deviceStates, now));
}

export function evaluateRule(rule, deviceStates, now = new Date()) {
  if (!rule.enabled) return false;
  if (!rule.conditionGroups?.length) return false;
  return rule.conditionGroups.every(g => evaluateGroup(g, deviceStates, now));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rules/evaluateRule.js
git commit -m "feat(rules): lógica pura de evaluación de reglas"
```

---

## Task 3: Tests de evaluación

**Files:**
- Create: `server/test/evaluateRule.test.js`

- [ ] **Step 1: Crear el archivo de tests**

```js
// server/test/evaluateRule.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCondition, evaluateGroup, evaluateRule } from '../../src/rules/evaluateRule.js';

const NOW = new Date('2026-01-01T20:30:00'); // 20:30

// ── evaluateCondition ──────────────────────────────────────────
test('device eq: coincide', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { contact: 'open' } }, NOW), true);
});

test('device eq: no coincide', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { contact: 'closed' } }, NOW), false);
});

test('device: dispositivo ausente en states → false', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, {}, NOW), false);
});

test('device gte: power 5 >= 1 → true', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'power', operator: 'gte', value: '1' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { power: '5' } }, NOW), true);
});

test('device gte: power 5 >= 10 → false', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'power', operator: 'gte', value: '10' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { power: '5' } }, NOW), false);
});

test('time eq: 20:30 = 20:30 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'eq', value: '20:30' }, {}, NOW), true);
});

test('time eq: 20:30 = 20:00 → false', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'eq', value: '20:00' }, {}, NOW), false);
});

test('time gte: 20:30 >= 20:00 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'gte', value: '20:00' }, {}, NOW), true);
});

test('time gte: 20:30 >= 21:00 → false', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'gte', value: '21:00' }, {}, NOW), false);
});

test('time lte: 20:30 <= 21:00 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'lte', value: '21:00' }, {}, NOW), true);
});

// ── evaluateGroup ──────────────────────────────────────────────
test('group OR: una coincide → true', () => {
  const group = {
    operator: 'OR',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'open' } }, NOW), true);
});

test('group OR: ninguna coincide → false', () => {
  const group = {
    operator: 'OR',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'closed' } }, NOW), false);
});

test('group AND: todas coinciden → true', () => {
  const group = {
    operator: 'AND',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'time', operator: 'gte', value: '20:00' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'open' } }, NOW), true);
});

test('group AND: una falla → false', () => {
  const group = {
    operator: 'AND',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'time', operator: 'gte', value: '21:00' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'open' } }, NOW), false);
});

test('group: conditions vacías → false', () => {
  assert.equal(evaluateGroup({ operator: 'AND', conditions: [] }, {}, NOW), false);
});

// ── evaluateRule ───────────────────────────────────────────────
test('rule disabled → false', () => {
  const rule = {
    enabled: false,
    conditionGroups: [{ operator: 'AND', conditions: [{ type: 'time', operator: 'gte', value: '20:00' }] }],
    actions: [],
  };
  assert.equal(evaluateRule(rule, {}, NOW), false);
});

test('rule sin grupos → false', () => {
  assert.equal(evaluateRule({ enabled: true, conditionGroups: [], actions: [] }, {}, NOW), false);
});

test('(puerta1 OR puerta2) AND hora>=20: ambas condiciones match → true', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      {
        operator: 'OR',
        conditions: [
          { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
          { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
        ],
      },
      {
        operator: 'AND',
        conditions: [{ type: 'time', operator: 'gte', value: '20:00' }],
      },
    ],
    actions: [],
  };
  const states = { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'open' } };
  assert.equal(evaluateRule(rule, states, NOW), true);
});

test('(puerta1 OR puerta2) AND hora>=21: tiempo falla → false', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      {
        operator: 'OR',
        conditions: [
          { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
          { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
        ],
      },
      {
        operator: 'AND',
        conditions: [{ type: 'time', operator: 'gte', value: '21:00' }],
      },
    ],
    actions: [],
  };
  const states = { 'h1:d2': { contact: 'open' } };
  assert.equal(evaluateRule(rule, states, NOW), false);
});

test('solo tiempo: a las 20:30 → true', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      { operator: 'AND', conditions: [{ type: 'time', operator: 'eq', value: '20:30' }] },
    ],
    actions: [],
  };
  assert.equal(evaluateRule(rule, {}, NOW), true);
});
```

- [ ] **Step 2: Ejecutar los tests**

```bash
node --test server/test/evaluateRule.test.js
```

Expected: todos los tests pasan (✓ verde). Si alguno falla, revisar `evaluateRule.js`.

- [ ] **Step 3: Commit**

```bash
git add server/test/evaluateRule.test.js
git commit -m "test(rules): tests de evaluación de condiciones, grupos y reglas"
```

---

## Task 4: RulesEngine component + mount en App.jsx

**Files:**
- Create: `src/rules/rulesEngine.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Crear rulesEngine.js**

```jsx
// src/rules/rulesEngine.js
import { useEffect, useRef } from 'react';
import { useDashboard } from '../store/dashboardStore.jsx';
import { useHub } from '../store/hubStore.jsx';
import { evaluateRule } from './evaluateRule.js';

export default function RulesEngine() {
  const { state } = useDashboard();
  const { deviceStates, sendCommand } = useHub();
  const lastResults = useRef({});

  const runAll = (states, now) => {
    const rules = state.widgets.filter(w => w.type === 'regla-auto');
    for (const widget of rules) {
      const result = evaluateRule(widget.config, states, now);
      const prev = lastResults.current[widget.id] ?? false;
      if (result && !prev) {
        for (const action of (widget.config.actions ?? [])) {
          sendCommand(action.hubId, action.deviceId, action.command, action.arg ?? undefined);
        }
      }
      lastResults.current[widget.id] = result;
    }
  };

  useEffect(() => {
    runAll(deviceStates, new Date());
  }, [deviceStates]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasTimeRules = state.widgets
      .filter(w => w.type === 'regla-auto')
      .some(w => (w.config.conditionGroups ?? [])
        .some(g => g.conditions.some(c => c.type === 'time')));
    if (!hasTimeRules) return;
    const id = setInterval(() => runAll(deviceStates, new Date()), 60_000);
    return () => clearInterval(id);
  }, [state.widgets, deviceStates]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
```

- [ ] **Step 2: Montar RulesEngine en App.jsx**

En `src/App.jsx`, agregar el import al principio junto a los otros imports:
```jsx
import RulesEngine from './rules/rulesEngine.js';
```

Buscar el componente `AppContent` y agregar `<RulesEngine />` dentro del return, junto a `<ThemeApplier />`:
```jsx
return (
  <>
    <ThemeApplier />
    <RulesEngine />
    {/* ... resto del JSX sin cambios ... */}
  </>
);
```

- [ ] **Step 3: Verificar que la app compila**

```bash
npm run dev
```

Expected: la app abre sin errores en consola. RulesEngine no hace nada visible todavía (no hay reglas con el nuevo formato).

- [ ] **Step 4: Commit**

```bash
git add src/rules/rulesEngine.js src/App.jsx
git commit -m "feat(rules): motor de reglas edge-triggered montado en App"
```

---

## Task 5: Actualizar defaultConfig en widgetCatalog

**Files:**
- Modify: `src/catalog/widgetCatalog.jsx:94`

- [ ] **Step 1: Reemplazar el defaultConfig de regla-auto**

En `src/catalog/widgetCatalog.jsx`, encontrar la línea con `id: 'regla-auto'` (línea ~94) y reemplazar su `defaultConfig`:

```jsx
{ id: 'regla-auto', category: 'Automatización', categoryIcon: '⚙', icon: '⚙', name: 'Regla Auto', sizes: ['1x2','2x1','2x2'], defaultConfig: { enabled: true, name: 'Mi regla', conditionGroups: [], actions: [] }, component: ReglaAutomatica },
```

- [ ] **Step 2: Commit**

```bash
git add src/catalog/widgetCatalog.jsx
git commit -m "feat(rules): defaultConfig de regla-auto usa nuevo modelo de datos"
```

---

## Task 6: ReglaAutomatica — widget faces

**Files:**
- Modify: `src/components/widgets/ReglaAutomatica.jsx` (rewrite completo)

Reemplazar todo el contenido de `ReglaAutomatica.jsx`. En este task solo implementamos las vistas del widget (sin modal). El modal se agrega en el Task 7.

- [ ] **Step 1: Escribir la nueva base del archivo**

```jsx
// src/components/widgets/ReglaAutomatica.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import SvgIcon from './SvgIcon';
import { useLongPress } from './widgetUtils';
import { useHub } from '../../store/hubStore.jsx';
import { OPERATOR_LABELS, VALUE_LABELS } from '../../rules/deviceConditions.js';
import { WIDGET_ICONS } from '../../rules/deviceActions.js';

// ── Helpers de display ─────────────────────────────────────────

function conditionLabel(c) {
  if (c.type === 'time') {
    const opLabel = { eq: 'hora =', gte: 'hora ≥', lte: 'hora ≤' }[c.operator] || c.operator;
    return { icon: '⏰', text: `${opLabel} ${c.value}` };
  }
  const op = OPERATOR_LABELS[c.operator] || c.operator;
  const val = VALUE_LABELS[c.value] || c.value;
  const icon = WIDGET_ICONS[c.widgetTypeId] || '•';
  return { icon, text: `${c.deviceLabel ?? c.deviceId} ${op} ${val}` };
}

function actionLabel(a) {
  const cmdLabels = {
    on: 'encender', off: 'apagar', toggle: 'toggle',
    lock: 'bloquear', unlock: 'desbloquear',
    open: 'abrir', close: 'cerrar',
    setLevel: `nivel ${a.arg ?? '?'}%`,
    setPosition: `posición ${a.arg ?? '?'}%`,
  };
  const icon = WIDGET_ICONS[a.widgetTypeId] || '•';
  return { icon, text: `${a.deviceLabel ?? a.deviceId} → ${cmdLabels[a.command] || a.command}` };
}

// ── Componente placeholder del modal (se implementa en Task 7) ─
function ConfigModal({ config, onSave, onClose }) {
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:'2px solid #1e3a5f', borderRadius:'1.14rem', padding:'1.5rem', color:'white' }}
        onMouseDown={e => e.stopPropagation()}>
        <p>Modal de configuración — Task 7</p>
        <button className="w-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>,
    document.body
  );
}

// ── Widget faces ───────────────────────────────────────────────

export default function ReglaAutomatica({ size, config, onConfigChange }) {
  const { enabled = true, name = 'Mi regla', conditionGroups = [], actions = [] } = config;
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));
  const col = enabled ? 'var(--icon-on)' : 'var(--text-dim)';
  const toggle = e => { e?.stopPropagation(); onConfigChange({ ...config, enabled: !enabled }); };
  const allConditions = conditionGroups.flatMap(g => g.conditions ?? []);

  const Modal = modal && (
    <ConfigModal
      config={config}
      onSave={c => { onConfigChange(c); setModal(false); }}
      onClose={() => setModal(false)}
    />
  );

  if (size === '1x2') return (
    <>
      <div className="w-body w-center" {...longPress}>
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
          <Toggle on={enabled} onToggle={toggle} />
        </div>
        <SvgIcon id="rule" size={44} color={col} className={enabled ? 'icon-glow' : ''} />
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>{name}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{enabled ? '● Activa' : '○ Pausada'}</div>
      </div>
      {Modal}
    </>
  );

  if (size === '2x1') return (
    <>
      <div className="w-row-body" style={{ position:'relative' }} {...longPress}>
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
          <Toggle on={enabled} onToggle={toggle} />
        </div>
        <SvgIcon id="rule" size={32} color={col} className={enabled ? 'icon-glow' : ''} />
        <div className="w-info" style={{ paddingRight:44 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
          <div style={{ fontSize:11, color:'var(--text-secondary)' }}>
            {allConditions.length > 0
              ? `${allConditions.length} cond · ${actions.length} acc`
              : 'Sin configurar'}
          </div>
        </div>
      </div>
      {Modal}
    </>
  );

  // 2x2
  return (
    <>
      <div className="w-body" {...longPress}>
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
          <Toggle on={enabled} onToggle={toggle} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, paddingRight:44 }}>
          <SvgIcon id="rule" size={14} color={col} />
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
        </div>
        <div className="w-divider" />
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>SI</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1, overflow:'hidden' }}>
          {allConditions.length === 0 && <span style={{ fontSize:11, color:'var(--text-dim)' }}>Sin condiciones</span>}
          {allConditions.slice(0,3).map((c, i) => {
            const { icon, text } = conditionLabel(c);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:11 }}>{icon}</span>
                <span style={{ fontSize:11, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
              </div>
            );
          })}
          {allConditions.length > 3 && <span style={{ fontSize:10, color:'var(--text-dim)' }}>+{allConditions.length - 3} más</span>}
        </div>
        <div className="w-divider" />
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>ENTONCES</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, overflow:'hidden' }}>
          {actions.length === 0 && <span style={{ fontSize:11, color:'var(--text-dim)' }}>Sin acciones</span>}
          {actions.slice(0,2).map((a, i) => {
            const { icon, text } = actionLabel(a);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:11 }}>{icon}</span>
                <span style={{ fontSize:11, color: enabled ? 'var(--icon-on)' : 'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
              </div>
            );
          })}
          {actions.length > 2 && <span style={{ fontSize:10, color:'var(--text-dim)' }}>+{actions.length - 2} más</span>}
        </div>
      </div>
      {Modal}
    </>
  );
}
```

- [ ] **Step 2: Verificar en el browser**

```bash
npm run dev
```

Agregar un widget `Regla Auto` al canvas. Verificar:
- Los 3 tamaños muestran nombre + toggle
- El tamaño 2x2 muestra "Sin condiciones" y "Sin acciones"
- Long press abre el modal placeholder "Task 7"
- El toggle activa/desactiva la regla

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/ReglaAutomatica.jsx
git commit -m "feat(rules): widget faces de ReglaAutomatica con nuevo modelo de datos"
```

---

## Task 7: Config modal completo

**Files:**
- Modify: `src/components/widgets/ReglaAutomatica.jsx`

Reemplazar la función `ConfigModal` placeholder con la implementación completa. Este task agrega: nombre, gestión de grupos, picker de condiciones (dispositivo + tiempo), picker de acciones, y guardado.

- [ ] **Step 1: Reemplazar ConfigModal en ReglaAutomatica.jsx**

Reemplazar la función `ConfigModal` (desde `function ConfigModal` hasta su cierre `}`) con:

```jsx
// ── Estilos compartidos del modal ──────────────────────────────
const modalBox = { background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:'2px solid #1e3a5f', borderRadius:'1.14rem', padding:'1.2rem', width:'28rem', maxHeight:'88vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.9rem', boxShadow:'0 0 40px rgba(0,0,0,0.7)' };
const sectionTitle = { fontSize:11, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 };
const inputStyle = { width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 10px', color:'var(--text-primary)', fontSize:13, outline:'none', boxSizing:'border-box' };
const selectStyle = { ...inputStyle, cursor:'pointer' };
const chipBase = { display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', fontSize:12 };
const addBtn = { fontSize:12, color:'var(--text-secondary)', background:'rgba(255,255,255,0.05)', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', width:'100%', textAlign:'center' };
const groupBox = { border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'10px', display:'flex', flexDirection:'column', gap:6 };

function nanoid() { return Math.random().toString(36).slice(2,9); }

// ── Picker de dispositivo ──────────────────────────────────────

function DevicePicker({ hubStore, filterFn, onSelect, onCancel }) {
  const { assignments, devices, hubs } = hubStore;
  const [selectedKey, setSelectedKey] = useState('');

  const assignedList = Object.entries(assignments)
    .filter(([, wt]) => filterFn(wt))
    .map(([key, widgetTypeId]) => {
      const [hubId, deviceId] = key.split(':');
      const hub = hubs.find(h => h.id === hubId);
      const devList = devices[hubId] ?? [];
      const dev = devList.find(d => String(d.deviceId) === String(deviceId));
      return { key, hubId, deviceId, widgetTypeId, label: dev?.label ?? deviceId, hubName: hub?.name ?? hubId };
    });

  if (assignedList.length === 0) {
    return (
      <div style={{ fontSize:12, color:'var(--text-secondary)', padding:8 }}>
        No hay dispositivos asignados compatibles. Asignalos en la pestaña Hubs.
        <br /><button className="w-btn" style={{ marginTop:8 }} onClick={onCancel}>Cancelar</button>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <select style={selectStyle} value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
        <option value="">Seleccionar dispositivo…</option>
        {assignedList.map(d => (
          <option key={d.key} value={d.key}>{WIDGET_ICONS[d.widgetTypeId] || ''} {d.label} ({d.hubName})</option>
        ))}
      </select>
      <div style={{ display:'flex', gap:6 }}>
        <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
        <button className="w-btn" style={{ flex:1 }} disabled={!selectedKey}
          onClick={() => {
            const found = assignedList.find(d => d.key === selectedKey);
            if (found) onSelect(found);
          }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ── Sub-picker de condición ────────────────────────────────────

import { DEVICE_CONDITIONS, TIME_CONDITION } from '../../rules/deviceConditions.js';

function AddConditionFlow({ hubStore, onAdd, onCancel }) {
  const [step, setStep] = useState('type');      // 'type' | 'device-pick' | 'device-detail' | 'time'
  const [condType, setCondType] = useState('');
  const [pickedDev, setPickedDev] = useState(null);
  const [selAttrIdx, setSelAttrIdx] = useState(0);
  const [selOp, setSelOp] = useState('');
  const [selVal, setSelVal] = useState('');
  const [timeOp, setTimeOp] = useState('gte');
  const [timeVal, setTimeVal] = useState('20:00');

  if (step === 'type') return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={sectionTitle}>Tipo de condición</div>
      <div style={{ display:'flex', gap:8 }}>
        {[['device','Dispositivo'],['time','Tiempo']].map(([t,l]) => (
          <button key={t} className="w-btn" style={{ flex:1 }} onClick={() => { setCondType(t); setStep(t === 'device' ? 'device-pick' : 'time'); }}>{l}</button>
        ))}
      </div>
      <button className="w-btn" onClick={onCancel}>Cancelar</button>
    </div>
  );

  if (step === 'device-pick') return (
    <DevicePicker
      hubStore={hubStore}
      filterFn={wt => !!DEVICE_CONDITIONS[wt]}
      onSelect={dev => { setPickedDev(dev); setSelAttrIdx(0); setSelOp(''); setSelVal(''); setStep('device-detail'); }}
      onCancel={onCancel}
    />
  );

  if (step === 'device-detail' && pickedDev) {
    const attrDefs = DEVICE_CONDITIONS[pickedDev.widgetTypeId] ?? [];
    const attrDef = attrDefs[selAttrIdx];
    const ops = attrDef?.operators ?? [];
    const activeOp = selOp || ops[0] || '';
    const isEnum = attrDef?.valueType === 'enum';
    const values = attrDef?.values ?? [];
    const activeVal = selVal || (isEnum ? values[0] : '');
    const canSave = activeOp && activeVal !== '';

    const saveCondition = () => {
      onAdd({
        id: nanoid(), type: 'device',
        hubId: pickedDev.hubId, deviceId: pickedDev.deviceId,
        widgetTypeId: pickedDev.widgetTypeId, deviceLabel: pickedDev.label,
        attribute: attrDef.attribute, operator: activeOp, value: activeVal,
      });
    };

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>
          {WIDGET_ICONS[pickedDev.widgetTypeId]} {pickedDev.label}
        </div>

        {attrDefs.length > 1 && (
          <div>
            <div style={sectionTitle}>Atributo</div>
            <select style={selectStyle} value={selAttrIdx} onChange={e => { setSelAttrIdx(Number(e.target.value)); setSelOp(''); setSelVal(''); }}>
              {attrDefs.map((a, i) => <option key={i} value={i}>{a.attribute}{a.unit ? ` (${a.unit})` : ''}</option>)}
            </select>
          </div>
        )}

        <div>
          <div style={sectionTitle}>Operador</div>
          <div style={{ display:'flex', gap:6 }}>
            {ops.map(op => (
              <button key={op} className="w-btn" style={{ flex:1, fontWeight: activeOp===op ? 700 : 400, background: activeOp===op ? 'rgba(255,255,255,0.18)' : undefined }}
                onClick={() => setSelOp(op)}>{OPERATOR_LABELS[op] || op}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={sectionTitle}>Valor{attrDef?.unit ? ` (${attrDef.unit})` : ''}</div>
          {isEnum ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {values.map(v => (
                <button key={v} className="w-btn" style={{ fontWeight: activeVal===v ? 700 : 400, background: activeVal===v ? 'rgba(255,255,255,0.18)' : undefined }}
                  onClick={() => setSelVal(v)}>{VALUE_LABELS[v] || v}</button>
              ))}
            </div>
          ) : (
            <input style={inputStyle} type="number" placeholder={`ej: 25${attrDef?.unit ? ' '+attrDef.unit : ''}`}
              value={selVal} onChange={e => setSelVal(e.target.value)} />
          )}
        </div>

        <div style={{ display:'flex', gap:6 }}>
          <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
          <button className="w-btn" style={{ flex:1 }} disabled={!canSave} onClick={saveCondition}>Agregar</button>
        </div>
      </div>
    );
  }

  if (step === 'time') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={sectionTitle}>Condición de tiempo</div>
      <div style={{ display:'flex', gap:6 }}>
        {[['eq','A las'],['gte','Después de'],['lte','Antes de']].map(([op,l]) => (
          <button key={op} className="w-btn" style={{ flex:1, fontSize:11, fontWeight: timeOp===op ? 700 : 400, background: timeOp===op ? 'rgba(255,255,255,0.18)' : undefined }}
            onClick={() => setTimeOp(op)}>{l}</button>
        ))}
      </div>
      <input style={inputStyle} type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)} />
      <div style={{ display:'flex', gap:6 }}>
        <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
        <button className="w-btn" style={{ flex:1 }} onClick={() => onAdd({ id: nanoid(), type:'time', operator: timeOp, value: timeVal })}>Agregar</button>
      </div>
    </div>
  );

  return null;
}

// ── Sub-picker de acción ───────────────────────────────────────

import { DEVICE_ACTIONS } from '../../rules/deviceActions.js';

function AddActionFlow({ hubStore, onAdd, onCancel }) {
  const [step, setStep] = useState('device-pick');
  const [pickedDev, setPickedDev] = useState(null);
  const [selCmd, setSelCmd] = useState('');
  const [selArg, setSelArg] = useState(50);

  if (step === 'device-pick') return (
    <DevicePicker
      hubStore={hubStore}
      filterFn={wt => !!DEVICE_ACTIONS[wt]}
      onSelect={dev => { setPickedDev(dev); setSelCmd(DEVICE_ACTIONS[dev.widgetTypeId]?.[0]?.command || ''); setStep('cmd'); }}
      onCancel={onCancel}
    />
  );

  if (step === 'cmd' && pickedDev) {
    const cmds = DEVICE_ACTIONS[pickedDev.widgetTypeId] ?? [];
    const cmdDef = cmds.find(c => c.command === selCmd) ?? cmds[0];
    const hasArg = cmdDef?.argType === 'level';

    const saveAction = () => {
      onAdd({
        id: nanoid(),
        hubId: pickedDev.hubId, deviceId: pickedDev.deviceId,
        widgetTypeId: pickedDev.widgetTypeId, deviceLabel: pickedDev.label,
        command: selCmd, arg: hasArg ? Number(selArg) : null,
      });
    };

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>
          {WIDGET_ICONS[pickedDev.widgetTypeId]} {pickedDev.label}
        </div>
        <div>
          <div style={sectionTitle}>Comando</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {cmds.map(c => (
              <button key={c.command} className="w-btn" style={{ fontWeight: selCmd===c.command ? 700 : 400, background: selCmd===c.command ? 'rgba(255,255,255,0.18)' : undefined }}
                onClick={() => setSelCmd(c.command)}>{c.label}</button>
            ))}
          </div>
        </div>
        {hasArg && (
          <div>
            <div style={sectionTitle}>Valor: {selArg}%</div>
            <input type="range" min={0} max={100} value={selArg} onChange={e => setSelArg(e.target.value)}
              style={{ width:'100%', accentColor:'var(--icon-on)' }} />
          </div>
        )}
        <div style={{ display:'flex', gap:6 }}>
          <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
          <button className="w-btn" style={{ flex:1 }} onClick={saveAction}>Agregar</button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Modal principal ────────────────────────────────────────────

function ConfigModal({ config, onSave, onClose }) {
  const hubStore = useHub();
  const [localName, setLocalName] = useState(config.name ?? 'Mi regla');
  const [groups, setGroups] = useState(config.conditionGroups ?? []);
  const [actions, setActions] = useState(config.actions ?? []);
  const [addingCondTo, setAddingCondTo] = useState(null); // groupId | null
  const [addingAction, setAddingAction] = useState(false);
  const stop = e => e.stopPropagation();

  const addGroup = () => setGroups(prev => [...prev, { id: nanoid(), operator: 'OR', conditions: [] }]);
  const deleteGroup = id => setGroups(prev => prev.filter(g => g.id !== id));
  const toggleOp = id => setGroups(prev => prev.map(g => g.id === id ? { ...g, operator: g.operator === 'AND' ? 'OR' : 'AND' } : g));
  const deleteCond = (groupId, condId) => setGroups(prev => prev.map(g => g.id === groupId ? { ...g, conditions: g.conditions.filter(c => c.id !== condId) } : g));
  const addCondToGroup = (groupId, cond) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, conditions: [...g.conditions, cond] } : g));
    setAddingCondTo(null);
  };
  const deleteAction = id => setActions(prev => prev.filter(a => a.id !== id));
  const addAction = action => { setActions(prev => [...prev, action]); setAddingAction(false); };

  const save = () => onSave({ ...config, name: localName, conditionGroups: groups, actions });

  const isAddingCond = addingCondTo !== null;
  const isAddingAct = addingAction;

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}>
      <div style={modalBox} onMouseDown={stop} onClick={stop}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:'0.92rem' }}>⚙ Configurar regla</span>
          <button className="w-btn" style={{ padding:'2px 8px', fontSize:11 }} onClick={onClose}>✕</button>
        </div>

        {/* Nombre */}
        <div>
          <div style={sectionTitle}>Nombre</div>
          <input style={inputStyle} value={localName} onChange={e => setLocalName(e.target.value)} onMouseDown={stop} onClick={stop} />
        </div>

        {/* Condiciones */}
        <div>
          <div style={sectionTitle}>CONDICIONES (SI…)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {groups.map((group, gi) => (
              <div key={group.id}>
                {gi > 0 && <div style={{ textAlign:'center', fontSize:11, color:'var(--text-dim)', margin:'2px 0' }}>AND</div>}
                <div style={groupBox}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'var(--text-secondary)' }}>Grupo</span>
                      <button className="w-btn" style={{ fontSize:11, padding:'2px 8px', fontWeight:700 }} onClick={() => toggleOp(group.id)}>{group.operator}</button>
                    </div>
                    <button className="w-btn" style={{ padding:'2px 6px', fontSize:10 }} onClick={() => deleteGroup(group.id)}>× grupo</button>
                  </div>

                  {group.conditions.map(c => {
                    const { icon, text } = conditionLabel(c);
                    return (
                      <div key={c.id} style={{ ...chipBase, justifyContent:'space-between' }}>
                        <span>{icon} {text}</span>
                        <button onClick={() => deleteCond(group.id, c.id)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>×</button>
                      </div>
                    );
                  })}

                  {addingCondTo === group.id ? (
                    <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
                      <AddConditionFlow
                        hubStore={hubStore}
                        onAdd={cond => addCondToGroup(group.id, cond)}
                        onCancel={() => setAddingCondTo(null)}
                      />
                    </div>
                  ) : (
                    !isAddingAct && <button style={addBtn} onClick={() => setAddingCondTo(group.id)}>+ condición</button>
                  )}
                </div>
              </div>
            ))}

            {!isAddingCond && !isAddingAct && (
              <button style={addBtn} onClick={addGroup}>+ agregar grupo</button>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div>
          <div style={sectionTitle}>ACCIONES (ENTONCES…)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {actions.map(a => {
              const { icon, text } = actionLabel(a);
              return (
                <div key={a.id} style={{ ...chipBase, justifyContent:'space-between' }}>
                  <span>{icon} {text}</span>
                  <button onClick={() => deleteAction(a.id)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>×</button>
                </div>
              );
            })}

            {addingAction ? (
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
                <AddActionFlow
                  hubStore={hubStore}
                  onAdd={addAction}
                  onCancel={() => setAddingAction(false)}
                />
              </div>
            ) : (
              !isAddingCond && <button style={addBtn} onClick={() => setAddingAction(true)}>+ agregar acción</button>
            )}
          </div>
        </div>

        <button className="w-btn" style={{ width:'100%' }} onMouseDown={stop} onClick={save}>Guardar</button>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Limpiar imports al top del archivo**

El archivo ya tiene desde Task 6 estos imports:
```jsx
import { OPERATOR_LABELS, VALUE_LABELS } from '../../rules/deviceConditions.js';
import { WIDGET_ICONS } from '../../rules/deviceActions.js';
```

Reemplazarlos por (agregan `DEVICE_CONDITIONS` y `DEVICE_ACTIONS`):
```jsx
import { DEVICE_CONDITIONS, OPERATOR_LABELS, VALUE_LABELS } from '../../rules/deviceConditions.js';
import { DEVICE_ACTIONS, WIDGET_ICONS } from '../../rules/deviceActions.js';
```

Verificar que NO quedan líneas `import` dentro del cuerpo de funciones `AddConditionFlow` ni `AddActionFlow`.

- [ ] **Step 3: Verificar en el browser**

```bash
npm run dev
```

Flujo a testear:
1. Long press en widget Regla Auto → modal se abre
2. Cambiar nombre → se refleja al guardar
3. "+ agregar grupo" → aparece un grupo vacío con botón toggle AND/OR
4. "+ condición" → muestra picker de tipo
5. Elegir "Dispositivo" → muestra lista de dispositivos asignados en Hubs
6. Seleccionar un dispositivo → muestra atributo, operador, valor
7. "Agregar" → condición aparece en el grupo como chip con ×
8. Toggle AND/OR en el grupo → cambia entre AND y OR
9. "+ agregar acción" → muestra picker de dispositivos de acción
10. Seleccionar dispositivo → seleccionar comando → "Agregar" → aparece en lista
11. "Guardar" → modal cierra, widget 2x2 muestra las condiciones y acciones

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/ReglaAutomatica.jsx
git commit -m "feat(rules): modal de configuración completo con grupos, condiciones y acciones"
```

---

## Task 8: Verificar ejecución end-to-end

**Files:** ninguno nuevo — verificación de flujo completo

- [ ] **Step 1: Crear una regla de prueba con simulación**

Con la app corriendo:
1. Asignar en la pestaña Hubs un dispositivo "puerta" a un sensor real del hub
2. Crear un widget `Regla Auto`
3. Configurar: Grupo 1 (OR) con `puerta = abierta`; Acción: alguna lampara → encender
4. Abrir la consola del browser (F12)
5. Abrir/cerrar la puerta física → verificar que en la consola aparece el comando enviado al hub (log de `[Hub] Command failed` si hay error, o que el dispositivo reacciona)

- [ ] **Step 2: Verificar edge-triggered**

Mantener la puerta abierta. Verificar que el comando NO se ejecuta repetidamente — solo se ejecuta una vez al cambiar de cerrada → abierta.

- [ ] **Step 3: Verificar regla de tiempo**

Configurar una regla con condición `hora = HH:MM` con la hora actual + 1 minuto. Esperar que pase el minuto. Verificar que la acción se ejecuta.

- [ ] **Step 4: Verificar grupos múltiples**

Configurar: Grupo 1 (OR): `puerta1=abierta` O `puerta2=abierta`; Grupo 2: `hora >= 20:00`. Probar los 3 casos del spec (solo una puerta abierta + hora ok → dispara; hora no ok → no dispara).

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat(rules): motor de reglas browser-based completo y verificado"
```
