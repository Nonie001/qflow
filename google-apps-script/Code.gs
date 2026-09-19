// Deploy as a Web App: execute as owner; access Anyone. All calls require the
// server-only shared secret. Do not share the spreadsheet with customers.
const HEADERS = {
  services: ['id', 'name', 'prefix', 'is_active', 'created_at'],
  counters: ['id', 'name', 'is_active', 'created_at'],
  queues: ['id', 'queue_number', 'queue_sequence', 'service_id', 'counter_id', 'status', 'queue_date', 'created_at', 'called_at', 'serving_at', 'completed_at', 'request_id', 'customer_name'],
  push_subscriptions: ['id', 'queue_id', 'endpoint', 'p256dh', 'auth', 'created_at'],
  notifications: ['id', 'queue_id', 'type', 'sent_at', 'state'],
};

// Kept as the first runnable function so the Apps Script editor exposes the
// one-time database setup clearly in its function picker.
function runSetup() {
  setup();
}

let spreadsheet;
function book() {
  if (spreadsheet) return spreadsheet;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Set SPREADSHEET_ID in Script Properties');
  spreadsheet = SpreadsheetApp.openById(id);
  return spreadsheet;
}

/** Run manually once. Existing tabs and data are preserved. */
function setup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = book();
    Object.keys(HEADERS).forEach(name => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) sheet = ss.insertSheet(name);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
        sheet.setFrozenRows(1);
      } else if (name === 'queues') {
        const currentHeaders = sheet.getDataRange().getValues()[0];
        const previousHeaders = HEADERS.queues.slice(0, -1);
        if (JSON.stringify(currentHeaders) === JSON.stringify(previousHeaders)) {
          sheet.getRange(1, 1, 1, HEADERS.queues.length).setValues([HEADERS.queues]);
        }
      }
    });
    if (rows('services').length === 0) {
      [['บริการทั่วไป', 'A'], ['ชำระเงิน', 'B'], ['บริการเอกสาร', 'C']].forEach(item =>
        append('services', { id: uuid(), name: item[0], prefix: item[1], is_active: true, created_at: now() }));
    }
    if (rows('counters').length === 0) {
      [1, 2, 3].forEach(n => append('counters', { id: uuid(), name: 'ช่อง ' + n, is_active: true, created_at: now() }));
    }
  } finally {
    try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); }
  }
}

function doPost(e) {
  try {
    const input = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
    if (!secret || secret.length < 32 || input.key !== secret) throw new Error('Unauthorized');
    // Only mutations share the script lock. Read requests can run concurrently,
    // which keeps polling screens from blocking one another.
    if (!requiresLock(input.action)) return json({ ok: true, data: dispatch(input.action, input.args || {}) });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const data = dispatch(input.action, input.args || {});
      return json({ ok: true, data: data });
    } finally {
      try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); }
    }
  } catch (err) { return json({ ok: false, error: err.message || 'Request failed' }); }
}

function requiresLock(action) {
  return ['create_queue', 'call_next', 'transition', 'manage', 'subscribe',
    'delete_subscription', 'claim_notification', 'finish_notification', 'login_attempt',
    'reset_all'].includes(action);
}

function json(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function uuid() { return Utilities.getUuid(); }
function now() { return new Date().toISOString(); }
function today() { return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'); }
function sheetFor(name) {
  if (!Object.prototype.hasOwnProperty.call(HEADERS, name)) throw new Error('Invalid table');
  const sheet = book().getSheetByName(name);
  if (!sheet) throw new Error('Run setup() first');
  return sheet;
}
function rows(name) {
  const values = sheetFor(name).getDataRange().getValues();
  if (JSON.stringify(values[0]) !== JSON.stringify(HEADERS[name])) throw new Error('Invalid headers: ' + name);
  return values.slice(1).filter(row => row[0]).map(row => {
    const result = {};
    HEADERS[name].forEach((key, index) => { result[key] = row[index] instanceof Date ? row[index].toISOString() : row[index]; });
    return result;
  });
}
function cells(name, value) {
  return HEADERS[name].map(key => {
    const cell = value[key] == null ? '' : value[key];
    // Neutralize spreadsheet formulas in every user-controlled string.
    return typeof cell === 'string' && /^[=+@-]/.test(cell) ? "'" + cell : cell;
  });
}
function append(name, value) {
  const sheet = sheetFor(name);
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS[name].length);
  range.setNumberFormat('@');
  range.setValues([cells(name, value)]);
  return value;
}
function rowIndex(name, id) {
  const values = sheetFor(name).getDataRange().getValues();
  const index = values.findIndex((row, i) => i > 0 && row[0] === id);
  if (index < 0) throw new Error('Record not found');
  return index + 1;
}
function update(name, value) {
  sheetFor(name).getRange(rowIndex(name, value.id), 1, 1, HEADERS[name].length).setValues([cells(name, value)]);
  return value;
}
function remove(name, id) { sheetFor(name).deleteRow(rowIndex(name, id)); }
function active(row) { return row.is_active === true || row.is_active === 'true' || row.is_active === 'TRUE'; }
function catalog(name) { return rows(name).map(row => Object.assign({}, row, { is_active: active(row) })); }
function queueRows() {
  return rows('queues').map(q => {
    q.queue_sequence = Number(q.queue_sequence);
    q.customer_name = q.customer_name || '';
    ['counter_id', 'called_at', 'serving_at', 'completed_at'].forEach(k => { q[k] = q[k] || null; });
    return q;
  });
}
function todayQueues() { return queueRows().filter(q => q.queue_date === today()); }
function publicQueue(q, services, counters) {
  if (!q) return null;
  const result = Object.assign({}, q);
  delete result.request_id;
  result.service = (services || catalog('services')).find(s => s.id === q.service_id) || null;
  result.counter = (counters || catalog('counters')).find(c => c.id === q.counter_id) || null;
  return result;
}
function position(queue, all) {
  if (queue.status !== 'waiting') return 0;
  return all.filter(q => q.status === 'waiting' && q.queue_date === queue.queue_date && q.service_id === queue.service_id && q.queue_sequence < queue.queue_sequence).length;
}
function requiredText(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid input');
  return value.trim();
}
function dispatch(action, a) {
  if (action === 'reset_all') {
    Object.keys(HEADERS).forEach(name => {
      const sheet = sheetFor(name);
      const dataRows = sheet.getLastRow() - 1;
      if (dataRows > 0) sheet.deleteRows(2, dataRows);
    });
    return true;
  }
  if (action === 'services' || action === 'counters') return catalog(action).filter(r => !a.activeOnly || r.is_active);
  if (action === 'monitor_data') {
    const services = catalog('services');
    const counters = catalog('counters');
    const queues = todayQueues().sort((a,b) => a.created_at.localeCompare(b.created_at))
      .map(q => publicQueue(q, services, counters));
    return { counters: counters.filter(c => c.is_active), queues: queues };
  }
  if (action === 'today_queues') {
    const services = catalog('services'), counters = catalog('counters');
    return todayQueues().sort((a,b) => a.created_at.localeCompare(b.created_at)).map(q => publicQueue(q, services, counters));
  }
  if (action === 'customer_queue') {
    const all = queueRows(), q = all.find(q => q.id === a.id);
    return q ? { queue: publicQueue(q), position: position(q, all) } : null;
  }
  if (action === 'create_queue') {
    if (!/^[a-f0-9-]{36}$/i.test(a.requestId || '')) throw new Error('Invalid request ID');
    const customerName = requiredText(a.customerName, 100);
    const all = queueRows();
    const existing = all.find(q => q.request_id === a.requestId);
    if (existing) {
      if (existing.service_id !== a.serviceId) throw new Error('Request already used');
      return { queue: publicQueue(existing), position: position(existing, all) };
    }
    const service = catalog('services').find(s => s.id === a.serviceId && s.is_active);
    if (!service) throw new Error('บริการนี้ไม่เปิดให้รับคิว');
    const sequence = all.filter(q => q.service_id === service.id && q.queue_date === today()).reduce((max,q) => Math.max(max, q.queue_sequence), 0) + 1;
    const q = append('queues', { id: uuid(), queue_number: service.prefix + String(sequence).padStart(3, '0'), queue_sequence: sequence, service_id: service.id, counter_id: null, status: 'waiting', queue_date: today(), created_at: now(), called_at: null, serving_at: null, completed_at: null, request_id: a.requestId, customer_name: customerName });
    return { queue: publicQueue(q), position: position(q, all) };
  }
  if (action === 'call_next') {
    const counter = catalog('counters').find(c => c.id === a.counterId && c.is_active);
    if (!counter) throw new Error('ช่องบริการไม่เปิดใช้งาน');
    const all = todayQueues();
    // A repeated click or two staff sharing one counter returns the active queue.
    const current = all.find(q => q.counter_id === counter.id && ['called', 'serving'].includes(q.status));
    if (current) return publicQueue(current);
    const next = all.filter(q => q.status === 'waiting' && (!a.serviceId || q.service_id === a.serviceId)).sort((a,b) => a.created_at.localeCompare(b.created_at))[0];
    if (!next) return null;
    next.status = 'called'; next.counter_id = counter.id; next.called_at = now();
    update('queues', next);
    return publicQueue(next);
  }
  if (action === 'transition') {
    const q = todayQueues().find(q => q.id === a.id);
    if (!q) throw new Error('ไม่พบคิววันนี้');
    const targets = { serve: 'serving', complete: 'completed', skip: 'skipped' };
    if (Object.prototype.hasOwnProperty.call(targets, a.operation) && q.status === targets[a.operation]) return publicQueue(q);
    const allowed = { recall: ['called', 'serving'], serve: ['called'], complete: ['called', 'serving'], skip: ['waiting', 'called', 'serving'] };
    if (!Object.prototype.hasOwnProperty.call(allowed, a.operation) || !allowed[a.operation].includes(q.status)) throw new Error('สถานะคิวไม่รองรับคำสั่งนี้');
    if (a.operation === 'recall') q.called_at = now();
    else { q.status = targets[a.operation]; if (a.operation === 'serve') q.serving_at = now(); else q.completed_at = now(); }
    update('queues', q);
    return publicQueue(q);
  }
  if (action === 'manage') {
    if (!['services', 'counters'].includes(a.table)) throw new Error('Invalid table');
    const all = catalog(a.table);
    if (a.operation === 'create') {
      const name = requiredText(a.name, 100);
      const record = { id: uuid(), name: name, is_active: true, created_at: now() };
      if (a.table === 'services') {
        record.prefix = requiredText(a.prefix, 2).toUpperCase();
        if (!/^[A-Z]{1,2}$/.test(record.prefix)) throw new Error('ใช้ตัวอักษร A-Z จำนวน 1–2 ตัว');
        if (all.some(r => r.prefix === record.prefix)) throw new Error('ตัวอักษรนำหน้าคิวซ้ำ');
      } else if (all.some(r => r.name === name)) throw new Error('ชื่อช่องบริการซ้ำ');
      append(a.table, record); return true;
    }
    const row = all.find(r => r.id === a.id);
    if (!row) throw new Error('Record not found');
    if (a.operation === 'toggle') {
      if (typeof a.isActive !== 'boolean') throw new Error('Invalid active flag');
      row.is_active = a.isActive; update(a.table, row); return true;
    }
    if (a.operation === 'delete') {
      const column = a.table === 'services' ? 'service_id' : 'counter_id';
      if (queueRows().some(q => q[column] === a.id)) throw new Error('มีประวัติคิวอ้างอิงอยู่ กรุณาปิดใช้งานแทนการลบ');
      remove(a.table, a.id); return true;
    }
    throw new Error('Invalid operation');
  }
  if (action === 'subscribe') {
    if (!queueRows().some(q => q.id === a.queueId)) throw new Error('Queue not found');
    const existing = rows('push_subscriptions').find(s => s.queue_id === a.queueId && s.endpoint === a.endpoint);
    const sub = { id: existing ? existing.id : uuid(), queue_id: a.queueId, endpoint: requiredText(a.endpoint, 4096), p256dh: requiredText(a.p256dh, 200), auth: requiredText(a.auth, 100), created_at: now() };
    if (existing) update('push_subscriptions', sub); else append('push_subscriptions', sub);
    return true;
  }
  if (action === 'subscriptions') return rows('push_subscriptions').filter(s => s.queue_id === a.queueId);
  if (action === 'delete_subscription') { if (rows('push_subscriptions').some(s => s.id === a.id)) remove('push_subscriptions', a.id); return true; }
  if (action === 'almost_ready') {
    const all = todayQueues();
    return all.filter(q => q.status === 'waiting' && position(q, all) <= 3).map(q => publicQueue(q));
  }
  if (action === 'claim_notification') {
    if (!['queue_created', 'queue_almost_ready', 'queue_called'].includes(a.type)) throw new Error('Invalid notification type');
    if (!rows('push_subscriptions').some(s => s.queue_id === a.queueId)) return null;
    const existing = rows('notifications').find(n => n.queue_id === a.queueId && n.type === a.type);
    if (existing && (existing.state === 'sent' || Date.now() - Date.parse(existing.sent_at) < 120000)) return null;
    if (existing) remove('notifications', existing.id);
    const id = uuid();
    append('notifications', { id: id, queue_id: a.queueId, type: a.type, sent_at: now(), state: 'pending' });
    return id;
  }
  if (action === 'finish_notification') {
    const record = rows('notifications').find(n => n.id === a.id);
    if (record) { if (a.sent) { record.state = 'sent'; update('notifications', record); } else remove('notifications', record.id); }
    return true;
  }
  if (action === 'login_attempt') {
    if (!/^[a-f0-9]{64}$/.test(a.key || '')) throw new Error('Invalid key');
    const cache = CacheService.getScriptCache(), key = 'login:' + a.key;
    const attempts = Number(cache.get(key) || 0);
    if (attempts >= 10) throw new Error('Too many attempts. Try again in 15 minutes.');
    cache.put(key, String(attempts + 1), 900);
    return true;
  }
  throw new Error('Unknown action');
}
