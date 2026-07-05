import LamparaSimple      from '../components/widgets/LamparaSimple';
import LamparaDimmer      from '../components/widgets/LamparaDimmer';
import LamparaRGB         from '../components/widgets/LamparaRGB';
import LamparaCCT         from '../components/widgets/LamparaCCT';
import TiraLED            from '../components/widgets/TiraLED';
import TiraLEDBlanca      from '../components/widgets/TiraLEDBlanca';
import AireAcondicionado  from '../components/widgets/AireAcondicionado';
import Termostato         from '../components/widgets/Termostato';
import Ventilador         from '../components/widgets/Ventilador';
import Calefactor         from '../components/widgets/Calefactor';
import Humidificador      from '../components/widgets/Humidificador';
import PurificadorAire    from '../components/widgets/PurificadorAire';
import Puerta              from '../components/widgets/Puerta';
import Ventana             from '../components/widgets/Ventana';
import CerraduraInteligente from '../components/widgets/CerraduraInteligente';
import CamaraIP            from '../components/widgets/CamaraIP';
import SensorMovimiento    from '../components/widgets/SensorMovimiento';
import SensorPresencia     from '../components/widgets/SensorPresencia';
import AlarmV2            from '../components/widgets/AlarmV2';
import PersianaRoller      from '../components/widgets/PersianaRoller';
import Cortina             from '../components/widgets/Cortina';
import Toldo               from '../components/widgets/Toldo';
import Veneciana           from '../components/widgets/Veneciana';
import SensorTempHumedad   from '../components/widgets/SensorTempHumedad';
import SensorCalidadAire   from '../components/widgets/SensorCalidadAire';
import SensorHumoGas       from '../components/widgets/SensorHumoGas';
import SensorInundacion    from '../components/widgets/SensorInundacion';
import SensorLuminosidad   from '../components/widgets/SensorLuminosidad';
import EstacionMeteorologica from '../components/widgets/EstacionMeteorologica';
import Enchufe             from '../components/widgets/Enchufe';
import MedidorConsumo      from '../components/widgets/MedidorConsumo';
import PanelSolar          from '../components/widgets/PanelSolar';
import Bateria             from '../components/widgets/Bateria';
import TV                  from '../components/widgets/TV';
import Musica              from '../components/widgets/Musica';
import AltavozInteligente  from '../components/widgets/AltavozInteligente';
import EscenaIndividual    from '../components/widgets/EscenaIndividual';
import Temporizador        from '../components/widgets/Temporizador';
import ReglaAutomatica     from '../components/widgets/ReglaAutomatica';
import EstadoHogar         from '../components/widgets/EstadoHogar';
import GrupoWidget        from '../components/widgets/GrupoWidget';
import NavegadorDashboard from '../components/widgets/NavegadorDashboard';
import Notas            from '../components/widgets/Notas';
import CalendarioDia     from '../components/widgets/CalendarioDia';

export const WIDGET_CATALOG = [
  // ── ILUMINACIÓN ──
  { id: 'lampara-simple',  category: 'Iluminación', categoryIcon: '◎', icon: '💡', name: 'Lámpara Simple',   sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'Lámpara' },           component: LamparaSimple },
  { id: 'lampara-dimmer',  category: 'Iluminación', categoryIcon: '◎', icon: '🔆', name: 'Lámpara Dimmer',  sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'Lámpara', brightness: 75 }, component: LamparaDimmer },
  { id: 'lampara-rgb',     category: 'Iluminación', categoryIcon: '◎', icon: '🎨', name: 'Lámpara RGB',     sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'RGB', color: '#3b82f6', brightness: 75 }, component: LamparaRGB },
  { id: 'lampara-cct',     category: 'Iluminación', categoryIcon: '◎', icon: '💫', name: 'Lámpara CCT',     sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'CCT', colorTemp: 50 }, component: LamparaCCT },
  { id: 'tira-led-rgb',    category: 'Iluminación', categoryIcon: '◎', icon: '✨', name: 'Tira LED RGB',    sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'LED RGB', color: '#7c3aed', brightness: 80 }, component: TiraLED },
  { id: 'tira-led',        category: 'Iluminación', categoryIcon: '◎', icon: '✨', name: 'Tira LED',        sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'Tira LED', brightness: 80 }, component: TiraLEDBlanca },
  // ── CLIMA ──
  { id: 'aire-acondicionado', category: 'Clima', categoryIcon: '≈', icon: '❄',  name: 'Aire Acondicionado', sizes: ['1x1','1x2','2x1','2x2'], defaultConfig: { on: false, name: 'AC', temp: 24, mode: 'frío' }, component: AireAcondicionado },
  { id: 'termostato',      category: 'Clima', categoryIcon: '≈', icon: '🌡', name: 'Termostato',         sizes: ['1x2','2x1','2x2'],             defaultConfig: { name: 'Termostato', target: 22, current: 21 }, component: Termostato },
  { id: 'ventilador',      category: 'Clima', categoryIcon: '≈', icon: '🌀', name: 'Ventilador',         sizes: ['1x1','1x2','2x1'],             defaultConfig: { on: false, name: 'Ventilador', speed: 2 }, component: Ventilador },
  { id: 'calefactor',      category: 'Clima', categoryIcon: '≈', icon: '🔥', name: 'Calefactor',         sizes: ['1x1','1x2','2x1'],             defaultConfig: { on: false, name: 'Calefactor', temp: 20 }, component: Calefactor },
  { id: 'humidificador',   category: 'Clima', categoryIcon: '≈', icon: '💧', name: 'Humidificador',      sizes: ['1x1','1x2','2x1'],             defaultConfig: { on: false, name: 'Humidificador', humidity: 50 }, component: Humidificador },
  { id: 'purificador',     category: 'Clima', categoryIcon: '≈', icon: '🌬', name: 'Purificador Aire',   sizes: ['1x1','1x2','2x1','2x2'],       defaultConfig: { on: false, name: 'Purificador', aqi: 25 }, component: PurificadorAire },
  // ── SEGURIDAD ──
  { id: 'puerta',          category: 'Seguridad', categoryIcon: '◆', icon: '🚪', name: 'Puerta',            sizes: ['1x1','1x2','2x1','2x2'], defaultConfig: { open: false, locked: true, name: 'Puerta' }, component: Puerta },
  { id: 'ventana',         category: 'Seguridad', categoryIcon: '◆', icon: '🪟', name: 'Ventana',           sizes: ['1x1','1x2','2x1'],       defaultConfig: { open: false, name: 'Ventana' }, component: Ventana },
  { id: 'cerradura',       category: 'Seguridad', categoryIcon: '◆', icon: '🔒', name: 'Cerradura',         sizes: ['1x1','1x2','2x1'],       defaultConfig: { locked: true, name: 'Cerradura' }, component: CerraduraInteligente },
  { id: 'camara-ip',       category: 'Seguridad', categoryIcon: '◆', icon: '📹', name: 'Cámara IP',         sizes: ['2x2','4x4'],             defaultConfig: { recording: true, name: 'Cámara' }, component: CamaraIP },
  { id: 'sensor-movimiento', category: 'Seguridad', categoryIcon: '◆', icon: '👁', name: 'Sensor Movimiento', sizes: ['1x1','1x2','2x1'],    defaultConfig: { detected: false, name: 'Movimiento' }, component: SensorMovimiento },
  { id: 'sensor-presencia', category: 'Seguridad', categoryIcon: '◆', icon: '🧑', name: 'Sensor Presencia',  sizes: ['1x1','1x2','2x1'],    defaultConfig: { present: false, name: 'Presencia' }, component: SensorPresencia },
  { id: 'alarma',          category: 'Seguridad', categoryIcon: '◆', icon: '🚨', name: 'Alarma',            sizes: ['1x1','2x2'],             defaultConfig: { pin: '1234', exitDelay: 60, entryDelay: 30, name: 'Sistema de Alarma' }, component: AlarmV2 },
  // ── PERSIANAS ──
  { id: 'persiana-roller', category: 'Persianas', categoryIcon: '▬', icon: '📋', name: 'Persiana Roller',  sizes: ['1x2','2x1','2x2'], defaultConfig: { position: 60, name: 'Persiana' }, component: PersianaRoller },
  { id: 'cortina',         category: 'Persianas', categoryIcon: '▬', icon: '🎭', name: 'Cortina',          sizes: ['1x2','2x1','2x2'], defaultConfig: { position: 80, name: 'Cortina' }, component: Cortina },
  { id: 'toldo',           category: 'Persianas', categoryIcon: '▬', icon: '⛺', name: 'Toldo',            sizes: ['1x2','2x1','2x2'], defaultConfig: { position: 40, name: 'Toldo' }, component: Toldo },
  { id: 'veneciana',       category: 'Persianas', categoryIcon: '▬', icon: '🪞', name: 'Veneciana',        sizes: ['1x2','2x1','2x2'], defaultConfig: { position: 50, angle: 45, name: 'Veneciana' }, component: Veneciana },
  // ── SENSORES ──
  { id: 'sensor-temp',     category: 'Sensores', categoryIcon: '◇', icon: '🌡', name: 'Temp/Humedad',     sizes: ['1x1','1x2','2x1','2x2'], defaultConfig: { temp: 22, humidity: 65, name: 'Sensor' }, component: SensorTempHumedad },
  { id: 'sensor-aire',     category: 'Sensores', categoryIcon: '◇', icon: '💨', name: 'Calidad Aire',     sizes: ['1x2','2x1','2x2'],       defaultConfig: { aqi: 42, co2: 480, name: 'Aire' }, component: SensorCalidadAire },
  { id: 'sensor-humo',     category: 'Sensores', categoryIcon: '◇', icon: '🔥', name: 'Humo/Gas',         sizes: ['1x1','1x2','2x1'],       defaultConfig: { alert: false, name: 'Humo' }, component: SensorHumoGas },
  { id: 'sensor-inundacion', category: 'Sensores', categoryIcon: '◇', icon: '💧', name: 'Inundación',     sizes: ['1x1','1x2','2x1'],       defaultConfig: { alert: false, name: 'Agua' }, component: SensorInundacion },
  { id: 'sensor-luz',      category: 'Sensores', categoryIcon: '◇', icon: '☀', name: 'Luminosidad',      sizes: ['1x1','1x2','2x1'],       defaultConfig: { lux: 320, name: 'Luz' }, component: SensorLuminosidad },
  { id: 'estacion-meteo',  category: 'Sensores', categoryIcon: '◇', icon: '⛅', name: 'Estación Meteo',  sizes: ['2x2','2x4'],             defaultConfig: { temp: 18, humidity: 72, pressure: 1013, wind: 12, name: 'Exterior' }, component: EstacionMeteorologica },
  // ── ENERGÍA ──
  { id: 'enchufe',         category: 'Energía', categoryIcon: '⚡', icon: '🔌', name: 'Enchufe',          sizes: ['1x1','1x2','2x1','2x2'], defaultConfig: { on: false, watts: 85, name: 'Enchufe' }, component: Enchufe },
  { id: 'medidor-consumo', category: 'Energía', categoryIcon: '⚡', icon: '📊', name: 'Medidor Consumo',  sizes: ['2x2','2x4'],             defaultConfig: { kwh: 12.4, name: 'Consumo' }, component: MedidorConsumo },
  { id: 'panel-solar',     category: 'Energía', categoryIcon: '⚡', icon: '☀', name: 'Panel Solar',       sizes: ['2x2','2x4'],             defaultConfig: { kw: 2.8, name: 'Solar' }, component: PanelSolar },
  { id: 'bateria',         category: 'Energía', categoryIcon: '⚡', icon: '🔋', name: 'Batería',          sizes: ['1x2','2x1','2x2'],       defaultConfig: { percent: 78, charging: true, name: 'Batería' }, component: Bateria },
  // ── MULTIMEDIA ──
  { id: 'tv',              category: 'Multimedia', categoryIcon: '▶', icon: '📺', name: 'TV',              sizes: ['1x2','2x1','2x2','2x4'], defaultConfig: { on: false, source: 'HDMI 1', volume: 30, name: 'TV', pictureMode: 'standard' }, component: TV },
  { id: 'musica',          category: 'Multimedia', categoryIcon: '▶', icon: '🎵', name: 'Música',          sizes: ['1x2','2x1','2x2'],       defaultConfig: { playing: false, track: 'Blinding Lights', artist: 'The Weeknd', volume: 65, name: 'Música' }, component: Musica },
  { id: 'altavoz',         category: 'Multimedia', categoryIcon: '▶', icon: '🔊', name: 'Altavoz',         sizes: ['1x1','1x2','2x1'],       defaultConfig: { on: false, volume: 50, name: 'Altavoz' }, component: AltavozInteligente },
  // ── ESCENAS ──
  { id: 'escena-individual', category: 'Escenas', categoryIcon: '●', icon: '🎬', name: 'Escena',          sizes: ['1x1','1x2','2x1'],       defaultConfig: { active: false, sceneName: 'Noche', iconId: 'moon' }, component: EscenaIndividual },
  // ── AUTOMATIZACIÓN ──
  { id: 'temporizador',    category: 'Automatización', categoryIcon: '⚙', icon: '⏱', name: 'Temporizador',  sizes: ['1x2','2x1','2x2'], defaultConfig: { active: false, duration: 1800, name: 'Timer' }, component: Temporizador },
  { id: 'regla-auto',      category: 'Automatización', categoryIcon: '⚙', icon: '⚙', name: 'Regla Auto',    sizes: ['1x2','2x1','2x2'], defaultConfig: { enabled: true, name: 'Mi regla', condition: { id: 'root', type: 'group', operator: 'AND', children: [] }, actions: [] }, component: ReglaAutomatica },
  { id: 'estado-hogar',    category: 'Automatización', categoryIcon: '⚙', icon: '🏠', name: 'Estado Hogar',  sizes: ['2x2','2x4'], defaultConfig: { activeDevices: 8, alerts: 0, kwh: 12.4 }, component: EstadoHogar },
  // ── ORGANIZACIÓN ──
  { id: 'grupo', category: 'Organización', categoryIcon: '■', icon: '📦', name: 'Grupo',
    sizes: ['dynamic'],
    defaultConfig: { name: 'Grupo', icon: 'home', children: [] },
    component: GrupoWidget },
  { id: 'notas', category: 'Organización', categoryIcon: '■', icon: '📝', name: 'Notas',
    sizes: ['1x2', '2x2', '2x4', '4x4', '2x6', '4x6'],
    defaultConfig: { name: 'Mis notas', notes: [], activeId: null },
    component: Notas },
  // ── NAVEGACIÓN ──
  { id: 'nav-dashboard', category: 'Navegación', categoryIcon: '◈', icon: '🏠', name: 'Ir a Dashboard',
    sizes: ['1x1', '1x2', '2x1', '2x2'],
    defaultConfig: { targetId: '', targetName: '', iconId: 'home' },
    component: NavegadorDashboard },
  // ── UTILIDADES ──
  { id: 'calendario-dia', category: 'Utilidades', categoryIcon: '◇', icon: '📅', name: 'Calendario',
    sizes: ['1x1', '2x2', '2x4', '4x4'],
    defaultConfig: { name: 'Calendario' },
    component: CalendarioDia },
];

export function getCatalogEntry(id) {
  return WIDGET_CATALOG.find(w => w.id === id);
}
