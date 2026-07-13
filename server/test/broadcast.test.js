import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addClient, removeClient, broadcast } from '../broadcast.js';

function makeFakeWs(readyState = 1) {
  const messages = [];
  return { readyState, send: (msg) => messages.push(msg), _messages: messages };
}

test('broadcast sends to all open clients except sender', () => {
  const ws1 = makeFakeWs(1); // OPEN
  const ws2 = makeFakeWs(1);
  const ws3 = makeFakeWs(3); // CLOSED

  addClient(ws1, 'home-1');
  addClient(ws2, 'home-1');
  addClient(ws3, 'home-1');

  const payload = { type: 'PATCH_DASHBOARD', ts: 1 };
  broadcast(payload, null, ws1);

  assert.equal(ws1._messages.length, 0); // sender excluded
  assert.equal(ws2._messages.length, 1);
  assert.deepEqual(JSON.parse(ws2._messages[0]), payload);
  assert.equal(ws3._messages.length, 0); // closed, skipped

  removeClient(ws1);
  removeClient(ws2);
  removeClient(ws3);
});

test('removeClient stops receiving broadcasts', () => {
  const ws = makeFakeWs(1);
  addClient(ws, 'home-1');
  removeClient(ws);
  broadcast({ type: 'TEST' }, null, null);
  assert.equal(ws._messages.length, 0);
});
