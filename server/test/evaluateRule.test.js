import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCondition, evaluateGroup, evaluateRule } from '../../src/rules/evaluateRule.js';

const NOW = new Date('2026-01-01T20:30:00'); // 20:30

// ── evaluateCondition ──────────────────────────────────────────
test('device eq: coincide', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { contact: 'open' } }, NOW), true);
});

test('device eq: no coincide', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { contact: 'closed' } }, NOW), false);
});

test('device: dispositivo ausente en states → false', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' };
  assert.equal(evaluateCondition(cond, {}, NOW), false);
});

test('device gte: power 5 >= 1 → true', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'power', operator: 'gte', value: '1' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { power: '5' } }, NOW), true);
});

test('device gte: power 5 >= 10 → false', () => {
  const cond = { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'power', operator: 'gte', value: '10' };
  assert.equal(evaluateCondition(cond, { 'h1:d1': { power: '5' } }, NOW), false);
});

test('time eq: 20:30 = 20:30 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'eq', value: '20:30' }, {}, NOW), true);
});

test('time eq: 20:30 = 20:00 → false', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'eq', value: '20:00' }, {}, NOW), false);
});

test('time gte: 20:30 >= 20:00 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'gte', value: '20:00' }, {}, NOW), true);
});

test('time gte: 20:30 >= 21:00 → false', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'gte', value: '21:00' }, {}, NOW), false);
});

test('time lte: 20:30 <= 21:00 → true', () => {
  assert.equal(evaluateCondition({ type: 'time', operator: 'lte', value: '21:00' }, {}, NOW), true);
});

// ── evaluateGroup ──────────────────────────────────────────────
test('group OR: una coincide → true', () => {
  const group = {
    operator: 'OR',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'open' } }, NOW), true);
});

test('group OR: ninguna coincide → false', () => {
  const group = {
    operator: 'OR',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'closed' } }, NOW), false);
});

test('group AND: todas coinciden → true', () => {
  const group = {
    operator: 'AND',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'time', operator: 'gte', value: '20:00' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'open' } }, NOW), true);
});

test('group AND: una falla → false', () => {
  const group = {
    operator: 'AND',
    conditions: [
      { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
      { type: 'time', operator: 'gte', value: '21:00' },
    ],
  };
  assert.equal(evaluateGroup(group, { 'h1:d1': { contact: 'open' } }, NOW), false);
});

test('group: conditions vacías → false', () => {
  assert.equal(evaluateGroup({ operator: 'AND', conditions: [] }, {}, NOW), false);
});

// ── evaluateRule ───────────────────────────────────────────────
test('rule disabled → false', () => {
  const rule = {
    enabled: false,
    conditionGroups: [{ operator: 'AND', conditions: [{ type: 'time', operator: 'gte', value: '20:00' }] }],
    actions: [],
  };
  assert.equal(evaluateRule(rule, {}, NOW), false);
});

test('rule sin grupos → false', () => {
  assert.equal(evaluateRule({ enabled: true, conditionGroups: [], actions: [] }, {}, NOW), false);
});

test('(puerta1 OR puerta2) AND hora>=20: ambas condiciones match → true', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      {
        operator: 'OR',
        conditions: [
          { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
          { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
        ],
      },
      {
        operator: 'AND',
        conditions: [{ type: 'time', operator: 'gte', value: '20:00' }],
      },
    ],
    actions: [],
  };
  const states = { 'h1:d1': { contact: 'closed' }, 'h1:d2': { contact: 'open' } };
  assert.equal(evaluateRule(rule, states, NOW), true);
});

test('(puerta1 OR puerta2) AND hora>=21: tiempo falla → false', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      {
        operator: 'OR',
        conditions: [
          { type: 'device', hubId: 'h1', deviceId: 'd1', attribute: 'contact', operator: 'eq', value: 'open' },
          { type: 'device', hubId: 'h1', deviceId: 'd2', attribute: 'contact', operator: 'eq', value: 'open' },
        ],
      },
      {
        operator: 'AND',
        conditions: [{ type: 'time', operator: 'gte', value: '21:00' }],
      },
    ],
    actions: [],
  };
  const states = { 'h1:d2': { contact: 'open' } };
  assert.equal(evaluateRule(rule, states, NOW), false);
});

test('solo tiempo: a las 20:30 → true', () => {
  const rule = {
    enabled: true,
    conditionGroups: [
      { operator: 'AND', conditions: [{ type: 'time', operator: 'eq', value: '20:30' }] },
    ],
    actions: [],
  };
  assert.equal(evaluateRule(rule, {}, NOW), true);
});
