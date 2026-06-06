import { useDashboard } from '../../store/dashboardStore';
import { WIDGET_ICON_META } from './widgetIconMeta';

export function useWidgetIcons(typeId, instanceIcons = {}) {
  const { state } = useDashboard();
  const meta = WIDGET_ICON_META[typeId] || { states: ['default'], defaults: { default: 'home' } };
  const global = state.globalIcons?.[typeId] || {};
  return Object.fromEntries(
    meta.states.map(s => [s, instanceIcons?.[s] ?? global[s] ?? meta.defaults[s]])
  );
}
