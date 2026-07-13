import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDB,
  createHome,
  deleteHome,
  listHomes,
  getHome,
  addHomeMember,
  removeHomeMember,
  listHomeMembers,
  getHomesByEmail,
} from '../db.js';

// Use in-memory SQLite — no DATABASE_URL set
before(async () => {
  await initDB();
});

describe('createHome', () => {
  test('returns id, name, created_at', async () => {
    const home = await createHome('My House');
    assert.ok(typeof home.id === 'string' && home.id.length > 0, 'id should be a non-empty string');
    assert.equal(home.name, 'My House');
    assert.ok(typeof home.created_at === 'number' || typeof home.created_at === 'string', 'created_at should exist');
    await deleteHome(home.id);
  });
});

describe('listHomes', () => {
  test('returns created homes', async () => {
    const home1 = await createHome('Home A');
    const home2 = await createHome('Home B');
    const homes = await listHomes();
    const ids = homes.map(h => h.id);
    assert.ok(ids.includes(home1.id), 'should include home1');
    assert.ok(ids.includes(home2.id), 'should include home2');
    await deleteHome(home1.id);
    await deleteHome(home2.id);
  });
});

describe('getHome', () => {
  test('finds home by id', async () => {
    const created = await createHome('Test Home');
    const found = await getHome(created.id);
    assert.ok(found !== null, 'should find the home');
    assert.equal(found.id, created.id);
    assert.equal(found.name, 'Test Home');
    await deleteHome(created.id);
  });

  test('returns null for unknown id', async () => {
    const result = await getHome('non-existent-id-12345');
    assert.equal(result, null);
  });
});

describe('deleteHome', () => {
  test('removes from list', async () => {
    const home = await createHome('To Delete');
    const before = await listHomes();
    assert.ok(before.map(h => h.id).includes(home.id));

    await deleteHome(home.id);

    const after = await listHomes();
    assert.ok(!after.map(h => h.id).includes(home.id), 'home should be removed');
  });

  test('cascades: no error when home had members', async () => {
    const home = await createHome('With Members');
    await addHomeMember(home.id, 'user@example.com');
    await addHomeMember(home.id, 'user2@example.com');
    // Should not throw
    await deleteHome(home.id);
    const found = await getHome(home.id);
    assert.equal(found, null, 'home should be gone after delete');
  });
});

describe('addHomeMember + listHomeMembers', () => {
  test('adds member and lists them', async () => {
    const home = await createHome('Member Test');
    await addHomeMember(home.id, 'alice@example.com');
    await addHomeMember(home.id, 'bob@example.com');
    const members = await listHomeMembers(home.id);
    assert.ok(members.includes('alice@example.com'), 'should include alice');
    assert.ok(members.includes('bob@example.com'), 'should include bob');
    await deleteHome(home.id);
  });

  test('normalizes email to lowercase', async () => {
    const home = await createHome('Case Test');
    await addHomeMember(home.id, 'UPPER@EXAMPLE.COM');
    const members = await listHomeMembers(home.id);
    assert.ok(members.includes('upper@example.com'), 'email should be lowercased');
    await deleteHome(home.id);
  });

  test('ignores duplicate members', async () => {
    const home = await createHome('Dup Test');
    await addHomeMember(home.id, 'dup@example.com');
    await addHomeMember(home.id, 'dup@example.com'); // duplicate
    const members = await listHomeMembers(home.id);
    assert.equal(members.filter(e => e === 'dup@example.com').length, 1, 'should not have duplicates');
    await deleteHome(home.id);
  });
});

describe('removeHomeMember', () => {
  test('removes email from home', async () => {
    const home = await createHome('Remove Test');
    await addHomeMember(home.id, 'remove@example.com');
    await addHomeMember(home.id, 'keep@example.com');
    await removeHomeMember(home.id, 'remove@example.com');
    const members = await listHomeMembers(home.id);
    assert.ok(!members.includes('remove@example.com'), 'removed email should not be in list');
    assert.ok(members.includes('keep@example.com'), 'kept email should still be in list');
    await deleteHome(home.id);
  });
});

describe('getHomesByEmail', () => {
  test('returns homes for a given email', async () => {
    const home1 = await createHome('Email Home 1');
    const home2 = await createHome('Email Home 2');
    const home3 = await createHome('Other Home');
    await addHomeMember(home1.id, 'shared@example.com');
    await addHomeMember(home2.id, 'shared@example.com');
    await addHomeMember(home3.id, 'other@example.com');

    const homes = await getHomesByEmail('shared@example.com');
    const ids = homes.map(h => h.id);
    assert.ok(ids.includes(home1.id), 'should include home1');
    assert.ok(ids.includes(home2.id), 'should include home2');
    assert.ok(!ids.includes(home3.id), 'should not include home3');

    await deleteHome(home1.id);
    await deleteHome(home2.id);
    await deleteHome(home3.id);
  });

  test('returns empty array when email has no homes', async () => {
    const homes = await getHomesByEmail('nobody@example.com');
    assert.deepEqual(homes, []);
  });
});
