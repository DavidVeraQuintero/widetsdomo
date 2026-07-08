// src/components/widgets/ReglaAutomatica.jsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import SvgIcon from './SvgIcon';
import { useLongPress } from './widgetUtils';
import { useHub } from '../../store/hubStore.jsx';
import { DEVICE_CONDITIONS, OPERATOR_LABELS, VALUE_LABELS } from '../../rules/deviceConditions.js';
import { DEVICE_ACTIONS, WIDGET_ICONS } from '../../rules/deviceActions.js';

// ── Helpers de display ─────────────────────────────────────────

function conditionLabel(c) {
  if (c.type === 'time') {
    const opLabel = { eq: 'hora =', gte: 'hora ≥', lte: 'hora ≤' }[c.operator] || c.operator;
    return { icon: '⏰', text: `${opLabel} ${c.value}` };
  }
  const op = OPERATOR_LABELS[c.operator] || c.operator;
  const val = VALUE_LABELS[c.value] || c.value;
  const icon = WIDGET_ICONS[c.widgetTypeId] || '•';
  return { icon, text: `${c.deviceLabel ?? c.deviceId} ${op} ${val}` };
}

function actionLabel(a) {
  const cmdLabels = {
    on: 'encender', off: 'apagar', toggle: 'toggle',
    lock: 'bloquear', unlock: 'desbloquear',
    open: 'abrir', close: 'cerrar',
    setLevel: `nivel ${a.arg ?? '?'}%`,
    setPosition: `posición ${a.arg ?? '?'}%`,
  };
  const icon = WIDGET_ICONS[a.widgetTypeId] || '•';
  return { icon, text: `${a.deviceLabel ?? a.deviceId} → ${cmdLabels[a.command] || a.command}` };
}

function collectLeaves(node) {
  if (!node) return [];
  if (node.type === 'group') return (node.children ?? []).flatMap(collectLeaves);
  return [node];
}

// ── Estilos compartidos del modal ──────────────────────────────
const modalBox = { background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:'2px solid #1e3a5f', borderRadius:'1.14rem', padding:'1.2rem', width:'28rem', maxHeight:'88vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.9rem', boxShadow:'0 0 40px rgba(0,0,0,0.7)' };
const sectionTitle = { fontSize:11, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 };
const inputStyle = { width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 10px', color:'var(--text-primary)', fontSize:13, outline:'none', boxSizing:'border-box' };
const selectStyle = { ...inputStyle, cursor:'pointer', background:'#0f2744', colorScheme:'dark' };
const chipBase = { display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', fontSize:12 };
const addBtn = { fontSize:12, color:'var(--text-secondary)', background:'rgba(255,255,255,0.05)', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', textAlign:'center' };

function nanoid() { return Math.random().toString(36).slice(2,9); }

// ── Picker de dispositivo ──────────────────────────────────────

function DevicePicker({ hubStore, filterFn, onSelect, onCancel }) {
  const { assignments, devices, hubs } = hubStore;
  const [selectedKey, setSelectedKey] = useState('');

  const assignedList = Object.entries(assignments)
    .filter(([, wt]) => filterFn(wt))
    .map(([key, widgetTypeId]) => {
      const [hubId, deviceId] = key.split(':');
      const hub = hubs.find(h => h.id === hubId);
      const devList = devices[hubId] ?? [];
      const dev = devList.find(d => String(d.deviceId) === String(deviceId));
      return { key, hubId, deviceId, widgetTypeId, label: dev?.name ?? deviceId, hubName: hub?.name ?? hubId };
    });

  if (assignedList.length === 0) {
    return (
      <div style={{ fontSize:12, color:'var(--text-secondary)', padding:8 }}>
        No hay dispositivos asignados compatibles. Asígnalos en la pestaña Hubs.
        <br /><button className="w-btn" style={{ marginTop:8 }} onClick={onCancel}>Cancelar</button>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <select style={selectStyle} value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
        <option value="">Seleccionar dispositivo…</option>
        {assignedList.map(d => (
          <option key={d.key} value={d.key}>{WIDGET_ICONS[d.widgetTypeId] || ''} {d.label} ({d.hubName})</option>
        ))}
      </select>
      <div style={{ display:'flex', gap:6 }}>
        <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
        <button className="w-btn" style={{ flex:1 }} disabled={!selectedKey}
          onClick={() => { const found = assignedList.find(d => d.key === selectedKey); if (found) onSelect(found); }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// ── Sub-picker de condición ────────────────────────────────────

function AddConditionFlow({ hubStore, onAdd, onCancel }) {
  const [step, setStep] = useState('type');
  const [pickedDev, setPickedDev] = useState(null);
  const [selAttrIdx, setSelAttrIdx] = useState(0);
  const [selOp, setSelOp] = useState('');
  const [selVal, setSelVal] = useState('');
  const [timeOp, setTimeOp] = useState('gte');
  const [timeVal, setTimeVal] = useState('20:00');

  if (step === 'type') return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={sectionTitle}>Tipo de condición</div>
      <div style={{ display:'flex', gap:8 }}>
        {[['device','Dispositivo'],['time','Tiempo']].map(([t,l]) => (
          <button key={t} className="w-btn" style={{ flex:1 }} onClick={() => setStep(t === 'device' ? 'device-pick' : 'time')}>{l}</button>
        ))}
      </div>
      <button className="w-btn" onClick={onCancel}>Cancelar</button>
    </div>
  );

  if (step === 'device-pick') return (
    <DevicePicker hubStore={hubStore} filterFn={wt => !!DEVICE_CONDITIONS[wt]}
      onSelect={dev => { setPickedDev(dev); setSelAttrIdx(0); setSelOp(''); setSelVal(''); setStep('device-detail'); }}
      onCancel={onCancel} />
  );

  if (step === 'device-detail' && pickedDev) {
    const attrDefs = DEVICE_CONDITIONS[pickedDev.widgetTypeId] ?? [];
    const attrDef = attrDefs[selAttrIdx];
    const ops = attrDef?.operators ?? [];
    const activeOp = selOp || ops[0] || '';
    const isEnum = attrDef?.valueType === 'enum';
    const values = attrDef?.values ?? [];
    const activeVal = selVal || (isEnum ? values[0] : '');
    const canSave = activeOp && activeVal !== '';

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{WIDGET_ICONS[pickedDev.widgetTypeId]} {pickedDev.label}</div>
        {attrDefs.length > 1 && (
          <div>
            <div style={sectionTitle}>Atributo</div>
            <select style={selectStyle} value={selAttrIdx} onChange={e => { setSelAttrIdx(Number(e.target.value)); setSelOp(''); setSelVal(''); }}>
              {attrDefs.map((a, i) => <option key={a.attribute} value={i}>{a.attribute}{a.unit ? ` (${a.unit})` : ''}</option>)}
            </select>
          </div>
        )}
        <div>
          <div style={sectionTitle}>Operador</div>
          <div style={{ display:'flex', gap:6 }}>
            {ops.map(op => (
              <button key={op} className="w-btn" style={{ flex:1, fontWeight: activeOp===op ? 700 : 400, background: activeOp===op ? 'rgba(255,255,255,0.18)' : undefined }}
                onClick={() => setSelOp(op)}>{OPERATOR_LABELS[op] || op}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={sectionTitle}>Valor{attrDef?.unit ? ` (${attrDef.unit})` : ''}</div>
          {isEnum ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {values.map(v => (
                <button key={v} className="w-btn" style={{ fontWeight: activeVal===v ? 700 : 400, background: activeVal===v ? 'rgba(255,255,255,0.18)' : undefined }}
                  onClick={() => setSelVal(v)}>{VALUE_LABELS[v] || v}</button>
              ))}
            </div>
          ) : (
            <input style={inputStyle} type="number" placeholder={`ej: 25${attrDef?.unit ? ' '+attrDef.unit : ''}`}
              value={selVal} onChange={e => setSelVal(e.target.value)} />
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
          <button className="w-btn" style={{ flex:1 }} disabled={!canSave}
            onClick={() => onAdd({ id: nanoid(), type:'device', hubId: pickedDev.hubId, deviceId: pickedDev.deviceId, widgetTypeId: pickedDev.widgetTypeId, deviceLabel: pickedDev.label, attribute: attrDef.attribute, operator: activeOp, value: activeVal })}>
            Agregar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'time') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={sectionTitle}>Condición de tiempo</div>
      <div style={{ display:'flex', gap:6 }}>
        {[['eq','A las'],['gte','Después de'],['lte','Antes de']].map(([op,l]) => (
          <button key={op} className="w-btn" style={{ flex:1, fontSize:11, fontWeight: timeOp===op ? 700 : 400, background: timeOp===op ? 'rgba(255,255,255,0.18)' : undefined }}
            onClick={() => setTimeOp(op)}>{l}</button>
        ))}
      </div>
      <input style={inputStyle} type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)} />
      <div style={{ display:'flex', gap:6 }}>
        <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
        <button className="w-btn" style={{ flex:1 }} onClick={() => onAdd({ id: nanoid(), type:'time', operator: timeOp, value: timeVal })}>Agregar</button>
      </div>
    </div>
  );

  return null;
}

// ── Sub-picker de acción ───────────────────────────────────────

function AddActionFlow({ hubStore, onAdd, onCancel }) {
  const [step, setStep] = useState('device-pick');
  const [pickedDev, setPickedDev] = useState(null);
  const [selCmd, setSelCmd] = useState('');
  const [selArg, setSelArg] = useState(50);

  if (step === 'device-pick') return (
    <DevicePicker hubStore={hubStore} filterFn={wt => !!DEVICE_ACTIONS[wt]}
      onSelect={dev => { setPickedDev(dev); setSelCmd(DEVICE_ACTIONS[dev.widgetTypeId]?.[0]?.command || ''); setStep('cmd'); }}
      onCancel={onCancel} />
  );

  if (step === 'cmd' && pickedDev) {
    const cmds = DEVICE_ACTIONS[pickedDev.widgetTypeId] ?? [];
    const cmdDef = cmds.find(c => c.command === selCmd) ?? cmds[0];
    const hasArg = cmdDef?.argType === 'level';

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{WIDGET_ICONS[pickedDev.widgetTypeId]} {pickedDev.label}</div>
        <div>
          <div style={sectionTitle}>Comando</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {cmds.map(c => (
              <button key={c.command} className="w-btn" style={{ fontWeight: selCmd===c.command ? 700 : 400, background: selCmd===c.command ? 'rgba(255,255,255,0.18)' : undefined }}
                onClick={() => setSelCmd(c.command)}>{c.label}</button>
            ))}
          </div>
        </div>
        {hasArg && (
          <div>
            <div style={sectionTitle}>Valor: {selArg}%</div>
            <input type="range" min={0} max={100} value={selArg} onChange={e => setSelArg(e.target.value)} style={{ width:'100%', accentColor:'var(--icon-on)' }} />
          </div>
        )}
        <div style={{ display:'flex', gap:6 }}>
          <button className="w-btn" style={{ flex:1 }} onClick={onCancel}>Cancelar</button>
          <button className="w-btn" style={{ flex:1 }}
            onClick={() => onAdd({ id: nanoid(), hubId: pickedDev.hubId, deviceId: pickedDev.deviceId, widgetTypeId: pickedDev.widgetTypeId, deviceLabel: pickedDev.label, command: selCmd, arg: hasArg ? Number(selArg) : null })}>
            Agregar
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Condición hoja: card con ▼ para anidar dentro ────────────

const DEPTH_COLORS = ['#4299e1', '#9f7aea', '#ed8936', '#48bb78'];

function ConditionLeaf({ node, color, onUpdate, onDelete, hubStore }) {
  const [expanded, setExpanded] = useState(false);
  const [innerOp, setInnerOp] = useState('AND');
  const [addingInner, setAddingInner] = useState(false);

  const nestWith = (child, op) => {
    // Convierte esta hoja en un grupo que la contiene + el nuevo hijo
    onUpdate({ id: nanoid(), type:'group', children: [{ ...node }, { ...child, joinOp: op }] });
    setExpanded(false);
    setAddingInner(false);
  };

  return (
    <div style={{ background:`${color}12`, border:`1px solid ${color}50`, borderLeft:`3px solid ${color}`, borderRadius:8, padding:'6px 8px', display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-primary)' }}>{conditionLabel(node).icon} {conditionLabel(node).text}</span>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={onDelete} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
          <button className="w-btn" style={{ fontSize:10, padding:'0 6px' }}
            onClick={() => { setExpanded(e => !e); setAddingInner(false); }}>{expanded ? '▲' : '▼'}</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${color}30`, display:'flex', flexDirection:'column', gap:4 }}>
          {addingInner ? (
            <AddConditionFlow hubStore={hubStore}
              onAdd={leaf => nestWith(leaf, innerOp)}
              onCancel={() => setAddingInner(false)} />
          ) : (
            <div style={{ display:'flex', gap:4 }}>
              <button className="w-btn"
                style={{ fontSize:10, padding:'1px 10px', fontWeight:700, color, border:`1px solid ${color}55`, background:`${color}18` }}
                onClick={() => setInnerOp(o => o === 'AND' ? 'OR' : 'AND')}>{innerOp}</button>
              <button style={{ ...addBtn, flex:1 }} onClick={() => setAddingInner(true)}>+ condición</button>
              <button style={{ ...addBtn, flex:1 }} onClick={() => nestWith({ id:nanoid(), type:'group', children:[] }, innerOp)}>+ subgrupo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grupo de condiciones recursivo ─────────────────────────────

function ConditionGroup({ node, onUpdate, onDelete, depth, hubStore }) {
  const [pendingOp, setPendingOp] = useState('AND');
  const [addingLeaf, setAddingLeaf] = useState(false);

  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const hasItems = node.children.length > 0;

  const toggleJoinOp = (id) => onUpdate({
    ...node,
    children: node.children.map(c => c.id === id ? { ...c, joinOp: c.joinOp === 'AND' ? 'OR' : 'AND' } : c)
  });
  const updateChild = (id, upd) => onUpdate({ ...node, children: node.children.map(c => c.id === id ? upd : c) });
  const deleteChild = (id) => onUpdate({ ...node, children: node.children.filter(c => c.id !== id) });

  const addChild = (child) => {
    onUpdate({ ...node, children: [...node.children, hasItems ? { ...child, joinOp: pendingOp } : child] });
  };
  const commitLeaf = (leaf) => { addChild(leaf); setAddingLeaf(false); };
  const addSubGroup = () => addChild({ id:nanoid(), type:'group', children:[] });

  return (
    <div style={{ background:`${color}0a`, border:`1px solid ${color}35`, borderLeft:`3px solid ${color}`, borderRadius:8, padding:'8px 10px', marginTop: depth > 0 ? 4 : 0, display:'flex', flexDirection:'column', gap:4 }}>
      {onDelete && (
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="w-btn" style={{ fontSize:10, padding:'1px 6px' }} onClick={onDelete}>× grupo</button>
        </div>
      )}

      {node.children.map((child, i) => (
        <div key={child.id}>
          {i > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, margin:'3px 0' }}>
              <button className="w-btn"
                style={{ fontSize:10, padding:'1px 10px', fontWeight:700, color, border:`1px solid ${color}55`, background:`${color}18` }}
                onClick={() => toggleJoinOp(child.id)}>{child.joinOp ?? 'AND'}</button>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
            </div>
          )}
          {child.type === 'group' ? (
            <ConditionGroup node={child} depth={depth + 1} hubStore={hubStore}
              onUpdate={upd => updateChild(child.id, upd)}
              onDelete={() => deleteChild(child.id)} />
          ) : (
            <ConditionLeaf node={child} color={color} hubStore={hubStore}
              onUpdate={upd => updateChild(child.id, upd)}
              onDelete={() => deleteChild(child.id)} />
          )}
        </div>
      ))}

      {addingLeaf ? (
        <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8, marginTop: hasItems ? 4 : 0 }}>
          <AddConditionFlow hubStore={hubStore} onAdd={commitLeaf} onCancel={() => setAddingLeaf(false)} />
        </div>
      ) : (
        <div style={{ display:'flex', gap:6, marginTop: hasItems ? 6 : 0 }}>
          {hasItems && (
            <button className="w-btn"
              style={{ fontSize:10, padding:'1px 10px', fontWeight:700, color, border:`1px solid ${color}55`, background:`${color}18` }}
              onClick={() => setPendingOp(o => o === 'AND' ? 'OR' : 'AND')}>{pendingOp}</button>
          )}
          <button style={{ ...addBtn, flex:1 }} onClick={() => setAddingLeaf(true)}>+ condición</button>
          <button style={{ ...addBtn, flex:1 }} onClick={addSubGroup}>+ subgrupo</button>
        </div>
      )}
    </div>
  );
}

// ── Modal principal ────────────────────────────────────────────

function hasTimeConditions(node) {
  if (!node) return false;
  if (node.type === 'time') return true;
  if (node.type === 'group') return (node.children ?? []).some(hasTimeConditions);
  return false;
}

const DEFAULT_CONDITION = { id: 'root', type: 'group', operator: 'AND', children: [] };

function ConfigModal({ config, onSave, onUpdateConfig, onClose }) {
  const hubStore = useHub();
  const { syncRule, hubs } = hubStore;
  const [localName, setLocalName] = useState(config.name ?? 'Mi regla');
  const [condition, setCondition] = useState(config.condition ?? DEFAULT_CONDITION);
  const [actions, setActions] = useState(config.actions ?? []);
  const [addingAction, setAddingAction] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [testing, setTesting] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const stop = e => e.stopPropagation();

  const deleteAction = id => setActions(prev => prev.filter(a => a.id !== id));
  const addAction = action => { setActions(prev => [...prev, action]); setAddingAction(false); };
  const save = () => onSave({ ...config, name: localName, condition, conditionGroups: undefined, actions, _testing: undefined });

  const handleSaveToHubitat = async () => {
    const autoHub = hubs.find(h => h.autoAppId);
    if (!autoHub) {
      setSyncError('Configura el App ID de automatizaciones en la configuración del hub.');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const ruleId = config.id ?? nanoid();
      const newConfig = { ...config, id: ruleId, name: localName, condition, conditionGroups: undefined, actions };
      const hubId = await syncRule(ruleId, newConfig, autoHub.id);
      onSave({ ...newConfig, hubitatSynced: true, hubitatHubId: hubId, _testing: undefined });
    } catch (err) {
      setSyncError(err.message || 'Error al guardar en Hubitat');
    } finally {
      if (mountedRef.current) setSyncing(false);
    }
  };

  const handleProbar = () => {
    const newConfig = { ...config, name: localName, condition, conditionGroups: undefined, actions };
    onUpdateConfig({ ...newConfig, _testing: true });
    setTesting(true);
  };

  const handleCerrarPrueba = () => {
    onUpdateConfig({ ...config, name: localName, condition, conditionGroups: undefined, actions, _testing: undefined });
    setTesting(false);
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}>
      <div style={modalBox} onMouseDown={stop} onClick={stop}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:'0.92rem' }}>⚙ Configurar regla</span>
          <button className="w-btn" style={{ padding:'2px 8px', fontSize:11 }} onClick={onClose}>✕</button>
        </div>

        <div>
          <div style={sectionTitle}>Nombre</div>
          <input style={inputStyle} value={localName} onChange={e => setLocalName(e.target.value)} onMouseDown={stop} onClick={stop} />
        </div>

        <div>
          <div style={sectionTitle}>CONDICIONES (SI…)</div>
          <ConditionGroup node={condition} onUpdate={setCondition} depth={0} hubStore={hubStore} />
        </div>

        <div>
          <div style={sectionTitle}>ACCIONES (ENTONCES…)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {actions.map(a => {
              const { icon, text } = actionLabel(a);
              return (
                <div key={a.id} style={{ ...chipBase, justifyContent:'space-between' }}>
                  <span>{icon} {text}</span>
                  <button onClick={() => deleteAction(a.id)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>×</button>
                </div>
              );
            })}
            {addingAction ? (
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
                <AddActionFlow hubStore={hubStore} onAdd={addAction} onCancel={() => setAddingAction(false)} />
              </div>
            ) : (
              <button style={{ ...addBtn, width:'100%' }} onClick={() => setAddingAction(true)}>+ agregar acción</button>
            )}
          </div>
        </div>

        {/* ── Hubitat sync section ─────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Status badge */}
          <div style={{ fontSize: 11, color: config.hubitatSynced ? '#48bb78' : 'var(--text-dim)' }}>
            {config.hubitatSynced ? '● En Hubitat' : '○ Solo local'}
          </div>

          {/* Time condition warning */}
          {hasTimeConditions(condition) && (
            <div style={{ fontSize: 11, color: '#ed8936', background: 'rgba(237,137,54,0.12)', borderRadius: 6, padding: '5px 8px' }}>
              Esta regla tiene condiciones de hora. Esas condiciones solo se evaluarán mientras el dashboard esté abierto.
            </div>
          )}

          {/* Error */}
          {syncError && (
            <div style={{ fontSize: 11, color: '#fc8181', background: 'rgba(252,129,129,0.1)', borderRadius: 6, padding: '5px 8px' }}>
              {syncError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="w-btn"
              style={{ flex: 1 }}
              onMouseDown={stop}
              onClick={handleProbar}
            >
              Probar
            </button>
            <button
              className="w-btn"
              style={{ flex: 1, background: syncing ? undefined : 'rgba(72,187,120,0.15)', borderColor: '#48bb78' }}
              onMouseDown={stop}
              onClick={handleSaveToHubitat}
              disabled={syncing}
            >
              {syncing ? 'Guardando…' : 'Guardar en Hubitat'}
            </button>
          </div>

          <button className="w-btn" style={{ width: '100%' }} onMouseDown={stop} onClick={save}>
            Guardar local
          </button>
        </div>

        {/* ── Test modal ───────────────────────────────────────── */}
        {testing && createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ ...modalBox, width: '22rem', gap: '1rem' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>
                Probando: "{localName}"
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Activa manualmente las condiciones de la regla para verificar que las acciones se ejecuten correctamente.
                <br /><br />
                El motor local está escuchando.
              </div>
              <button className="w-btn" style={{ width: '100%' }} onClick={handleCerrarPrueba}>
                Cerrar prueba
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Widget faces ───────────────────────────────────────────────

export default function ReglaAutomatica({ size, config, onConfigChange }) {
  const { enabled = true, name = 'Mi regla', condition, conditionGroups, actions = [] } = config;
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));
  const col = enabled ? 'var(--icon-on)' : 'var(--text-dim)';
  const { setRuleEnabled } = useHub();

  const toggle = async (e) => {
    e?.stopPropagation();
    const newEnabled = !enabled;
    if (config.hubitatSynced && config.hubitatHubId && config.id) {
      try {
        await setRuleEnabled(config.id, newEnabled, config.hubitatHubId);
      } catch (err) {
        console.warn('[ReglaAutomatica] toggle sync failed:', err.message);
      }
    }
    onConfigChange({ ...config, enabled: newEnabled });
  };

  const allLeaves = condition
    ? collectLeaves(condition)
    : (conditionGroups ?? []).flatMap(g => g.conditions ?? []);

  const Modal = modal && (
    <ConfigModal
      config={config}
      onSave={c => { onConfigChange(c); setModal(false); }}
      onUpdateConfig={onConfigChange}
      onClose={() => setModal(false)}
    />
  );

  if (size === '1x2') return (
    <>
      <div className="w-body w-center" {...longPress}>
        {config.hubitatSynced && (
          <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, color: '#48bb78',
            background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)',
            borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: 0.5 }}>
            HUBITAT
          </div>
        )}
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={enabled} onToggle={toggle} /></div>
        <SvgIcon id="rule" size={44} color={col} className={enabled ? 'icon-glow' : ''} />
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>{name}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{enabled ? '● Activa' : '○ Pausada'}</div>
      </div>
      {Modal}
    </>
  );

  if (size === '2x1') return (
    <>
      <div className="w-row-body" style={{ position:'relative' }} {...longPress}>
        {config.hubitatSynced && (
          <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, color: '#48bb78',
            background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)',
            borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: 0.5 }}>
            HUBITAT
          </div>
        )}
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={enabled} onToggle={toggle} /></div>
        <SvgIcon id="rule" size={32} color={col} className={enabled ? 'icon-glow' : ''} />
        <div className="w-info" style={{ paddingRight:44 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
          <div style={{ fontSize:11, color:'var(--text-secondary)' }}>
            {allLeaves.length > 0 ? `${allLeaves.length} cond · ${actions.length} acc` : 'Sin configurar'}
          </div>
        </div>
      </div>
      {Modal}
    </>
  );

  return (
    <>
      <div className="w-body" {...longPress}>
        {config.hubitatSynced && (
          <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, color: '#48bb78',
            background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)',
            borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: 0.5 }}>
            HUBITAT
          </div>
        )}
        <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={enabled} onToggle={toggle} /></div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, paddingRight:44 }}>
          <SvgIcon id="rule" size={14} color={col} />
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
        </div>
        <div className="w-divider" />
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>SI</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1, overflow:'hidden' }}>
          {allLeaves.length === 0 && <span style={{ fontSize:11, color:'var(--text-dim)' }}>Sin condiciones</span>}
          {allLeaves.slice(0,3).map((c, i) => {
            const { icon, text } = conditionLabel(c);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:11 }}>{icon}</span>
                <span style={{ fontSize:11, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
              </div>
            );
          })}
          {allLeaves.length > 3 && <span style={{ fontSize:10, color:'var(--text-dim)' }}>+{allLeaves.length - 3} más</span>}
        </div>
        <div className="w-divider" />
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>ENTONCES</div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, overflow:'hidden' }}>
          {actions.length === 0 && <span style={{ fontSize:11, color:'var(--text-dim)' }}>Sin acciones</span>}
          {actions.slice(0,2).map((a, i) => {
            const { icon, text } = actionLabel(a);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:11 }}>{icon}</span>
                <span style={{ fontSize:11, color: enabled ? 'var(--icon-on)' : 'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
              </div>
            );
          })}
          {actions.length > 2 && <span style={{ fontSize:10, color:'var(--text-dim)' }}>+{actions.length - 2} más</span>}
        </div>
      </div>
      {Modal}
    </>
  );
}
