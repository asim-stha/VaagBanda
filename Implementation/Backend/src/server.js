const http = require('node:http');
const { URL } = require('node:url');
const { createId, readDb, resetDb, writeDb } = require('./store');
const { creditorsForUser, groupDetail, groupSummary, publicUser, round2 } = require('./domain');

const PORT = Number(process.env.PORT || 4000);
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'u1';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    const error = new Error(`Missing required field(s): ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function currentUserId(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer user:')) return auth.slice('Bearer user:'.length);
  return req.headers['x-user-id'] || DEFAULT_USER_ID;
}

function ensureMember(db, groupId, userId) {
  const group = db.groups.find((item) => item.id === groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.status = 404;
    throw error;
  }
  if (!group.memberIds.includes(userId)) {
    const error = new Error('User is not a member of this group');
    error.status = 403;
    throw error;
  }
  return group;
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const db = readDb();
  const userId = currentUserId(req);

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { ok: true, service: 'vaagbanda-backend' });
  }

  if (req.method === 'POST' && path === '/dev/reset') {
    return json(res, 200, { data: resetDb() });
  }

  if (req.method === 'POST' && path === '/auth/signup') {
    const body = await readJsonBody(req);
    requireFields(body, ['name', 'email', 'password']);
    const email = String(body.email).trim().toLowerCase();
    if (db.users.some((user) => user.email === email)) {
      return json(res, 409, { error: 'Email is already registered' });
    }
    const user = {
      id: createId('u'),
      name: String(body.name).trim(),
      email,
      password: String(body.password),
      avatarColor: body.avatarColor || '#DC143C',
    };
    db.users.push(user);
    writeDb(db);
    return json(res, 201, { token: `user:${user.id}`, user: publicUser(user) });
  }

  if (req.method === 'POST' && path === '/auth/login') {
    const body = await readJsonBody(req);
    requireFields(body, ['email', 'password']);
    const user = db.users.find((item) => item.email === String(body.email).trim().toLowerCase());
    if (!user || user.password !== String(body.password)) {
      return json(res, 401, { error: 'Invalid email or password' });
    }
    return json(res, 200, { token: `user:${user.id}`, user: publicUser(user) });
  }

  if (req.method === 'POST' && path === '/auth/forgot-password') {
    const body = await readJsonBody(req);
    requireFields(body, ['email']);
    db.passwordResetRequests.push({
      id: createId('reset'),
      email: String(body.email).trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
    return json(res, 202, { message: 'Password reset request recorded' });
  }

  if (req.method === 'GET' && path === '/me') {
    const user = db.users.find((item) => item.id === userId);
    return user ? json(res, 200, { data: publicUser(user) }) : json(res, 404, { error: 'User not found' });
  }

  if (req.method === 'GET' && path === '/groups') {
    const groups = db.groups
      .filter((group) => group.memberIds.includes(userId))
      .map((group) => groupSummary(db, group, userId));
    return json(res, 200, { data: groups });
  }

  if (req.method === 'POST' && path === '/groups') {
    const body = await readJsonBody(req);
    requireFields(body, ['name']);
    const memberIds = Array.from(new Set([userId, ...(body.memberIds || [])]));
    const group = {
      id: createId('g'),
      name: String(body.name).trim(),
      emoji: body.emoji || '👥',
      currency: body.currency || 'NPR',
      createdBy: userId,
      memberIds,
      createdAt: new Date().toISOString(),
    };
    db.groups.push(group);
    writeDb(db);
    return json(res, 201, { data: groupSummary(db, group, userId) });
  }

  const groupMatch = path.match(/^\/groups\/([^/]+)$/);
  if (req.method === 'GET' && groupMatch) {
    ensureMember(db, groupMatch[1], userId);
    return json(res, 200, { data: groupDetail(db, groupMatch[1], userId) });
  }

  const groupExpensesMatch = path.match(/^\/groups\/([^/]+)\/expenses$/);
  if (req.method === 'POST' && groupExpensesMatch) {
    const group = ensureMember(db, groupExpensesMatch[1], userId);
    const body = await readJsonBody(req);
    requireFields(body, ['description', 'amount', 'paidBy', 'participants']);
    const amount = round2(body.amount);
    const participantIds = body.participants;
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return json(res, 400, { error: 'participants must be a non-empty array' });
    }
    const shares = body.shares || Object.fromEntries(participantIds.map((id) => [id, round2(amount / participantIds.length)]));
    const shareTotal = round2(Object.values(shares).reduce((sum, value) => sum + Number(value), 0));
    if (Math.abs(shareTotal - amount) > 0.01) {
      return json(res, 400, { error: 'Expense shares must add up to the expense amount' });
    }
    const unknownMember = [body.paidBy, ...participantIds].find((id) => !group.memberIds.includes(id));
    if (unknownMember) {
      return json(res, 400, { error: `User ${unknownMember} is not a group member` });
    }
    const expense = {
      id: createId('e'),
      groupId: group.id,
      description: String(body.description).trim(),
      amount,
      paidBy: body.paidBy,
      category: body.category || 'other',
      participantIds,
      shares,
      createdAt: new Date().toISOString(),
    };
    db.expenses.push(expense);
    writeDb(db);
    return json(res, 201, { data: groupDetail(db, group.id, userId) });
  }

  const creditorsMatch = path.match(/^\/groups\/([^/]+)\/creditors$/);
  if (req.method === 'GET' && creditorsMatch) {
    ensureMember(db, creditorsMatch[1], userId);
    return json(res, 200, { data: creditorsForUser(db, creditorsMatch[1], userId) });
  }

  const settlementsMatch = path.match(/^\/groups\/([^/]+)\/settlements$/);
  if (req.method === 'POST' && settlementsMatch) {
    const group = ensureMember(db, settlementsMatch[1], userId);
    const body = await readJsonBody(req);
    requireFields(body, ['payeeId', 'amount']);
    if (!group.memberIds.includes(body.payeeId)) {
      return json(res, 400, { error: 'Payee is not a group member' });
    }
    const settlement = {
      id: createId('s'),
      groupId: group.id,
      payerId: userId,
      payeeId: body.payeeId,
      amount: round2(body.amount),
      method: body.method || 'cash',
      note: body.note || '',
      createdAt: new Date().toISOString(),
    };
    if (settlement.amount <= 0) {
      return json(res, 400, { error: 'Settlement amount must be greater than zero' });
    }
    db.settlements.push(settlement);
    writeDb(db);
    return json(res, 201, { data: settlement, group: groupDetail(db, group.id, userId) });
  }

  return json(res, 404, { error: 'Route not found' });
}

function createServer() {
  return http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      json(res, error.status || 500, { error: error.message || 'Internal server error' });
    });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`VaagBanda backend listening on http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
