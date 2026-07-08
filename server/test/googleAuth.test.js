import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleCredential } from '../auth.js';

test('verifyGoogleCredential returns email on valid token', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'my-client-id', email: 'user@gmail.com', email_verified: 'true' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  try {
    const email = await verifyGoogleCredential('fake-jwt');
    assert.equal(email, 'user@gmail.com');
  } finally {
    globalThis.fetch = orig;
  }
});

test('verifyGoogleCredential returns null when aud does not match CLIENT_ID', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'other-app-client-id', email: 'user@gmail.com', email_verified: 'true' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  try {
    const email = await verifyGoogleCredential('fake-jwt');
    assert.equal(email, null);
  } finally {
    globalThis.fetch = orig;
  }
});

test('verifyGoogleCredential returns null when Google returns HTTP error', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false });
  try {
    const email = await verifyGoogleCredential('invalid-jwt');
    assert.equal(email, null);
  } finally {
    globalThis.fetch = orig;
  }
});

test('verifyGoogleCredential returns null when fetch throws', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network error'); };
  try {
    const email = await verifyGoogleCredential('any-jwt');
    assert.equal(email, null);
  } finally {
    globalThis.fetch = orig;
  }
});

test('verifyGoogleCredential returns null when email not verified', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ aud: 'my-client-id', email: 'user@gmail.com', email_verified: 'false' }),
  });
  process.env.GOOGLE_CLIENT_ID = 'my-client-id';
  try {
    const email = await verifyGoogleCredential('fake-jwt');
    assert.equal(email, null);
  } finally {
    globalThis.fetch = orig;
  }
});
