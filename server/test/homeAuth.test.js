import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken, homeMiddleware } from '../auth.js';

describe('generateToken', () => {
  it('includes isAdmin, email, homeId in payload', () => {
    const token = generateToken({ isAdmin: true, email: null, homeId: null });
    const payload = verifyToken(token);
    assert.equal(payload.isAdmin, true);
    assert.equal(payload.email, null);
    assert.equal(payload.homeId, null);
  });

  it('stores email and homeId for Google user', () => {
    const token = generateToken({ isAdmin: false, email: 'u@test.com', homeId: 'home-1' });
    const payload = verifyToken(token);
    assert.equal(payload.isAdmin, false);
    assert.equal(payload.email, 'u@test.com');
    assert.equal(payload.homeId, 'home-1');
  });

  it('defaults to isAdmin=false, email=null, homeId=null when called with no args', () => {
    const token = generateToken();
    const payload = verifyToken(token);
    assert.equal(payload.isAdmin, false);
    assert.equal(payload.email, null);
    assert.equal(payload.homeId, null);
  });
});

describe('homeMiddleware', () => {
  const makeReq = (session) => ({ session });
  const makeRes = () => {
    const res = {};
    res.status = (code) => { res._code = code; return res; };
    res.json = (body) => { res._body = body; };
    return res;
  };

  it('passes when homeId is set', () => {
    const req = makeReq({ isAdmin: false, email: 'u@test.com', homeId: 'home-1' });
    const res = makeRes();
    let called = false;
    homeMiddleware(req, res, () => { called = true; });
    assert.ok(called);
  });

  it('returns 403 when homeId is null', () => {
    const req = makeReq({ isAdmin: false, email: 'u@test.com', homeId: null });
    const res = makeRes();
    let nextCalled = false;
    homeMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(res._code, 403);
    assert.ok(!nextCalled);
  });

  it('passes for admin even without homeId', () => {
    const req = makeReq({ isAdmin: true, email: null, homeId: null });
    const res = makeRes();
    let called = false;
    homeMiddleware(req, res, () => { called = true; });
    assert.ok(called);
  });
});
