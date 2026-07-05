# TV Widget — Asociación con dispositivo Hubitat

**Fecha:** 2026-07-03  
**Estado:** Aprobado

## Resumen

El widget TV actualmente funciona en modo simulación puro (sin enviar comandos reales). El objetivo es conectarlo al driver **LGTV with webOS** de Hubitat, habilitando control completo: encendido/apagado, volumen, navegación, apps, fuentes, y modo imagen.

---

## Alcance

- Solo Hubitat (no Home Assistant)
- Driver: LGTV with webOS (compatible también con Samsung que expone los mismos comandos)
- Modo simulación se mantiene cuando no hay `deviceId` asociado

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/services/hubMappings.js` | Agregar `tv` a capabilities + HUB_LOCKABLE |
| `src/components/widgets/TV.jsx` | Wiring de comandos + sección Imagen |
| `src/components/Hubs/HubDeviceSync.jsx` | Sync de atributos de TV |
| `src/catalog/widgetCatalog.jsx` | Agregar `pictureMode` a `defaultConfig` |

---

## Mapa de comandos

| Acción en UI | Comando Hubitat | Argumento |
|---|---|---|
| Toggle on/off | `on` / `off` | — |
| D-pad ▲ | `sendKey` | `UP` |
| D-pad ▼ | `sendKey` | `DOWN` |
| D-pad ◀ | `sendKey` | `LEFT` |
| D-pad ▶ | `sendKey` | `RIGHT` |
| OK | `sendKey` | `ENTER` |
| 🏠 Home | `sendKey` | `HOME` |
| ↩ Back | `sendKey` | `BACK` |
| ☰ Menu | `sendKey` | `MENU` |
| Vol + | `volumeUp` | — |
| Vol − | `volumeDown` | — |
| Mute (activar) | `mute` | — |
| Mute (desactivar) | `unmute` | — |
| Canal + | `channelUp` | — |
| Canal − | `channelDown` | — |
| Netflix | `launchApp` | `netflix` |
| YouTube | `launchApp` | `youtube` |
| Spotify | `launchApp` | `spotify` |
| Disney+ | `launchApp` | `disney` |
| Fuente HDMI 1 | `setInputSource` | `HDMI_1` |
| Fuente HDMI 2 | `setInputSource` | `HDMI_2` |
| Fuente TV | `setInputSource` | `dtv` |
| Imagen Vivid | `setPictureMode` | `vivid` |
| Imagen Standard | `setPictureMode` | `standard` |
| Imagen Cinema | `setPictureMode` | `cinema` |
| Imagen Sports | `setPictureMode` | `sports` |
| Imagen Game | `setPictureMode` | `game` |

---

## Cambios en hubMappings.js

```js
// HUBITAT_CAP_TO_WIDGETS
Switch:       [...existente, 'tv'],
AudioVolume:  ['tv'],

// HUB_LOCKABLE_WIDGET_TYPES
'tv',
```

---

## Sync inverso (HubDeviceSync.jsx)

Atributos que el driver LG puede reportar y cómo se mapean al config del widget:

| Atributo Hubitat | Campo config | Transformación |
|---|---|---|
| `switch` = `'on'`/`'off'` | `on` | Ya manejado |
| `volume` | `volume` | `Number(live.volume)` |
| `muted` = `'muted'` | `volume` | Setear a `0` |
| `muted` = `'unmuted'` | — | No modificar (mantener volumen previo) |
| `channel` | `channel` | `Number(live.channel)` |

---

## UI — Sección "Imagen"

Nueva sección al final del `TVModal`, siempre visible:

```
IMAGEN
[ Vivid ] [ Standard ] [ Cinema ] [ Sports ] [ Game ]
```

- Botones en fila horizontal, mismo estilo que la sección "Fuente"
- Modo activo resaltado con `accentColor`
- Estado guardado en `config.pictureMode` (default: `'standard'`)
- Si `setPictureMode` no está disponible en el dispositivo, el comando falla silenciosamente

---

## defaultConfig actualizado

```js
{ on: false, source: 'HDMI 1', volume: 30, name: 'TV', pictureMode: 'standard' }
```

---

## Modo simulación

Cuando el widget no tiene `deviceId`, todos los botones siguen actualizando el estado local (`config`) sin enviar comandos al hub. Igual al comportamiento de `Puerta.jsx`.

---

## Fuera de alcance

- Home Assistant
- Agregar nuevas apps más allá de las 4 existentes
- Teclado numérico para canales directos
- Control de brillo/contraste individual
