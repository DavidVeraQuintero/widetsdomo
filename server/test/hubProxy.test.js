import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const PRIVATE_IP_RE = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|::1|localhost)$/;

describe('hubProxy IP validation', () => {
  it('allows 192.168.x.x', () => assert.ok(PRIVATE_IP_RE.test('192.168.11.15')));
  it('allows 10.x.x.x',    () => assert.ok(PRIVATE_IP_RE.test('10.0.0.1')));
  it('allows 127.x.x.x',   () => assert.ok(PRIVATE_IP_RE.test('127.0.0.1')));
  it('allows localhost',    () => assert.ok(PRIVATE_IP_RE.test('localhost')));
  it('allows 172.16.x.x',  () => assert.ok(PRIVATE_IP_RE.test('172.16.0.1')));
  it('blocks 8.8.8.8',     () => assert.ok(!PRIVATE_IP_RE.test('8.8.8.8')));
  it('blocks example.com', () => assert.ok(!PRIVATE_IP_RE.test('example.com')));
});
