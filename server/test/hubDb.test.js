import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { initDB, saveHubs, getHubs } from '../db.js';

describe('hub db', () => {
  before(() => initDB(':memory:'));

  it('getHubs returns [] when empty', () => {
    assert.deepEqual(getHubs(), []);
  });

  it('saveHubs + getHubs round-trips data', () => {
    const hubs = [{ id: 'hub-1', name: 'Test', type: 'hubitat', ip: '192.168.1.1', appId: '1', token: 'tok', enabled: true }];
    saveHubs(JSON.stringify(hubs));
    assert.deepEqual(getHubs(), hubs);
  });

  it('saveHubs overwrites previous value', () => {
    const hubs2 = [{ id: 'hub-2', name: 'Second', type: 'homeassistant', ip: '192.168.1.2', token: 'tok2', enabled: true }];
    saveHubs(JSON.stringify(hubs2));
    assert.deepEqual(getHubs(), hubs2);
  });
});
