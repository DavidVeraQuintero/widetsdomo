import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleCredential } from '../auth.js';

test('verifyGoogleCredential returns email on valid token', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'my-client-id', email: 'user@gmail.com' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  const email = await verifyGoogleCredential('fake-jwt');
  assert.equal(email, 'user@gmail.com');
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when aud does not match CLIENT_ID', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'other-app-client-id', email: 'user@gmail.com' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  const email = await verifyGoogleCredential('fake-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when Google returns HTTP error', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false });
  const email = await verifyGoogleCredential('invalid-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});

test('verifyGoogleCredential returns null when fetch throws', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network error'); };
  const email = await verifyGoogleCredential('any-jwt');
  assert.equal(email, null);
  globalThis.fetch = orig;
});
