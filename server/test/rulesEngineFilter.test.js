import { test } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the filter logic from rulesEngine (extracted for testability)
function filterRules(widgets) {
  return widgets.filter(
    w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
  );
}

test('includes local (non-synced) rule', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: false } }];
  assert.equal(filterRules(widgets).length, 1);
});

test('excludes synced rule', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: true } }];
  assert.equal(filterRules(widgets).length, 0);
});

test('includes synced rule in _testing mode', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: true, _testing: true } }];
  assert.equal(filterRules(widgets).length, 1);
});

test('ignores non-regla-auto widgets', () => {
  const widgets = [
    { type: 'lampara-simple', config: {} },
    { type: 'regla-auto', config: { hubitatSynced: false } },
  ];
  assert.equal(filterRules(widgets).length, 1);
});

test('includes rule with no hubitatSynced flag (legacy local rules)', () => {
  const widgets = [{ type: 'regla-auto', config: {} }];
  assert.equal(filterRules(widgets).length, 1);
});
