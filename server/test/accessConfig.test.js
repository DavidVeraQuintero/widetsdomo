import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { initDB, getAccessConfig, setAccessConfig } from '../db.js';

test('getAccessConfig returns correct structure', async () => {
  await initDB();
  // Note: puede haber datos de corridas previas; sólo verificamos la estructura
  const config = await getAccessConfig();
  assert.ok(typeof config.houseName === 'string');
  assert.ok(Array.isArray(config.allowedEmails));
});

test('setAccessConfig and getAccessConfig round-trip', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Test House', allowedEmails: ['a@test.com', 'b@test.com'] });
  const config = await getAccessConfig();
  assert.equal(config.houseName, 'Test House');
  assert.deepEqual(config.allowedEmails, ['a@test.com', 'b@test.com']);
});

test('setAccessConfig overwrites previous values', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Casa 1', allowedEmails: ['x@x.com'] });
  await setAccessConfig({ houseName: 'Casa 2', allowedEmails: ['y@y.com'] });
  const config = await getAccessConfig();
  assert.equal(config.houseName, 'Casa 2');
  assert.deepEqual(config.allowedEmails, ['y@y.com']);
});

test('setAccessConfig handles empty emails array', async () => {
  await initDB();
  await setAccessConfig({ houseName: 'Sin emails', allowedEmails: [] });
  const config = await getAccessConfig();
  assert.deepEqual(config.allowedEmails, []);
});

after(async () => {
  await initDB();
  // Clean up test keys from the real DB so tests are repeatable
  await setAccessConfig({ houseName: '', allowedEmails: [] });
});
