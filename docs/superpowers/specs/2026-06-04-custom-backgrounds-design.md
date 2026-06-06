# Fondos personalizados en ThemePicker

**Fecha:** 2026-06-04
**Estado:** Aprobado

## Objetivo

Permitir al usuario subir hasta 3 imágenes propias como fondos de pantalla del dashboard, integradas en la sección AMBIENTE del ThemePicker junto a los ambientes predefinidos.

## Arquitectura

### Nuevo módulo: `src/store/imageDB.js`

Wrapper de IndexedDB con las siguientes operaciones:

- `openDB()` — abre la base de datos `widgets-images` v1, con object store `backgrounds` (keyPath: `id`)
- `saveImage(id, blob)` — guarda un registro `{ id, blob }` en el store
- `loadImage(id)` → `string` — recupera el blob y devuelve un object URL (`URL.createObjectURL`)
- `deleteImage(id)` — elimina el registro por id

Base de datos: nombre `widgets-images`, versión 1, un único store `backgrounds`.

### Cambios en `dashboardStore`

El objeto `theme` se extiende con:

```js
customBackgrounds: []  // array de { id: string, label: string }, máx 3
```

Nuevas acciones del reducer:

- `ADD_CUSTOM_BG` — recibe `{ id, label }`, lo añade a `theme.customBackgrounds` (máx 3, ignorar si ya hay 3)
- `REMOVE_CUSTOM_BG` — recibe `{ id }`, filtra el array

El campo `theme.room` acepta IDs con prefijo `custom-` para referenciar fondos personalizados (ejemplo: `"custom-1717000000000"`).

`loadState` hidrata `customBackgrounds` desde localStorage (ya persistido dentro de `theme`).

### Cambios en `ThemeApplier`

Cuando `theme.room` empieza con `"custom-"`:

1. Llama a `loadImage(theme.room)` (async, efecto de `useEffect`)
2. Aplica el object URL resultante como variable CSS inline: `document.documentElement.style.setProperty('--bg-photo', 'url(...)')`
3. Al limpiar el efecto (o al cambiar de room), revoca la URL con `URL.revokeObjectURL` y elimina la variable inline (para que el CSS estático vuelva a tomar control)

Cuando `theme.room` no empieza con `"custom-"`, el comportamiento es idéntico al actual (data-room en el root).

### Cambios en `ThemePicker`

**Sección AMBIENTE** — la rejilla pasa de 4 botones fijos a N+1 botones dinámicos:

```
[🛋️ Sala] [🛏️ Dorm.] [🍳 Cocina] [🌿 Jardín]
[thumb1 ✕] [thumb2 ✕] [thumb3 ✕]  ← solo si hay personalizados
[+ Añadir]                          ← oculto si hay 3
```

**Flujo de subida:**

1. Clic en "+" → dispara un `<input type="file" accept="image/*">` oculto
2. El archivo seleccionado se pasa a una función `resizeImage(file)` que:
   - Dibuja la imagen en un `<canvas>` redimensionado a 1200px de ancho máximo (manteniendo proporción)
   - Exporta como blob JPEG con calidad 0.85
3. Se genera un id: `` `custom-${Date.now()}` ``
4. Se llama a `saveImage(id, blob)` (IndexedDB)
5. Se hace dispatch de `ADD_CUSTOM_BG({ id, label: file.name })`
6. Se hace dispatch de `SET_THEME({ room: id })` para seleccionarlo inmediatamente

**Miniaturas personalizadas:**

- Cada chip personalizado carga su imagen con `loadImage(id)` en un `useEffect` local al montar
- Muestra la imagen como `background-image` del botón (mismo tamaño que los chips predefinidos)
- Tiene un botón ✕ en la esquina superior derecha
- Clic en ✕: llama a `deleteImage(id)` + dispatch `REMOVE_CUSTOM_BG({ id })` + si era el room activo, cambia a `'sala'`
- Clic en el chip (fuera de ✕): dispatch `SET_THEME({ room: id })`

## Restricciones

- Máximo 3 fondos personalizados. El botón "+ Añadir" se oculta cuando hay 3.
- Imágenes redimensionadas a máximo 1200px de ancho, JPEG calidad 0.85 (~100-300KB por imagen).
- El label almacenado es el nombre del archivo original (solo para referencia interna, no se muestra en la UI).

## Flujo de datos

```
Usuario sube archivo
  → resizeImage() → blob JPEG
  → saveImage(id, blob) [IndexedDB]
  → dispatch ADD_CUSTOM_BG({ id, label }) [localStorage vía theme]
  → dispatch SET_THEME({ room: id })
  → ThemeApplier detecta prefijo "custom-"
  → loadImage(id) → object URL
  → --bg-photo = url(blob:...)
```

## Archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `src/store/imageDB.js` | Crear |
| `src/store/dashboardStore.jsx` | Modificar (estado, reducer, persist) |
| `src/components/ThemeApplier.jsx` | Modificar (soporte custom rooms) |
| `src/components/Canvas/ThemePicker.jsx` | Modificar (chips + upload) |
| `src/components/Canvas/ThemePicker.module.css` | Modificar (estilos chips personalizados + botón +) |
