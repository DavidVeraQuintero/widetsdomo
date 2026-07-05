import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDB, getAllState,
  saveDashboard, getDashboard,
  getMeta, saveMeta,
  addImage, removeImage, getImages,
} from '../db.js';

test('initDB creates tables without error', () => {
  initDB(':memory:');
});

test('saveDashboard and getDashboard round-trip', () => {
  initDB(':memory:');
  const state = { widgets: [{ id: 'w1' }], theme: { room: 'sala' } };
  saveDashboard('db-1', 'Home', JSON.stringify(state));
  const row = getDashboard('db-1');
  assert.equal(row.name, 'Home');
  assert.deepEqual(JSON.parse(row.state_json), state);
});

test('getMeta returns null before first save', () => {
  initDB(':memory:');
  assert.equal(getMeta(), null);
});

test('saveMeta and getMeta round-trip', () => {
  initDB(':memory:');
  const meta = { dashboards: [{ id: 'db-1', name: 'Home' }], activeDashboardId: 'db-1' };
  saveMeta(JSON.stringify(meta));
  const result = getMeta();
  assert.deepEqual(JSON.parse(result.value), meta);
});

test('addImage and getImages', () => {
  initDB(':memory:');
  addImage('img-1', 'photo.jpg');
  const images = getImages();
  assert.equal(images.length, 1);
  assert.equal(images[0].id, 'img-1');
  assert.equal(images[0].filename, 'photo.jpg');
});

test('removeImage deletes the row', () => {
  initDB(':memory:');
  addImage('img-1', 'photo.jpg');
  removeImage('img-1');
  assert.equal(getImages().length, 0);
});

test('getAllState returns combined state', () => {
  initDB(':memory:');
  saveDashboard('db-1', 'Home', JSON.stringify({ widgets: [] }));
  saveMeta(JSON.stringify({ activeDashboardId: 'db-1' }));
  addImage('img-1', 'x.jpg');
  const result = getAllState();
  assert.equal(result.dashboards.length, 1);
  assert.ok(result.meta);
  assert.equal(result.images.length, 1);
});
