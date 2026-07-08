// src/rules/rulesEngine.js
import { useEffect, useRef } from 'react';
import { useDashboard } from '../store/dashboardStore.jsx';
import { useHub } from '../store/hubStore.jsx';
import { evaluateRule } from './evaluateRule.js';

function hasTimeNode(node) {
  if (!node) return false;
  if (node.type === 'time') return true;
  if (node.type === 'group') return (node.children ?? []).some(hasTimeNode);
  return false;
}

function ruleHasTime(widget) {
  const cfg = widget.config;
  if (cfg.condition) return hasTimeNode(cfg.condition);
  return (cfg.conditionGroups ?? []).some(g => g.conditions.some(c => c.type === 'time'));
}

export default function RulesEngine() {
  const { state } = useDashboard();
  const { deviceStates, sendCommand } = useHub();
  const lastResults = useRef({});

  const runAll = (states, now) => {
    const rules = state.widgets.filter(
      w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
    );
    for (const widget of rules) {
      const result = evaluateRule(widget.config, states, now);
      const prev = lastResults.current[widget.id] ?? false;
      if (result && !prev) {
        for (const action of (widget.config.actions ?? [])) {
          sendCommand(action.hubId, action.deviceId, action.command, action.arg ?? undefined);
        }
      }
      lastResults.current[widget.id] = result;
    }
  };

  useEffect(() => {
    runAll(deviceStates, new Date());
  }, [deviceStates]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const rules = state.widgets.filter(
      w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
    );
    if (!rules.some(ruleHasTime)) return;
    const id = setInterval(() => runAll(deviceStates, new Date()), 60_000);
    return () => clearInterval(id);
  }, [state.widgets, deviceStates]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
