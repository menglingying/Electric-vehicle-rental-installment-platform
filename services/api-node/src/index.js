import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  })
);

const FIXED_CODE_ENABLED = true;
const FIXED_CODE_VALUE = '123456';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const products = new Map([
  [
    'p1',
    {
      id: 'p1',
      name: '城市通勤电动车（标准版）',
      coverUrl: '',
      rentPerCycle: 299,
      tags: ['续航', '通勤', '分期'],
      frameConfig: '城市通勤车架',
      batteryConfig: '48V 20Ah'
    }
  ],
  [
    'p2',
    {
      id: 'p2',
      name: '外卖骑手电动车（高配）',
      coverUrl: '',
      rentPerCycle: 399,
      tags: ['高续航', '高载重', '分期'],
      frameConfig: '加固车架',
      batteryConfig: '60V 30Ah'
    }
  ]
]);

const blacklist = new Map(); // phone -> { phone, reason, createdAt }
const orders = new Map(); // id -> order
const repayments = new Map(); // key: `${orderId}:${period}` -> { orderId, period, amount, paidAt }
const contracts = new Map(); // orderId -> { id, orderId, status, signUrl, createdAt, updatedAt }
const smsRecords = []; // { id, phone, content, createdAt, status }
const paymentIntents = new Map(); // id -> { id, orderId, status, cashierUrl, createdAt, updatedAt }
const tokens = new Map(); // token -> { type, phoneOrUsername, expiresAt }

function nowIso() {
  return new Date().toISOString();
}

function issueToken(type, phoneOrUsername) {
  const token = crypto.randomBytes(16).toString('hex');
  tokens.set(token, { type, phoneOrUsername, expiresAt: Date.now() + 24 * 3600_000 });
  return token;
}

function addOrderLog(order, action, meta = {}) {
  order.statusLogs = order.statusLogs || [];
  order.statusLogs.unshift({
    id: `log_${crypto.randomBytes(6).toString('hex')}`,
    action,
    status: order.status,
    at: nowIso(),
    ...meta
  });
}

function requireAuth(req, type) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return null;
  }
  const token = auth.slice('Bearer '.length).trim();
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token);
    return null;
  }
  if (entry.type !== type) return null;
  return entry;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// H5 auth
app.post('/api/h5/auth/request-code', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'phone 不能为空' });
  if (FIXED_CODE_ENABLED) return res.json({ message: 'ok', devFixedCode: FIXED_CODE_VALUE });
  return res.json({ message: 'ok' });
});

app.post('/api/h5/auth/login', (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'phone 不能为空' });
  if (!code) return res.status(400).json({ message: 'code 不能为空' });
  if (!FIXED_CODE_ENABLED) return res.status(400).json({ message: '短信验证码服务未接入' });
  if (code !== FIXED_CODE_VALUE) return res.status(400).json({ message: '验证码错误' });
  const token = issueToken('H5', phone);
  res.json({ token });
});

// H5 products
app.get('/api/h5/products', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  res.json([...products.values()]);
});

app.get('/api/h5/products/:id', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const item = products.get(req.params.id);
  if (!item) return res.status(404).json({ message: '商品不存在' });
  res.json(item);
});

function buildRentPlan(rentPerCycle, periods, cycleDays, depositRatio) {
  const today = new Date();
  const items = [];
  for (let i = 1; i <= periods; i++) {
    const due = new Date(today.getTime() + i * cycleDays * 24 * 3600_000);
    const dueDate = due.toISOString().slice(0, 10);
    items.push({ period: i, dueDate, amount: rentPerCycle });
  }
  if (!depositRatio || depositRatio <= 0) return items;
  const totalRent = rentPerCycle * periods;
  let remaining = Math.round(totalRent * depositRatio);
  for (let i = items.length - 1; i >= 0 && remaining > 0; i--) {
    const offset = Math.min(items[i].amount, remaining);
    items[i].amount -= offset;
    remaining -= offset;
  }
  return items;
}

function isPaid(orderId, period) {
  const key = `${orderId}:${period}`;
  return repayments.has(key);
}

function listRepaymentRecords(orderId) {
  const list = [];
  for (const r of repayments.values()) {
    if (r.orderId === orderId) list.push(r);
  }
  list.sort((a, b) => a.period - b.period);
  return list;
}

function enrichOrder(order) {
  const repaymentRecords = listRepaymentRecords(order.id);
  const enrichedPlan = (order.repaymentPlan || []).map((p) => ({
    ...p,
    paid: p.amount <= 0 ? true : isPaid(order.id, p.period)
  }));
  const remainingAmount = enrichedPlan
    .filter((p) => !p.paid)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const contract = contracts.get(order.id) || null;
  const payment = [...paymentIntents.values()]
    .filter((x) => x.orderId === order.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
  return { ...order, repaymentPlan: enrichedPlan, repaymentRecords, remainingAmount, contract, payment };
}

function parseDateOnly(dateStr) {
  // dateStr: YYYY-MM-DD
  const [y, m, d] = String(dateStr).split('-').map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function diffDaysUtc(a, b) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 86400_000);
}

// H5 orders
app.post('/api/h5/orders', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  if (blacklist.has(p.phoneOrUsername)) return res.status(403).json({ message: '该账号已被限制下单' });

  const { productId, periods, cycleDays, depositRatio } = req.body || {};
  if (!productId) return res.status(400).json({ message: 'productId 不能为空' });
  const product = products.get(productId);
  if (!product) return res.status(404).json({ message: '商品不存在' });

  const id = `o_${crypto.randomBytes(8).toString('hex')}`;
  const order = {
    id,
    phone: p.phoneOrUsername,
    productId,
    productName: product.name,
    periods: Number(periods || 12),
    cycleDays: Number(cycleDays || 30),
    depositRatio: Number(depositRatio || 0),
    status: 'PENDING_REVIEW',
    createdAt: nowIso(),
    repaymentPlan: buildRentPlan(product.rentPerCycle, Number(periods || 12), Number(cycleDays || 30), Number(depositRatio || 0)),
    statusLogs: []
  };
  addOrderLog(order, 'CREATED', { by: 'H5', actor: p.phoneOrUsername });
  orders.set(id, order);
  res.json(enrichOrder(order));
});

app.get('/api/h5/orders', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const list = [...orders.values()].filter((o) => o.phone === p.phoneOrUsername);
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list.map(enrichOrder));
});

app.get('/api/h5/orders/:id', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  if (order.phone !== p.phoneOrUsername) return res.status(403).json({ message: '无权限' });
  res.json(enrichOrder(order));
});

// H5 e-sign (reserved)
app.post('/api/h5/contracts/:orderId/start', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  if (order.phone !== p.phoneOrUsername) return res.status(403).json({ message: '无权限' });

  const existing = contracts.get(order.id);
  if (existing && (existing.status === 'SIGNING' || existing.status === 'SIGNED')) {
    return res.json(existing);
  }

  const contract = {
    id: `c_${crypto.randomBytes(8).toString('hex')}`,
    orderId: order.id,
    status: 'SIGNING',
    signUrl: `https://example.com/esign/sign?orderId=${encodeURIComponent(order.id)}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  contracts.set(order.id, contract);
  addOrderLog(order, 'CONTRACT_STARTED', { by: 'H5', actor: p.phoneOrUsername });
  res.json(contract);
});

app.get('/api/h5/contracts/:orderId', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  if (order.phone !== p.phoneOrUsername) return res.status(403).json({ message: '无权限' });
  res.json(contracts.get(order.id) || null);
});

// H5 payment (reserved for H5 cashier)
app.post('/api/h5/orders/:orderId/payment/start', (req, res) => {
  const p = requireAuth(req, 'H5');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  if (order.phone !== p.phoneOrUsername) return res.status(403).json({ message: '无权限' });

  const id = `pay_${crypto.randomBytes(8).toString('hex')}`;
  const intent = {
    id,
    orderId: order.id,
    status: 'PENDING',
    cashierUrl: `https://example.com/pay/cashier?paymentId=${encodeURIComponent(id)}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  paymentIntents.set(id, intent);
  addOrderLog(order, 'PAYMENT_STARTED', { by: 'H5', actor: p.phoneOrUsername, paymentId: id });
  res.json(intent);
});

// third-party callbacks (reserved)
app.post('/api/callbacks/esign', (req, res) => {
  const { orderId, status } = req.body || {};
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  const c = contracts.get(orderId);
  if (!c) return res.status(404).json({ message: '合同不存在' });
  c.status = status || 'SIGNED';
  c.updatedAt = nowIso();
  contracts.set(orderId, c);
  addOrderLog(order, 'CONTRACT_CALLBACK', { by: 'CALLBACK', contractStatus: c.status });
  res.json({ ok: true });
});

app.post('/api/callbacks/payment', (req, res) => {
  const { paymentId, status } = req.body || {};
  const intent = paymentIntents.get(paymentId);
  if (!intent) return res.status(404).json({ message: '支付单不存在' });
  intent.status = status || 'SUCCESS';
  intent.updatedAt = nowIso();
  paymentIntents.set(paymentId, intent);
  const order = orders.get(intent.orderId);
  if (order) addOrderLog(order, 'PAYMENT_CALLBACK', { by: 'CALLBACK', paymentStatus: intent.status, paymentId });
  res.json({ ok: true });
});

// Admin auth
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: '账号或密码错误' });
  }
  const token = issueToken('ADMIN', username);
  res.json({ token });
});

// Admin products
app.get('/api/admin/products', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  res.json([...products.values()]);
});

app.post('/api/admin/products', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const { id, name, rentPerCycle, tags, coverUrl, frameConfig, batteryConfig } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name 不能为空' });
  const rent = Number(rentPerCycle);
  if (!Number.isFinite(rent) || rent <= 0) return res.status(400).json({ message: 'rentPerCycle 必须大于0' });

  const productId = id || `p_${crypto.randomBytes(6).toString('hex')}`;
  const product = {
    id: productId,
    name,
    rentPerCycle: rent,
    tags: Array.isArray(tags) ? tags : String(tags || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    coverUrl: coverUrl || '',
    frameConfig: frameConfig || '',
    batteryConfig: batteryConfig || ''
  };
  products.set(productId, product);
  res.json(product);
});

// Admin orders
app.get('/api/admin/orders', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const list = [...orders.values()];
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list.map(enrichOrder));
});

app.get('/api/admin/orders/:id', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  res.json(enrichOrder(order));
});

function requireOrderForAction(res, orderId, allowedStatuses) {
  const order = orders.get(orderId);
  if (!order) {
    res.status(404).json({ message: '订单不存在' });
    return null;
  }
  if (!allowedStatuses.includes(order.status)) {
    res.status(400).json({ message: '订单状态不允许操作' });
    return null;
  }
  return order;
}

app.post('/api/admin/orders/:id/approve', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['PENDING_REVIEW']);
  if (!order) return;
  order.status = 'ACTIVE';
  order.approvedAt = nowIso();
  addOrderLog(order, 'APPROVED', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/reject', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['PENDING_REVIEW']);
  if (!order) return;
  order.status = 'REJECTED';
  order.rejectedAt = nowIso();
  addOrderLog(order, 'REJECTED', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/deliver', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['ACTIVE']);
  if (!order) return;
  order.status = 'DELIVERED';
  order.deliveredAt = nowIso();
  addOrderLog(order, 'DELIVERED', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/pickup', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['DELIVERED']);
  if (!order) return;
  order.status = 'IN_USE';
  order.pickedUpAt = nowIso();
  addOrderLog(order, 'PICKED_UP', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/return', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['IN_USE']);
  if (!order) return;
  order.status = 'RETURNED';
  order.returnedAt = nowIso();
  addOrderLog(order, 'RETURNED', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/settle', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['RETURNED']);
  if (!order) return;
  order.status = 'SETTLED';
  order.settledAt = nowIso();
  addOrderLog(order, 'SETTLED', { by: 'ADMIN' });
  res.json(order);
});

app.post('/api/admin/orders/:id/close', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = requireOrderForAction(res, req.params.id, ['PENDING_REVIEW', 'ACTIVE', 'DELIVERED', 'IN_USE', 'RETURNED']);
  if (!order) return;
  order.status = 'CLOSED';
  order.closedAt = nowIso();
  addOrderLog(order, 'CLOSED', { by: 'ADMIN' });
  res.json(order);
});

// Admin repayments
app.get('/api/admin/repayments', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const { orderId } = req.query || {};
  if (!orderId) return res.status(400).json({ message: 'orderId 不能为空' });
  const order = orders.get(String(orderId));
  if (!order) return res.status(404).json({ message: '订单不存在' });
  res.json({ orderId: order.id, repaymentPlan: enrichOrder(order).repaymentPlan, repaymentRecords: listRepaymentRecords(order.id) });
});

app.post('/api/admin/orders/:id/repayments/:period/mark-paid', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  const period = Number(req.params.period);
  const planItem = (order.repaymentPlan || []).find((x) => x.period === period);
  if (!planItem) return res.status(404).json({ message: '期次不存在' });
  if (planItem.amount <= 0) return res.status(400).json({ message: '该期金额为0，无需还款' });
  const key = `${order.id}:${period}`;
  repayments.set(key, { orderId: order.id, period, amount: planItem.amount, paidAt: nowIso() });
  addOrderLog(order, 'REPAYMENT_MARK_PAID', { by: 'ADMIN', period, amount: planItem.amount });
  res.json({ ok: true });
});

// Admin reminders & SMS (reserved)
app.get('/api/admin/reminders', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const kind = String(req.query?.kind || 'all'); // due_soon | due_today | all

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const soon = new Date(today.getTime() + 3 * 86400_000).toISOString().slice(0, 10);

  const items = [];
  for (const order of orders.values()) {
    if (!order.repaymentPlan) continue;
    const enriched = enrichOrder(order);
    for (const pItem of enriched.repaymentPlan) {
      if (pItem.paid || pItem.amount <= 0) continue;
      if (kind === 'due_today' && pItem.dueDate !== todayStr) continue;
      if (kind === 'due_soon' && pItem.dueDate !== soon) continue;
      if (kind === 'all' && pItem.dueDate !== todayStr && pItem.dueDate !== soon) continue;
      items.push({
        id: `rem_${order.id}_${pItem.period}`,
        orderId: order.id,
        phone: order.phone,
        productName: order.productName,
        period: pItem.period,
        dueDate: pItem.dueDate,
        amount: pItem.amount
      });
    }
  }

  items.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  res.json(items);
});

app.post('/api/admin/sms/send', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const { phone, content } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'phone 不能为空' });
  if (!content) return res.status(400).json({ message: 'content 不能为空' });
  const record = { id: `sms_${crypto.randomBytes(6).toString('hex')}`, phone, content, createdAt: nowIso(), status: 'MOCK_SENT' };
  smsRecords.unshift(record);
  res.json(record);
});

app.get('/api/admin/sms/records', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  res.json(smsRecords);
});

// Admin overdue tiers
app.get('/api/admin/overdue', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const tier = String(req.query?.tier || 'all'); // 1-3 | 3-10 | 10-30 | 30+ | all

  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const result = [];
  for (const order of orders.values()) {
    const enriched = enrichOrder(order);
    const overdueItems = enriched.repaymentPlan
      .filter((pItem) => !pItem.paid && pItem.amount > 0)
      .map((pItem) => {
        const due = parseDateOnly(pItem.dueDate);
        if (!due) return null;
        const days = diffDaysUtc(todayDate, due);
        return { ...pItem, overdueDays: days };
      })
      .filter((x) => x && x.overdueDays > 0);

    if (overdueItems.length === 0) continue;
    overdueItems.sort((a, b) => b.overdueDays - a.overdueDays);
    const worst = overdueItems[0];

    const d = worst.overdueDays;
    const match =
      tier === 'all' ||
      (tier === '1-3' && d >= 1 && d <= 3) ||
      (tier === '3-10' && d >= 3 && d <= 10) ||
      (tier === '10-30' && d >= 10 && d <= 30) ||
      (tier === '30+' && d >= 30);
    if (!match) continue;

    result.push({
      orderId: order.id,
      phone: order.phone,
      productName: order.productName,
      status: order.status,
      maxOverdueDays: d,
      overduePeriods: overdueItems.map((x) => ({ period: x.period, dueDate: x.dueDate, amount: x.amount, overdueDays: x.overdueDays }))
    });
  }

  result.sort((a, b) => b.maxOverdueDays - a.maxOverdueDays);
  res.json(result);
});

function toCsv(rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };
  return rows.map((r) => r.map(escape).join(',')).join('\r\n');
}

function sendCsv(res, filename, rows) {
  const csv = '\ufeff' + toCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// Admin exports
app.get('/api/admin/exports/orders.csv', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const header = [
    '订单ID',
    '手机号',
    '商品',
    '状态',
    '期数',
    '周期(天)',
    '押金比例',
    '创建时间',
    '剩余应还',
    '合同状态',
    '收款状态'
  ];
  const rows = [header];
  for (const o of [...orders.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    const e = enrichOrder(o);
    rows.push([
      e.id,
      e.phone,
      e.productName,
      e.status,
      e.periods,
      e.cycleDays,
      e.depositRatio,
      e.createdAt,
      e.remainingAmount,
      e.contract?.status || '',
      e.payment?.status || ''
    ]);
  }
  sendCsv(res, 'orders.csv', rows);
});

app.get('/api/admin/exports/repayments.csv', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const header = ['订单ID', '手机号', '商品', '期次', '到期日', '金额', '是否已还'];
  const rows = [header];
  for (const o of orders.values()) {
    const e = enrichOrder(o);
    for (const pItem of e.repaymentPlan || []) {
      rows.push([e.id, e.phone, e.productName, pItem.period, pItem.dueDate, pItem.amount, pItem.paid ? '是' : '否']);
    }
  }
  sendCsv(res, 'repayments.csv', rows);
});

app.get('/api/admin/exports/overdue.csv', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const header = ['订单ID', '手机号', '商品', '状态', '期次', '到期日', '金额', '逾期天数'];
  const rows = [header];
  const tier = 'all';
  const list = [];
  // reuse overdue logic by calling internal parts
  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  for (const order of orders.values()) {
    const enriched = enrichOrder(order);
    const overdueItems = enriched.repaymentPlan
      .filter((pItem) => !pItem.paid && pItem.amount > 0)
      .map((pItem) => {
        const due = parseDateOnly(pItem.dueDate);
        if (!due) return null;
        const days = diffDaysUtc(todayDate, due);
        return { ...pItem, overdueDays: days };
      })
      .filter((x) => x && x.overdueDays > 0);
    if (overdueItems.length === 0) continue;
    for (const it of overdueItems) {
      list.push({
        orderId: order.id,
        phone: order.phone,
        productName: order.productName,
        status: order.status,
        period: it.period,
        dueDate: it.dueDate,
        amount: it.amount,
        overdueDays: it.overdueDays
      });
    }
  }
  list.sort((a, b) => b.overdueDays - a.overdueDays);
  for (const it of list) {
    rows.push([it.orderId, it.phone, it.productName, it.status, it.period, it.dueDate, it.amount, it.overdueDays]);
  }
  sendCsv(res, 'overdue.csv', rows);
});

app.get('/api/admin/exports/sms.csv', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const header = ['记录ID', '手机号', '内容', '时间', '状态'];
  const rows = [header];
  for (const r of smsRecords) {
    rows.push([r.id, r.phone, r.content, r.createdAt, r.status]);
  }
  sendCsv(res, 'sms.csv', rows);
});

// Admin blacklist
app.get('/api/admin/blacklist', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const list = [...blacklist.values()];
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list);
});

app.post('/api/admin/blacklist', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  const { phone, reason } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'phone 不能为空' });
  blacklist.set(phone, { phone, reason: reason || '风险客户', createdAt: nowIso() });
  res.json({ ok: true });
});

app.delete('/api/admin/blacklist/:phone', (req, res) => {
  const p = requireAuth(req, 'ADMIN');
  if (!p) return res.status(401).json({ message: '未登录' });
  blacklist.delete(req.params.phone);
  res.json({ ok: true });
});

app.listen(8082, () => {
  console.log('API listening on http://localhost:8082');
});
