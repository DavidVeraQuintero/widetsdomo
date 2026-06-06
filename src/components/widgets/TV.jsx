import { useState } from 'react';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

const SOURCES = ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube', 'TV'];

function TVModal({ config, onConfigChange, onClose, accentColor }) {
  const { on = false, source = 'HDMI 1', volume = 30, name = 'TV' } = config;
  const icons = useWidgetIcons('tv', config.icons);
  return (
    <ModalBase
      title="📺 Televisión"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ ...config, on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ background:on?'#0a0a0a':'var(--bg-widget)', borderRadius:8, height:60, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)', marginBottom:14 }}>
        {on ? <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>{source}</div> : <SvgIcon id={icons.default} size={28} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />}
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Fuente</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {SOURCES.map(s => (
          <button key={s} className="w-btn w-btn-sm"
            style={source === s && on ? { background:'var(--border-accent)', color:'white' } : {}}
            onClick={() => onConfigChange({ ...config, source: s, on: true })} onMouseDown={e => e.stopPropagation()}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Volumen · {volume}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12 }}>🔈</span>
        <Slider value={volume} onChange={v => onConfigChange({ ...config, volume: v })} showVal={false} />
        <span style={{ fontSize:12 }}>🔊</span>
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
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const nextSource = () => onConfigChange({ ...config, source: SOURCES[(SOURCES.indexOf(source) + 1) % SOURCES.length] });
  const col = on ? accentColor : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('tv', config.icons);

  const Modal = modal && (
    <TVModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  // ── 1x2 ──────────────────────────────────────────────
  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Screen on={on} source={source} longPress={longPress} flex fontSize={11} iconId={icons.default} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, flex:1 }}>{name}</div>
        <span style={{ fontSize:9, color:'var(--text-secondary)', flexShrink:0, marginLeft:6 }}>{on ? source : '○'}</span>
      </div>
      {Modal}
    </div>
  );

  // ── 2x1 ──────────────────────────────────────────────
  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Screen on={on} source={source} longPress={longPress} height={28} fontSize={9} iconId={icons.default} />
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button className="w-btn w-btn-sm" style={{ flexShrink:0, fontSize:9 }} onClick={e => { e.stopPropagation(); nextSource(); }} onMouseDown={e => e.stopPropagation()}>📡 {source}</button>
        <span style={{ fontSize:9, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // ── 2x2 ──────────────────────────────────────────────
  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📺 TV</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Screen on={on} source={source} longPress={longPress} flex iconId={icons.default} />
      <button className="w-btn w-btn-sm" style={{ width:'100%' }}
        onClick={e => { e.stopPropagation(); nextSource(); }} onMouseDown={e => e.stopPropagation()}>
        📡 {source}
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:9, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // ── 2x4 ──────────────────────────────────────────────
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📺 TV</div>
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
        <span style={{ fontSize:9, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );
}
