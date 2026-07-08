import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// ── Mock fetch before importing hubClient ──────────────────────

let lastFetchArgs = null;

global.fetch = async (url, opts) => {
  lastFetchArgs = { url, opts };
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  };
};

// Mock window for browser env check
global.window = { __hubLanReachable: false };

const { syncRuleToHubitat, setRuleEnabledOnHubitat, deleteRuleFromHubitat } =
  await import('../../src/services/hubClient.js');

const HUB = {
  type: 'hubitat',
  ip: '192.168.1.10',
  autoAppId: '47',
  autoToken: 'test-token-abc',
  cloudUrl: null,
};

const RULE = {
  id: 'widget-1',
  name: 'Test',
  enabled: true,
  condition: { id: 'root', type: 'group', children: [] },
  actions: [],
};

// ── syncRuleToHubitat ──────────────────────────────────────────

test('syncRuleToHubitat: calls proxy with POST to /rules', async () => {
  await syncRuleToHubitat(HUB, RULE);
  assert.ok(lastFetchArgs, 'fetch was called');
  assert.equal(lastFetchArgs.opts.method, 'POST');
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules?access_token=test-token-abc`);
  const sentRule = JSON.parse(body.body ?? '{}');
  assert.equal(sentRule.id, 'widget-1');
});

// ── setRuleEnabledOnHubitat ────────────────────────────────────

test('setRuleEnabledOnHubitat: calls PUT to /rules/:id/enable', async () => {
  await setRuleEnabledOnHubitat(HUB, 'widget-1', false);
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules/widget-1/enable?access_token=test-token-abc`);
  assert.equal(body.method, 'PUT');
  const sent = JSON.parse(body.body ?? '{}');
  assert.equal(sent.enabled, false);
});

// ── deleteRuleFromHubitat ──────────────────────────────────────

test('deleteRuleFromHubitat: calls DELETE to /rules/:id', async () => {
  await deleteRuleFromHubitat(HUB, 'widget-1');
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules/widget-1?access_token=test-token-abc`);
  assert.equal(body.method, 'DELETE');
});

test('syncRuleToHubitat: throws if hub has no autoAppId', async () => {
  const hubNoApp = { ...HUB, autoAppId: null };
  await assert.rejects(
    () => syncRuleToHubitat(hubNoApp, RULE),
    /autoAppId/
  );
});

test('syncRuleToHubitat: throws on HTTP 403 response', async () => {
  global.fetch = async () => ({ ok: false, status: 403, json: async () => ({}) });
  await assert.rejects(() => syncRuleToHubitat(HUB, RULE), /AutoApp HTTP 403/);
  // restore
  global.fetch = async (url, opts) => {
    lastFetchArgs = { url, opts };
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };
});

test('syncRuleToHubitat: throws if hub has no autoToken', async () => {
  const hubNoToken = { ...HUB, autoToken: null };
  await assert.rejects(
    () => syncRuleToHubitat(hubNoToken, RULE),
    /autoToken/
  );
});
