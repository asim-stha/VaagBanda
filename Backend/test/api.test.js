const assert = require('node:assert/strict');
const test = require('node:test');
const { createServer } = require('../src/server');
const { resetDb } = require('../src/store');

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

test('groups and group detail return seeded expense data', async (t) => {
  resetDb();
  const server = createServer();
  const port = await listen(server);
  t.after(() => server.close());

  const groupsResponse = await fetch(`http://localhost:${port}/groups`);
  assert.equal(groupsResponse.status, 200);
  const groups = await groupsResponse.json();
  assert.equal(groups.data[0].id, 'g1');
  assert.equal(groups.data[0].memberCount, 5);

  const detailResponse = await fetch(`http://localhost:${port}/groups/g1`);
  const detail = await detailResponse.json();
  assert.equal(detail.data.name, 'Pokhara Trip');
  assert.equal(detail.data.expenses.length, 5);
});

test('adding expense validates split totals and updates group detail', async (t) => {
  resetDb();
  const server = createServer();
  const port = await listen(server);
  t.after(() => server.close());

  const badResponse = await fetch(`http://localhost:${port}/groups/g1/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Bad split',
      amount: 100,
      paidBy: 'u1',
      participants: ['u1', 'u2'],
      shares: { u1: 30, u2: 30 },
    }),
  });
  assert.equal(badResponse.status, 400);

  const goodResponse = await fetch(`http://localhost:${port}/groups/g1/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Snacks',
      amount: 100,
      paidBy: 'u1',
      participants: ['u1', 'u2'],
      shares: { u1: 50, u2: 50 },
      category: 'food',
    }),
  });
  assert.equal(goodResponse.status, 201);
  const body = await goodResponse.json();
  assert.equal(body.data.expenses[0].description, 'Snacks');
});
