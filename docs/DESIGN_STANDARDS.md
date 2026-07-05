# Widget Design Standards

Documento que especifica cómo deben verse y comportarse todos los widgets en diferentes tamaños.

## Principios Base

1. **Escalado Responsive**: Todos los tamaños escalan mediante `root font-size` (14px desktop, 12px tablet, 10px mobile)
2. **Consistencia Visual**: Todos los widgets siguen la misma estructura y jerarquía tipográfica
3. **Touch Targets**: Área mínima de 2.14rem (30px desktop) para interacción
4. **Accessibilidad**: Contraste de color WCAG AA mínimo

## Escala Tipográfica

| Clase CSS | Desktop | Tablet | Mobile | Uso |
|-----------|---------|--------|--------|-----|
| `.w-text-xs` | 8px | 7px | 5px | Etiquetas, subtítulos muy pequeños |
| `.w-text-sm` | 9px | 7px | 6px | Labels secundarios |
| `.w-text-base` | 14px | 12px | 10px | Texto cuerpo, nombres |
| `.w-text-lg` | 16px | 13px | 11px | Subtítulos |
| `.w-text-xl` | 18px | 15px | 12px | Títulos pequeños |
| `.w-text-2xl` | 22px | 18px | 14px | Valores principales (temperatura, porcentaje) |
| `.w-text-3xl` | 32px | 26px | 20px | Valores muy grandes |
| `.w-text-4xl` | 44px | 37px | 30px | Valores masivos |

## Escala de Iconos

| Clase CSS | Desktop | Tablet | Mobile | Uso |
|-----------|---------|--------|--------|-----|
| `.w-icon-xs` | 10px | 8px | 6px | Iconos mínimos |
| `.w-icon-sm` | 14px | 12px | 10px | Iconos normales |
| `.w-icon-md` | 22px | 18px | 14px | Iconos medianos |
| `.w-icon-lg` | 28px | 24px | 20px | Iconos grandes |
| `.w-icon-xl` | 32px | 26px | 20px | Iconos muy grandes |
| `.w-icon-2xl` | 44px | 37px | 30px | Iconos masivos |
| `.w-icon-3xl` | 56px | 47px | 38px | Iconos gigantes |

## Estructura de Widget por Tamaño

### Tamaño 1x1 (80x80px)
**Propósito**: Estado rápido, display compacto
- Icono centrado: `.w-icon-2xl` (44px)
- Leyenda debajo (opcional): `.w-text-sm`
- Padding: `0.71rem` (10px)
- Layout: `flex-direction: column`, `align-items: center`, `justify-content: center`

**Ejemplo**:
```
┌────────────────┐
│      💡        │ ← Icono 44px
│     80%        │ ← Valor pequeño
└────────────────┘
```

### Tamaño 1x2 (80x160px)
**Propósito**: Valor principal con etiqueta
- Nombre/etiqueta: `.w-name` (14px)
- Icono o valor grande: `.w-icon-2xl` o `.w-text-3xl` (44px / 32px)
- Subtítulo (estado): `.w-status` (10px)
- Padding: `0.71rem`
- Layout: vertical centrado

**Ejemplo**:
```
┌────────────────┐
│   Lámpara      │ ← nombre
│      💡        │ ← icono 44px
│   Encendida    │ ← status
└────────────────┘
```

### Tamaño 2x1 (160x80px)
**Propósito**: Valor con icono y control horizontal
- Icono pequeño: `.w-icon-lg` (28px)
- Nombre + valor: `.w-name` + `.w-text-lg` (14px + 16px)
- Toggle/control derecha
- Padding: `0.71rem`
- Layout: `flex-direction: row`, space-between

**Ejemplo**:
```
┌─────────────────────────────┐
│  💡  Lámpara      [Toggle]   │
│      80%                     │
└─────────────────────────────┘
```

### Tamaño 2x2 (160x160px)
**Propósito**: Múltiples valores o controles
- Nombre/título: `.w-name` (14px)
- Valores principales: `.w-text-2xl` o `.w-text-3xl` (22px / 32px)
- Iconos: `.w-icon-xl` (32px)
- Subtítulos: `.w-text-sm` (9px)
- Padding: `0.71rem`
- Layout: cuadrícula o secciones

**Ejemplo**:
```
┌─────────────────────────────┐
│      Exterior               │ ← nombre
│  🌡  23°C    💧  72%        │ ← valores grandes
│  ─────────────────────      │
│  🌬  12km/h  ⬇  1013hPa    │ ← valores secundarios
└─────────────────────────────┘
```

## Colores

| Variable | Uso |
|----------|-----|
| `var(--text-primary)` | Texto principal |
| `var(--text-secondary)` | Texto secundario |
| `var(--text-dim)` | Texto deshabilitado, muy secundario |
| `var(--icon-on)` | Iconos cuando están activos |
| `var(--icon-off)` | Iconos cuando están inactivos |
| `--success` (#22c55e) | Estados positivos |
| `--danger` (#ef4444) | Estados críticos |
| `--warning` (#f59e0b) | Advertencias |

## Espaciado

| Clase | Valor | Desktop | Tablet | Mobile |
|-------|-------|---------|--------|--------|
| `.gap-1` | 0.28rem | 4px | 3px | 2px |
| `.gap-2` | 0.42rem | 6px | 5px | 4px |
| `.gap-3` | 0.57rem | 8px | 6px | 4px |
| `.gap-4` | 0.71rem | 10px | 8px | 6px |

## Restricciones

1. **SIN inline styles para tamaños**: Usar clases `.w-text-*` en lugar de `style={{ fontSize: 14 }}`
2. **SIN hardcoded números**: Usar variables CSS en lugar de `#ffffff`
3. **SIN estilos duplicados**: Si aparece en 2+ widgets, va a `.widget.css`
4. **Emojis**: Usar clase `.w-emoji-*` para tamaño consistente

## Cómo Migrar un Widget Existente

1. Reemplazar inline `fontSize` con `.w-text-*` o `.w-icon-*`
2. Reemplazar colores hardcodeados con variables CSS
3. Reemplazar números de padding/gap con valores REM
4. Probar en móvil, tablet, desktop
5. Verificar accesibilidad: contraste, touch targets

## Ejemplos de Migración

### ANTES (❌ Evitar)
```jsx
<div style={{ fontSize: 44, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
  {temp}°C
</div>
```

### DESPUÉS (✅ Correcto)
```jsx
<div className="w-text-4xl" style={{ marginBottom: '0.57rem' }}>
  {temp}°C
</div>
```

O mejor aún, usar clases para el margin:
```jsx
<div className="w-text-4xl" style={{ marginBottom: '0.57rem' }}>
  {temp}°C
</div>
```
