import { useState } from 'react';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useDeviceControl } from '../../hooks/useDeviceControl';

const SOURCES = ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube', 'TV'];
const APPS = ['🎬 Netflix', '▶ YouTube', '🎵 Spotify', '➕ Disney+'];
const APP_CMDS = { 'Netflix': 'netflix', 'YouTube': 'youtube', 'Spotify': 'spotify', 'Disney+': 'disney' };
const SOURCE_INPUT_CMDS = { 'HDMI 1': 'HDMI_1', 'HDMI 2': 'HDMI_2', 'TV': 'dtv' };
const SOURCE_APP_CMDS  = { 'Netflix': 'netflix', 'YouTube': 'youtube' };
const PICTURE_MODES = ['vivid', 'standard', 'cinema', 'sports', 'game'];
const PICTURE_LABELS = { vivid: 'Vivid', standard: 'Standard', cinema: 'Cinema', sports: 'Sports', game: 'Game' };

function TVModal({ config, onConfigChange, onClose, accentColor, sendCmd }) {
  const { on = false, source = 'HDMI 1', volume = 30, name = 'TV', channel = 1, pictureMode = 'standard' } = config;
  const icons = useWidgetIcons('tv', config.icons);
  const hasDevice = !!config.deviceId;
  const cfg = (patch) => onConfigChange({ ...config, ...patch });

  const adjVolume = (d) => {
    const next = Math.max(0, Math.min(100, volume + d));
    if (hasDevice) sendCmd(d > 0 ? 'volumeUp' : 'volumeDown');
    cfg({ volume: next, prevVolume: config.prevVolume });
  };
  const adjChannel = (d) => {
    if (hasDevice) sendCmd(d > 0 ? 'channelUp' : 'channelDown');
    cfg({ channel: Math.max(1, (channel || 1) + d) });
  };
  const toggleMute = () => {
    const muted = volume === 0;
    if (hasDevice) sendCmd(muted ? 'unmute' : 'mute');
    if (muted) {
      cfg({ volume: config.prevVolume ?? 15, prevVolume: undefined });
    } else {
      cfg({ volume: 0, prevVolume: volume });
    }
  };
  const handleKey = (key) => {
    if (hasDevice) sendCmd('sendKey', key);
  };
  const handleApp = (appLabel) => {
    const appName = appLabel.replace(/^[^ ]+ /, '');
    if (hasDevice) sendCmd('launchApp', APP_CMDS[appName] ?? appName.toLowerCase());
    cfg({ source: appName, on: true });
  };
  const handleSource = (s) => {
    if (hasDevice) {
      if (SOURCE_APP_CMDS[s]) sendCmd('launchApp', SOURCE_APP_CMDS[s]);
      else sendCmd('switchInput', SOURCE_INPUT_CMDS[s] ?? s);
    }
    cfg({ source: s, on: true });
  };
  const handlePicture = (mode) => {
    if (hasDevice) sendCmd('setPictureMode', mode);
    cfg({ pictureMode: mode });
  };
  const muted = volume === 0;

  const Btn = ({ children, onClick, style = {}, title }) => (
    <button
      style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', color:'white', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', ...style }}
      onClick={onClick} onMouseDown={e => e.stopPropagation()} title={title}
    >{children}</button>
  );
  const sq = { width:36, height:36, fontSize:14 };

  return (
    <ModalBase
      title="📺 Control TV"
      headerRight={<Toggle on={on} onToggle={() => { if (hasDevice) sendCmd(on ? 'off' : 'on'); cfg({ on: !on }); }} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:12, marginBottom:8 }}>{name}</div>

      {/* Pantalla */}
      <div style={{ background:on?'#080808':'#111', borderRadius:7, height:44, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)', marginBottom:10 }}>
        {on ? <span style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>{source}</span>
            : <SvgIcon id={icons.default} size={22} color="var(--icon-off)" />}
      </div>

      {/* D-pad + OK */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,36px)', gridTemplateRows:'repeat(3,36px)', gap:4, margin:'0 auto 10px', width:'fit-content' }}>
        <div /><Btn style={sq} onClick={() => handleKey('UP')} title="Arriba">▲</Btn><div />
        <Btn style={sq} onClick={() => handleKey('LEFT')} title="Izquierda">◀</Btn>
        <Btn style={{ ...sq, background:`${accentColor}33`, borderColor:`${accentColor}66`, fontWeight:700, fontSize:12 }} onClick={() => handleKey('ENTER')} title="OK">OK</Btn>
        <Btn style={sq} onClick={() => handleKey('RIGHT')} title="Derecha">▶</Btn>
        <div /><Btn style={sq} onClick={() => handleKey('DOWN')} title="Abajo">▼</Btn><div />
      </div>

      {/* Botones de control */}
      <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:10 }}>
        <Btn style={{ ...sq, fontSize:16 }} onClick={() => handleKey('HOME')} title="Inicio">🏠</Btn>
        <Btn style={{ ...sq, fontSize:16 }} onClick={() => handleKey('BACK')} title="Atrás">↩</Btn>
        <Btn style={{ ...sq, fontSize:16 }} onClick={() => handleKey('MENU')} title="Menú">☰</Btn>
        <Btn style={{ ...sq, fontSize:16, ...(muted?{background:`${accentColor}33`, borderColor:`${accentColor}66`}:{}) }}
          onClick={toggleMute} title="Silencio">🔇</Btn>
      </div>

      {/* Volumen + Canal */}
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, textAlign:'center', marginBottom:4 }}>Vol</div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <Btn style={{ flex:1, height:30, fontSize:16 }} onClick={() => adjVolume(-1)}>−</Btn>
            <span style={{ minWidth:28, textAlign:'center', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{volume}</span>
            <Btn style={{ flex:1, height:30, fontSize:16 }} onClick={() => adjVolume(1)}>+</Btn>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, textAlign:'center', marginBottom:4 }}>Canal</div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <Btn style={{ flex:1, height:30, fontSize:16 }} onClick={() => adjChannel(-1)}>−</Btn>
            <span style={{ minWidth:28, textAlign:'center', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{channel || 1}</span>
            <Btn style={{ flex:1, height:30, fontSize:16 }} onClick={() => adjChannel(1)}>+</Btn>
          </div>
        </div>
      </div>

      {/* Apps */}
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Apps</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
        {APPS.map(a => (
          <Btn key={a} style={{ padding:'4px 8px', height:28, fontSize:12, borderRadius:6 }}
            onClick={() => handleApp(a)}>{a}</Btn>
        ))}
      </div>

      {/* Fuente */}
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Fuente</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
        {SOURCES.map(s => (
          <Btn key={s} style={{ padding:'4px 8px', height:28, fontSize:12, borderRadius:6, ...(source===s&&on?{background:`${accentColor}33`,borderColor:`${accentColor}66`,fontWeight:700}:{}) }}
            onClick={() => handleSource(s)}>{s}</Btn>
        ))}
      </div>

      {/* Imagen */}
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Imagen</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
        {PICTURE_MODES.map(m => (
          <Btn key={m} style={{ padding:'4px 8px', height:28, fontSize:12, borderRadius:6, ...(pictureMode===m?{background:`${accentColor}33`,borderColor:`${accentColor}66`,fontWeight:700}:{}) }}
            onClick={() => handlePicture(m)}>{PICTURE_LABELS[m]}</Btn>
        ))}
      </div>

      <IconSection typeId="tv" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

const Screen = ({ on, source, longPress = {}, flex, height, fontSize = 12, iconId }) => (
  <div style={{
    background: on ? '#0a0a0a' : 'var(--bg-widget)',
    borderRadius: 6, border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', overflow: 'hidden',
    ...(flex ? { flex: 1 } : { height }),
  }} {...longPress}>
    {on
      ? <div style={{ color:'rgba(255,255,255,0.35)', fontSize }}>{source}</div>
      : <SvgIcon id={iconId} size={fontSize * 2.2} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
    }
  </div>
);

export default function TV({ size, config, onConfigChange, accentColor }) {
  const { on = false, source = 'HDMI 1', volume = 30, name = 'TV' } = config;
  const [modal, setModal] = useState(false);
  const sendCmd = useDeviceControl(config);

  const toggle = () => {
    sendCmd(on ? 'off' : 'on');
    onConfigChange({ ...config, on: !on });
  };
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const nextSource = () => {
    const next = SOURCES[(SOURCES.indexOf(source) + 1) % SOURCES.length];
    if (SOURCE_APP_CMDS[next]) sendCmd('launchApp', SOURCE_APP_CMDS[next]);
    else sendCmd('switchInput', SOURCE_INPUT_CMDS[next] ?? next);
    onConfigChange({ ...config, source: next });
  };
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('tv', config.icons);

  const Modal = modal && (
    <TVModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} sendCmd={sendCmd} />
  );

  // ── 1x2 ──────────────────────────────────────────────
  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Screen on={on} source={source} longPress={longPress} flex fontSize={11} iconId={icons.default} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, flex:1 }}>{name}</div>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0, marginLeft:6 }}>{on ? source : '○'}</span>
      </div>
      {Modal}
    </div>
  );

  // ── 2x1 ──────────────────────────────────────────────
  if (size === '2x1') return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <span style={{ flexShrink:0, cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={38} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button className="w-btn w-btn-sm" style={{ flexShrink:0 }} onClick={e => { e.stopPropagation(); nextSource(); }} onMouseDown={e => e.stopPropagation()}>📡 {source}</button>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // ── 2x2 ──────────────────────────────────────────────
  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Screen on={on} source={source} longPress={longPress} flex iconId={icons.default} />
      <button className="w-btn w-btn-sm" style={{ width:'100%' }}
        onClick={e => { e.stopPropagation(); nextSource(); }} onMouseDown={e => e.stopPropagation()}>
        📡 {source}
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // ── 2x4 ──────────────────────────────────────────────
  return (
    <div className="w-body">
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Screen on={on} source={source} longPress={longPress} flex fontSize={13} iconId={icons.default} />
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {SOURCES.map(s => (
          <button key={s} className="w-btn w-btn-sm"
            style={source === s && on ? { background:'var(--border-accent)', color:'white' } : {}}
            onClick={e => { e.stopPropagation(); onConfigChange({ ...config, source: s }); }}
            onMouseDown={e => e.stopPropagation()}>{s}</button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );
}
