import { useState, useEffect } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function PinPad({ onDigit, onDelete, onConfirm, disabled }) {
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
      {keys.map(k => (
        <button key={k} className="w-btn"
          disabled={disabled}
          style={{
            fontSize:16, padding:'10px 0',
            ...(k==='✓' && { borderColor:'#22c55e', color:'var(--text-primary)' }),
            ...(k==='⌫' && { borderColor:'#f59e0b', color:'var(--text-primary)' }),
            ...(disabled && { opacity:0.4, cursor:'not-allowed' }),
          }}
          onClick={() => { if(k==='⌫') onDelete(); else if(k==='✓') onConfirm(); else onDigit(k); }}
          onMouseDown={e => e.stopPropagation()}
        >{k}</button>
      ))}
    </div>
  );
}

function PinDots({ length, filled, shake }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'12px 0', animation: shake ? 'shake 0.4s' : 'none' }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #64748b', background: i < filled ? '#e2e8f0' : 'transparent', transition:'background 0.1s' }} />
      ))}
    </div>
  );
}

function PinModal({ pin, onDisarm, onClose }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const r = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (r <= 0) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setRemaining(0);
        setError('');
      } else {
        setRemaining(r);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = lockedUntil > Date.now();

  const handleDigit = (d) => {
    if (!locked && digits.length < pin.length) setDigits(p => p + d);
  };
  const handleDelete = () => { if (!locked) setDigits(p => p.slice(0, -1)); };
  const handleConfirm = () => {
    if (locked || !digits) return;
    if (digits === pin) {
      onDisarm();
      onClose();
    } else {
      const next = failedAttempts + 1;
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits('');
      if (next >= 3) {
        setFailedAttempts(next);
        const until = Date.now() + 60_000;
        setLockedUntil(until);
        setRemaining(60);
        setError('');
      } else {
        setFailedAttempts(next);
        setError(`PIN incorrecto. ${3 - next} intento${3 - next === 1 ? '' : 's'} restante${3 - next === 1 ? '' : 's'}.`);
      }
    }
  };

  return (
    <ModalBase title="🔐 Introduce el PIN" onClose={locked ? () => {} : onClose} borderColor="#f59e0b">
      <PinDots length={pin.length} filled={digits.length} shake={shake} />
      {locked
        ? <div style={{ textAlign:'center', color:'var(--text-primary)', fontSize:13, marginBottom:12 }}>Demasiados intentos. Espera {remaining}s</div>
        : error
          ? <div style={{ textAlign:'center', color:'var(--text-primary)', fontSize:13, marginBottom:12 }}>{error}</div>
          : <div style={{ height:33, marginBottom:12 }} />}
      <PinPad onDigit={handleDigit} onDelete={handleDelete} onConfirm={handleConfirm} disabled={locked} />
    </ModalBase>
  );
}

function AlarmaModal({ config, onConfigChange, onDisarm, onClose }) {
  const { armed = false, triggered = false, name = 'Alarma', pin = null } = config;
  const icons = useWidgetIcons('alarma', config.icons);
  const col = triggered ? '#ef4444' : armed ? '#f59e0b' : '#22c55e';
  const label = triggered ? '🚨 ALARMA!' : armed ? '🔒 Armada' : '✓ Desarmada';

  const [pinStep, setPinStep] = useState(null);
  const [pinBuffer, setPinBuffer] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinError, setPinError] = useState('');

  const resetPinFlow = () => { setPinStep(null); setPinBuffer(''); setPinNew(''); setPinError(''); };

  const pinDotLen = {
    'setup':          6,
    'setup-confirm':  pinNew.length || 4,
    'change-verify':  pin ? pin.length : 4,
    'change-new':     6,
    'change-confirm': pinNew.length || 4,
    'delete-verify':  pin ? pin.length : 4,
  };
  const pinMaxLen = {
    'setup':          6,
    'setup-confirm':  pinNew.length || 6,
    'change-verify':  pin ? pin.length : 6,
    'change-new':     6,
    'change-confirm': pinNew.length || 6,
    'delete-verify':  pin ? pin.length : 6,
  };
  const stepTitle = {
    'setup':          'Nuevo PIN (4-6 dígitos)',
    'setup-confirm':  'Confirmar nuevo PIN',
    'change-verify':  'PIN actual',
    'change-new':     'Nuevo PIN (4-6 dígitos)',
    'change-confirm': 'Confirmar nuevo PIN',
    'delete-verify':  'Confirmar PIN actual para eliminar',
  };

  const handlePinDigit = (d) => {
    if (pinBuffer.length < (pinMaxLen[pinStep] || 6)) setPinBuffer(p => p + d);
  };
  const handlePinDelete = () => setPinBuffer(p => p.slice(0, -1));
  const handlePinConfirm = () => {
    if (pinStep === 'setup') {
      if (pinBuffer.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
      setPinNew(pinBuffer); setPinBuffer(''); setPinError(''); setPinStep('setup-confirm');
    } else if (pinStep === 'setup-confirm') {
      if (pinBuffer !== pinNew) { setPinError('Los PINs no coinciden'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: pinNew }); resetPinFlow();
    } else if (pinStep === 'change-verify') {
      if (pinBuffer !== pin) { setPinError('PIN incorrecto'); setPinBuffer(''); return; }
      setPinBuffer(''); setPinError(''); setPinStep('change-new');
    } else if (pinStep === 'change-new') {
      if (pinBuffer.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
      setPinNew(pinBuffer); setPinBuffer(''); setPinError(''); setPinStep('change-confirm');
    } else if (pinStep === 'change-confirm') {
      if (pinBuffer !== pinNew) { setPinError('Los PINs no coinciden'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: pinNew }); resetPinFlow();
    } else if (pinStep === 'delete-verify') {
      if (pinBuffer !== pin) { setPinError('PIN incorrecto'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: null }); resetPinFlow();
    }
  };

  return (
    <ModalBase title="🚨 Alarma" onClose={onClose} borderColor={col}>
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={triggered ? icons.triggered : armed ? icons.armed : icons.disarmed} size={72} color={armed ? 'var(--icon-on)' : 'var(--icon-off)'} className={armed ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:triggered ? 700 : 400, marginBottom:20 }}>{label}</div>
      <button
        className="w-btn"
        style={{ width:'100%', ...(armed ? { borderColor:'#ef4444', color:'var(--text-primary)' } : {}) }}
        onClick={armed ? onDisarm : () => onConfigChange({ ...config, armed: true, triggered: false })}
        onMouseDown={e => e.stopPropagation()}
      >
        {armed ? 'Desarmar' : 'Armar'}
      </button>

      {!armed && (
        <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:14 }}>
          {!pinStep ? (
            <>
              <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8 }}>
                {pin ? `PIN: ${'●'.repeat(pin.length)}` : 'Sin PIN configurado'}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {!pin && (
                  <button className="w-btn" style={{ flex:1 }} onMouseDown={e => e.stopPropagation()}
                    onClick={() => { setPinStep('setup'); setPinBuffer(''); }}>
                    Configurar PIN
                  </button>
                )}
                {pin && (
                  <>
                    <button className="w-btn" style={{ flex:1 }} onMouseDown={e => e.stopPropagation()}
                      onClick={() => { setPinStep('change-verify'); setPinBuffer(''); }}>
                      Cambiar PIN
                    </button>
                    <button className="w-btn" style={{ flex:1, borderColor:'#ef4444', color:'var(--text-primary)' }} onMouseDown={e => e.stopPropagation()}
                      onClick={() => { setPinStep('delete-verify'); setPinBuffer(''); }}>
                      Eliminar PIN
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4, textAlign:'center' }}>{stepTitle[pinStep]}</div>
              <PinDots length={pinDotLen[pinStep]} filled={pinBuffer.length} shake={false} />
              {pinError && <div style={{ textAlign:'center', color:'var(--text-primary)', fontSize:12, marginBottom:6 }}>{pinError}</div>}
              <PinPad onDigit={handlePinDigit} onDelete={handlePinDelete} onConfirm={handlePinConfirm} disabled={false} />
              <button className="w-btn" style={{ width:'100%', marginTop:8 }} onMouseDown={e => e.stopPropagation()} onClick={resetPinFlow}>
                Cancelar
              </button>
            </>
          )}
          <IconSection typeId="alarma" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
        </div>
      )}
    </ModalBase>
  );
}

export default function Alarma({ size, config, onConfigChange, accentColor }) {
  const { armed = false, triggered = false, name = 'Alarma', pin = null } = config;
  const [modal, setModal] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const icons = useWidgetIcons('alarma', config.icons);

  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const handleArm = () => patchConfig({ armed: true, triggered: false });
  const handleDisarm = () => {
    if (pin) {
      setModal(false);
      setPinModal(true);
    } else {
      patchConfig({ armed: false, triggered: false });
    }
  };
  const toggleArm = () => armed ? handleDisarm() : handleArm();

  const col = triggered ? '#ef4444' : armed ? '#f59e0b' : '#22c55e';
  const label = triggered ? '🚨 ALARMA!' : armed ? '🔒 Armada' : '✓ Desarmada';
  const longPress = useLongPress(() => setModal(true));

  const PinModalEl = pinModal && (
    <PinModal pin={pin} onDisarm={() => patchConfig({ armed: false, triggered: false })} onClose={() => setPinModal(false)} />
  );
  const ModalEl = modal && (
    <AlarmaModal config={config} onConfigChange={patchConfig} onDisarm={handleDisarm} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggleArm(); }} {...longPress}><SvgIcon id={triggered ? icons.triggered : armed ? icons.armed : icons.disarmed} size={44} color={armed ? 'var(--icon-on)' : 'var(--icon-off)'} className={armed ? 'icon-glow' : ''} /></span>
        <span style={{ fontSize:12, color:'var(--text-primary)', transition:'color 0.2s' }}>{armed ? 'Armada' : 'OFF'}</span>
      </div>
      {PinModalEl}
      {ModalEl}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:col, boxShadow:armed||triggered?`0 0 8px ${col}`:'none' }} />
          <span style={{ fontSize:12, color:'var(--text-primary)' }}>{armed ? 'Armada' : 'OFF'}</span>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={triggered ? icons.triggered : armed ? icons.armed : icons.disarmed} size={48} color={armed ? 'var(--icon-on)' : 'var(--icon-off)'} className={armed ? 'icon-glow' : ''} /></div>
        <div className="w-status" style={{ color:'var(--text-primary)', fontWeight:triggered ? 700 : 400 }}>{label}</div>
      </div>
      <button
        className="w-btn"
        style={armed ? { borderColor:'#ef4444', color:'var(--text-primary)' } : {}}
        onClick={e => { e.stopPropagation(); toggleArm(); }}
        onMouseDown={e => e.stopPropagation()}
      >
        {armed ? 'Desarmar' : 'Armar'}
      </button>
      {PinModalEl}
      {ModalEl}
    </div>
  );
}
