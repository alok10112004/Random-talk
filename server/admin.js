import express from 'express';
import crypto from 'crypto';
import {
  getQueue,
  removeQueueItem,
  removeQueueByTarget,
  adminBan,
  unbanGroup,
  listBans,
} from './moderation.js';

const fails = new Map(); // ip -> [timestamps]

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moderation</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#111;color:#eee}
h2,h3{margin:8px 0}
input,button{font-size:14px;padding:8px 12px;border-radius:8px;border:0}
button{cursor:pointer;background:#444;color:#fff;margin:2px}
button.ban{background:#d32f2f}button.perm{background:#7b1fa2}button.ok{background:#2e7d32}
.card{background:#1e1e1e;border-radius:12px;padding:12px;margin:10px 0;display:flex;gap:12px;flex-wrap:wrap}
.card img{width:240px;max-width:100%;border-radius:8px;background:#000}
.urgent{border:2px solid #ff5252}
.tag{display:inline-block;background:#333;border-radius:6px;padding:2px 8px;margin:2px;font-size:12px}
.row{background:#1e1e1e;border-radius:8px;padding:8px 12px;margin:6px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px}
.warn{color:#ffb74d;font-size:13px}
</style></head><body>
<h2>Moderation panel</h2>
<div id="login"><input id="key" type="password" placeholder="Admin key"> <button id="go">Open</button> <span id="err" class="warn"></span></div>
<div id="app" style="display:none">
<p class="warn">Dhyan: screenshots me nudity ya nabalig ho sakte hain. Ye sirf memory me 24 ghante rehte hain.</p>
<button id="refresh">Refresh</button>
<h3>Pending reports</h3><div id="reports"></div>
<h3>Active bans</h3><div id="bans"></div>
</div>
<script>
var KEY = sessionStorage.getItem('adminKey') || '';
function api(path, method, body) {
  return fetch('/admin/api' + path, {
    method: method || 'GET',
    headers: { 'x-admin-key': KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) {
    if (r.status === 401) throw new Error('Galat key');
    if (r.status === 429) throw new Error('Bahut attempts, kuch der baad try karo');
    return r.json();
  });
}
function el(tag, text, cls) {
  var e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function btn(label, cls, fn) {
  var b = el('button', label, cls);
  b.onclick = fn;
  return b;
}
function ago(ts) {
  var m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? 'abhi' : m + ' min pehle';
}
function load() {
  api('/reports').then(function (d) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    var box = document.getElementById('reports');
    box.textContent = '';
    if (!d.reports.length) box.appendChild(el('p', 'Koi pending report nahi.'));
    d.reports.forEach(function (r) {
      var c = el('div', undefined, 'card' + (r.urgent ? ' urgent' : ''));
      if (r.image && r.image.indexOf('data:image/jpeg;base64,') === 0) {
        var img = document.createElement('img');
        img.src = r.image;
        c.appendChild(img);
      }
      var info = el('div');
      info.appendChild(el('div', (r.urgent ? 'URGENT ' : '') + 'Reason: ' + r.reason, 'tag'));
      info.appendChild(el('div', 'Detector: ' + (r.verdict || 'n/a'), 'tag'));
      info.appendChild(el('div', 'Reports: ' + r.count, 'tag'));
      info.appendChild(el('div', 'User: ' + r.target, 'tag'));
      info.appendChild(el('div', ago(r.ts), 'tag'));
      info.appendChild(document.createElement('br'));
      info.appendChild(btn('Ban', 'ban', function () { act('/reports/' + r.id + '/ban', { permanent: false }); }));
      info.appendChild(btn('Permanent ban', 'perm', function () {
        if (confirm('Permanent ban pakka?')) act('/reports/' + r.id + '/ban', { permanent: true });
      }));
      info.appendChild(btn('Dismiss', 'ok', function () { act('/reports/' + r.id + '/dismiss', {}); }));
      c.appendChild(info);
      box.appendChild(c);
    });
    var bb = document.getElementById('bans');
    bb.textContent = '';
    if (!d.bans.length) bb.appendChild(el('p', 'Koi active ban nahi.'));
    d.bans.forEach(function (b) {
      var row = el('div', undefined, 'row');
      row.appendChild(el('span', b.key.slice(0, 14) + '...', 'tag'));
      row.appendChild(el('span', b.reason || 'n/a', 'tag'));
      row.appendChild(el('span', b.permanent ? 'PERMANENT' : 'till ' + new Date(b.until).toLocaleString(), 'tag'));
      row.appendChild(el('span', 'strikes: ' + b.strikes, 'tag'));
      row.appendChild(btn('Unban', 'ok', function () { act('/unban', { key: b.key }); }));
      bb.appendChild(row);
    });
  }).catch(function (e) {
    document.getElementById('err').textContent = e.message;
  });
}
function act(path, body) {
  api(path, 'POST', body).then(load).catch(function (e) { alert(e.message); });
}
document.getElementById('go').onclick = function () {
  KEY = document.getElementById('key').value;
  sessionStorage.setItem('adminKey', KEY);
  load();
};
document.getElementById('refresh').onclick = load;
if (KEY) load();
</script></body></html>`;

export function createAdminRouter({ onBansChanged, notifyReporters }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.type('html').send(PAGE);
  });

  router.use('/api', (req, res, next) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
      .split(',')[0]
      .trim();
    const now = Date.now();
    const list = (fails.get(ip) || []).filter((t) => now - t < 10 * 60_000);
    if (list.length >= 10) return res.status(429).json({ error: 'Too many attempts' });

    const key = process.env.ADMIN_KEY;
    if (!key || !safeEqual(req.headers['x-admin-key'], key)) {
      list.push(now);
      fails.set(ip, list);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  router.get('/api/reports', (req, res) => {
    res.json({ reports: getQueue(), bans: listBans() });
  });

  router.post('/api/reports/:id/ban', (req, res) => {
    const item = removeQueueItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Report nahi mili' });
    adminBan({
      targetDevice: item.targetDevice,
      targetIp: item.targetIp,
      permanent: !!req.body?.permanent,
      reason: item.reason,
    });
    const others = removeQueueByTarget(item.targetDevice);
    onBansChanged();
    notifyReporters([item.reporterDevice, ...others]);
    res.json({ ok: true });
  });

  router.post('/api/reports/:id/dismiss', (req, res) => {
    removeQueueItem(req.params.id);
    res.json({ ok: true });
  });

  router.post('/api/unban', (req, res) => {
    const ok = unbanGroup(String(req.body?.key || ''));
    res.json({ ok });
  });

  return router;
}