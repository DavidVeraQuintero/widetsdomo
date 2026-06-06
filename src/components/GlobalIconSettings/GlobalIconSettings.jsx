import { useState } from 'react';
import { useDashboard } from '../../store/dashboardStore';
import { WIDGET_CATALOG } from '../../catalog/widgetCatalog';
import { WIDGET_ICON_META } from '../widgets/widgetIconMeta';
import SvgIcon from '../widgets/SvgIcon';
import IconPicker from '../widgets/IconPicker';

export default function GlobalIconSettings() {
  const { state, dispatch } = useDashboard();
  const [picker, setPicker] = useState(null);

  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];

  const getIcon = (typeId, stateKey) => {
    return state.globalIcons?.[typeId]?.[stateKey]
      ?? WIDGET_ICON_META[typeId]?.defaults?.[stateKey]
      ?? 'home';
  };

  const setIcon = (typeId, stateKey, iconId) => {
    const current = state.globalIcons?.[typeId] || {};
    dispatch({ type: 'SET_GLOBAL_ICON', widgetTypeId: typeId, icons: { ...current, [stateKey]: iconId } });
  };

  const resetType = (typeId) => {
    dispatch({ type: 'RESET_GLOBAL_ICON', widgetTypeId: typeId });
  };

  return (
    <div style={{ padding: '10px 12px' }}>
      {categories.map(cat => {
        const items = WIDGET_CATALOG.filter(w => w.category === cat && WIDGET_ICON_META[w.id]);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
            {items.map(def => {
              const meta = WIDGET_ICON_META[def.id];
              if (!meta) return null;
              const hasOverride = !!state.globalIcons?.[def.id];
              return (
                <div key={def.id} style={{ marginBottom: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 9px', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: meta.states.length > 1 ? 5 : 0 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.80)' }}>{def.name}</span>
                    {hasOverride && (
                      <button className="w-btn" style={{ fontSize: 9, padding: '1px 6px', borderColor: '#ef4444', color: '#ef4444' }}
                        onClick={() => resetType(def.id)}>
                        Restablecer
                      </button>
                    )}
                  </div>
                  {meta.states.map(stateKey => (
                    <div key={stateKey} style={{ padding: '3px 0' }}>
                      {meta.states.length > 1 && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', marginBottom: 3 }}>
                          {meta.labels[stateKey]}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <SvgIcon id={getIcon(def.id, stateKey)} size={13} color="rgba(255,255,255,0.70)" />
                        </div>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getIcon(def.id, stateKey)}
                        </span>
                        <button className="w-btn" style={{ fontSize: 9, padding: '2px 7px', flexShrink: 0 }}
                          onClick={() => setPicker({ typeId: def.id, stateKey })}>
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {picker && (
        <IconPicker
          currentId={getIcon(picker.typeId, picker.stateKey)}
          onChange={id => setIcon(picker.typeId, picker.stateKey, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
