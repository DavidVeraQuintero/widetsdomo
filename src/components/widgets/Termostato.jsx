import { useState } from 'react';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function TermostatoModal({ target, current, name, config, onConfigChange, onClose, accentColor }) {
  const heating = current < target;
  const col = heating ? '#f97316' : accentColor;
  const icons = useWidgetIcons('termostato', config.icons);
  return (
    <ModalBase
      title="🌡 Termostato"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>
        <SvgIcon id={heating ? icons.heating : icons.idle} size={40} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div style={{ textAlign:'center', fontSize:44, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{current}°C</div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginBottom:16 }}>temperatura actual</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Objetivo · {target}°C</div>
      <Slider value={target} min={15} max={30} onChange={v => onConfigChange({ target: v })} showVal={false} />
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginTop:8, fontWeight:600 }}>{heating ? '🔥 Calentando' : '❄ Refrigerando'}</div>
      <IconSection typeId="termostato" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Termostato({ size, config, onConfigChange, accentColor }) {
  const { name = 'Termostato', target = 22, current = 21 } = config;
  const [modal, setModal] = useState(false);
  const setTarget = (v) => onConfigChange({ ...config, target: v });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const heating = current < target;
  const col = heating ? '#f97316' : accentColor;
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('termostato', config.icons);

  const Modal = modal && (
    <TermostatoModal target={target} current={current} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ flexDirection:'column', justifyContent:'center', alignItems:'center', gap:4 }}>
      <span style={{ cursor:'pointer', userSelect:'none', flexShrink:0 }} onClick={e => { e.stopPropagation(); }} {...longPress}>
        <SvgIcon id={heating ? icons.heating : icons.idle} size={40} color="var(--icon-on)" className="icon-glow" />
      </span>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>{current}°</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div style={{ cursor:'pointer' }} {...longPress}>
        <SvgIcon id={heating ? icons.heating : icons.idle} size={34} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{current}°C</div>
      <div className="w-sub">Objetivo: <span style={{ color:'var(--text-secondary)' }}>{target}°C</span></div>
      <Slider value={target} min={15} max={30} onChange={setTarget} showVal={false} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
        <SvgIcon id={heating ? icons.heating : icons.idle} size={32} color="var(--icon-on)" className="icon-glow" />
      </span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div style={{ marginTop:6 }}><Slider value={target} min={15} max={30} onChange={setTarget} showVal={false} /></div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="w-val-med" style={{ color:'var(--text-primary)' }}>{current}°</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>↑{target}°</div>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>{heating ? '🔥 Calentando' : '❄ Refrigerando'}</span>
        <span />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={heating ? icons.heating : icons.idle} size={36} color="var(--icon-on)" className="icon-glow" />
        </div>
        <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{current}°C</div>
        <div className="w-name">{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>↑{target}°</span>
        <Slider value={target} min={15} max={30} onChange={setTarget} showVal={false} />
      </div>
      {Modal}
    </div>
  );
}
