import { useState } from 'react';
import Toggle from './Toggle';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function CamaraModal({ recording, name, config, onConfigChange, onClose }) {
  const icons = useWidgetIcons('camara-ip', config.icons);
  const col = recording ? '#ef4444' : 'var(--text-dim)';
  const Preview = ({ h }) => (
    <div style={{ background:'linear-gradient(135deg,#0a0a0a,#1a1a2e)', borderRadius:6, height:h, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', border:'1px solid var(--border)', overflow:'hidden' }}>
      <SvgIcon id={icons.default} size={28} color="var(--icon-on)" className="icon-glow" />
      {recording && <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 6px #ef4444' }} />}
      <div style={{ position:'absolute', bottom:6, left:8, fontSize:9, color:'rgba(255,255,255,0.5)' }}>{new Date().toLocaleTimeString()}</div>
    </div>
  );
  return (
    <ModalBase
      title="📹 Cámara IP"
      headerRight={<Toggle on={recording} onToggle={() => onConfigChange({ recording: !recording })} />}
      onClose={onClose}
      borderColor={recording ? '#ef4444' : '#888'}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <Preview h={140} />
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-primary)', marginTop:12, fontWeight:600 }}>{recording ? '● Grabando' : '○ Inactiva'}</div>
      <IconSection typeId="camara-ip" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function CamaraIP({ size, config, onConfigChange, accentColor }) {
  const { recording = true, name = 'Cámara' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, recording: !recording });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const icons = useWidgetIcons('camara-ip', config.icons);
  const longPress = useLongPress(() => setModal(true));

  const Preview = ({ h }) => (
    <div style={{ background:'linear-gradient(135deg,#0a0a0a,#1a1a2e)', borderRadius:6, height:h, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', border:'1px solid var(--border)', overflow:'hidden' }}>
      <SvgIcon id={icons.default} size={28} color="var(--icon-on)" className="icon-glow" />
      {recording && <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 6px #ef4444' }} />}
      <div style={{ position:'absolute', bottom:6, left:8, fontSize:9, color:'rgba(255,255,255,0.5)' }}>{new Date().toLocaleTimeString()}</div>
    </div>
  );

  const Modal = modal && (
    <CamaraModal recording={recording} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📹 Cámara IP</div>
        <Toggle on={recording} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{ cursor:'pointer' }} {...longPress}><Preview h={90} /></div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📹 Cámara IP</div>
        <Toggle on={recording} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{ cursor:'pointer' }} {...longPress}><Preview h={240} /></div>
      <div className="w-row">
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{recording ? '● Grabando' : '○ Standby'}</div>
        <button className="w-btn w-btn-sm" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>📸 Captura</button>
      </div>
      {Modal}
    </div>
  );
}
