function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function compareValues(actual, operator, expected) {
  switch (operator) {
    case 'eq':  return String(actual) === String(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    default:    return false;
  }
}

export function evaluateCondition(condition, deviceStates, now) {
  if (condition.type === 'time') {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = timeToMinutes(condition.value);
    return compareValues(nowMins, condition.operator, targetMins);
  }
  const key = `${condition.hubId}:${condition.deviceId}`;
  const state = deviceStates[key];
  if (!state) return false;
  const actual = state[condition.attribute];
  if (actual === undefined || actual === null) return false;
  return compareValues(actual, condition.operator, condition.value);
}

export function evaluateNode(node, deviceStates, now) {
  if (!node) return false;
  if (node.type === 'group') {
    if (!node.children?.length) return false;
    // Evalúa de izquierda a derecha usando joinOp por hijo (nuevo modelo)
    // con fallback al operator del grupo (modelo anterior) para compat
    let result = evaluateNode(node.children[0], deviceStates, now);
    for (let i = 1; i < node.children.length; i++) {
      const child = node.children[i];
      const op = child.joinOp ?? node.operator ?? 'AND';
      const val = evaluateNode(child, deviceStates, now);
      result = op === 'OR' ? (result || val) : (result && val);
    }
    return result;
  }
  return evaluateCondition(node, deviceStates, now);
}

// Keep evaluateGroup for backward compat with tests
export function evaluateGroup(group, deviceStates, now) {
  if (!group.conditions?.length) return false;
  if (group.operator === 'OR') return group.conditions.some(c => evaluateCondition(c, deviceStates, now));
  return group.conditions.every(c => evaluateCondition(c, deviceStates, now));
}

export function evaluateRule(rule, deviceStates, now = new Date()) {
  if (!rule.enabled) return false;
  if (rule.condition) return evaluateNode(rule.condition, deviceStates, now);
  if (!rule.conditionGroups?.length) return false;
  return rule.conditionGroups.every(g => evaluateGroup(g, deviceStates, now));
}
