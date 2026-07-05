import { useState } from 'react';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function MusicaModal({ config, onConfigChange, onClose, accentColor }) {
  const { playing = false, track = 'Blinding Lights', artist = 'The Weeknd', volume = 65 } = config;
  const icons = useWidgetIcons('musica', config.icons);
  return (
    <ModalBase title="🎵 Música" onClose={onClose} borderColor={accentColor}>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
        <div style={{ width:72, height:72, borderRadius:10, background:`linear-gradient(135deg,var(--accent-dim),${accentColor}44)`, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)', flexShrink:0 }}>
          <SvgIcon id={icons.default} size={32} color={playing ? 'var(--icon-on)' : 'var(--icon-off)'} className={playing ? 'icon-glow' : ''} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ color:'#e2e8f0', fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track}</div>
          <div style={{ color:'var(--text-secondary)', fontSize:12, marginTop:4 }}>{artist}</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:16 }}>
        {['⏮', playing ? '⏸' : '▶', '⏭'].map((icon, i) => (
          <button key={i} className="w-btn-icon"
            style={{ width:40, height:40, fontSize:18, ...(i === 1 ? { background:accentColor, color:'white', border:'none', borderRadius:8 } : {}) }}
            onClick={() => { if (i === 1) onConfigChange({ ...config, playing: !playing }); }}
            onMouseDown={e => e.stopPropagation()}>{icon}</button>
        ))}
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Volumen · {volume}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12 }}>🔇</span>
        <Slider value={volume} onChange={v => onConfigChange({ ...config, volume: v })} showVal={false} />
        <span style={{ fontSize:12 }}>🔊</span>
      </div>
      <IconSection typeId="musica" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

const PlayBtn = ({ playing, onToggle, accentColor, size = 28 }) => (
  <button
    className="w-btn-icon"
    style={{ width:size, height:size, fontSize:size * 0.5, flexShrink:0,
      ...(playing ? { background:'rgba(255,255,255,0.70)', color:'rgba(0,0,0,0.8)', border:'none', borderRadius:6 } : {}) }}
    onClick={e => { e.stopPropagation(); onToggle(); }}
    onMouseDown={e => e.stopPropagation()}>
    {playing ? '⏸' : '▶'}
  </button>
);

const Cover = ({ sz, longPress = {}, iconId, accentColor, playing }) => (
  <div style={{ width:sz, height:sz, borderRadius:8, flexShrink:0,
    background:'linear-gradient(135deg,var(--accent-dim),rgba(99,102,241,0.25))',
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid var(--border)', cursor:'pointer' }}
    {...longPress}>
    <SvgIcon id={iconId} size={sz * 0.38} color={playing ? 'var(--icon-on)' : 'var(--icon-off)'} className={playing ? 'icon-glow' : ''} />
  </div>
);

export default function Musica({ size, config, onConfigChange, accentColor }) {
  const { playing = false, track = 'Blinding Lights', artist = 'The Weeknd', volume = 65, name = 'Música' } = config;
  const [modal, setModal] = useState(false);
  const togglePlay = () => onConfigChange({ ...config, playing: !playing });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('musica', config.icons);

  const Modal = modal && (
    <MusicaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  // ── 1x2 ──────────────────────────────────────────
  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <PlayBtn playing={playing} onToggle={togglePlay} accentColor={accentColor} />
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Cover sz={56} longPress={longPress} iconId={icons.default} accentColor={accentColor} playing={playing} />
      </div>
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track}</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{artist}</div>
      {Modal}
    </div>
  );

  // ── 2x2 ──────────────────────────────────────────
  if (size === '2x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
        <PlayBtn playing={playing} onToggle={togglePlay} accentColor={accentColor} />
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center', flex:1 }}>
        <Cover sz={52} longPress={longPress} iconId={icons.default} accentColor={accentColor} playing={playing} />
        <div style={{ flex:1, minWidth:0 }}>
          <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track}</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{artist}</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', gap:24 }}>
        <button className="w-btn-icon" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏮</button>
        <button className="w-btn-icon" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏭</button>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // ── 2x1 ──────────────────────────────────────────
  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Cover sz={28} longPress={longPress} iconId={icons.default} accentColor={accentColor} playing={playing} />
        <div style={{ flex:1, minWidth:0 }}>
          <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track}</div>
          <div style={{ fontSize:9, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{artist}</div>
        </div>
        <PlayBtn playing={playing} onToggle={togglePlay} accentColor={accentColor} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button className="w-btn-icon" style={{ width:20, height:20, fontSize:12, flexShrink:0 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏮</button>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
        <button className="w-btn-icon" style={{ width:20, height:20, fontSize:12, flexShrink:0 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏭</button>
      </div>
      {Modal}
    </div>
  );

  // ── 4x4 ──────────────────────────────────────────
  return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
        <PlayBtn playing={playing} onToggle={togglePlay} accentColor={accentColor} size={32} />
      </div>
      <div style={{ display:'flex', gap:16, flex:1, alignItems:'center' }}>
        <Cover sz={140} longPress={longPress} iconId={icons.default} accentColor={accentColor} playing={playing} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track}</div>
          <div style={{ color:'var(--text-secondary)', marginBottom:20, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{artist}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:24, marginBottom:12 }}>
            <button className="w-btn-icon" style={{ width:36, height:36, fontSize:16 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏮</button>
            <button className="w-btn-icon" style={{ width:36, height:36, fontSize:16 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>⏭</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:12 }}>🔇</span>
            <Slider value={volume} onChange={setVolume} showVal={false} />
            <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{volume}</span>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:6, padding:'6px 10px' }}>
        <div style={{ height:4, background:'rgba(255,255,255,0.10)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:'45%', height:'100%', background:'rgba(255,255,255,0.70)', borderRadius:2 }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          <div className="w-sub">1:48</div><div className="w-sub">4:00</div>
        </div>
      </div>
      {Modal}
    </div>
  );
}
