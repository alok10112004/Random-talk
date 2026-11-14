import mongoose from 'mongoose';
import crypto from 'crypto';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const PERMANENT_UNTIL = 253402300799000; // saal 9999

// ---------- Settings ----------
const BAN_STEPS = [
  Number(process.env.BAN_FIRST_MINUTES || 60) * MIN, // 1st ban
  24 * HOUR,                                         // 2nd
  7 * DAY,                                           // 3rd
  30 * DAY,                                          // 4th+
];
const IP_MAX_BAN = 24 * HOUR;
const IP_MAX_BAN_PERMANENT = 7 * DAY;
const IP_SHARED_LIMIT = 15;
const NSFW_THRESHOLD = Number(process.env.REPORT_NSFW_THRESHOLD || 2);
const SERIOUS_THRESHOLD = Number(process.env.REPORT_SERIOUS_THRESHOLD || 2);
const ANY_THRESHOLD = Number(process.env.REPORT_ANY_THRESHOLD || 4);
const MAX_REPORTS_PER_DAY = 10;
const MAX_CLEAN_REPORTS = 4;
const QUEUE_MAX = 100;

export const VALID_REASONS = ['nudity', 'harassment', 'minor', 'violence', 'spam'];
const SERIOUS_REASONS = ['nudity', 'minor'];

// ---------- Storage ----------
const bans = new Map();            // key -> { until, strikes, reason, permanent, grp }
const reportsByTarget = new Map(); // key -> [{ reporter, nsfw, reason, ts }]
const reporterStats = new Map();   // deviceId -> { reports: [], clean: [] }
const ipDevices = new Map();       // ip -> Map(deviceId -> lastSeen)
const queue = [];                  // admin review queue (sirf memory me)

const banSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  until: { type: Number, default: 0 },
  strikes: { type: Number, default: 0 },
  reason: { type: String, default: null },
  permanent: { type: Boolean, default: false },
  grp: { type: String, default: null },
});
const BanModel = mongoose.models.Ban || mongoose.model('Ban', banSchema);

function saveBan(key, rec) {
  bans.set(key, rec);
  if (mongoose.connection.readyState !== 1) return;
  BanModel.updateOne({ key }, { $set: rec }, { upsert: true }).catch((e) =>
    console.error('Ban save error:', e.message)
  );
}

export async function loadBans() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const docs = await BanModel.find({}).lean();
    docs.forEach((d) =>
      bans.set(d.key, {
        until: d.until,
        strikes: d.strikes,
        reason: d.reason || null,
        permanent: !!d.permanent,
        grp: d.grp || null,
      })
    );
    console.log(`🛡️ ${docs.length} ban records loaded`);
  } catch (e) {
    console.error('Ban load error:', e.message);
  }
}

// ---------- Helpers ----------
export function getClientIp(socket) {
  const xff = socket.handshake.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  const real = socket.handshake.headers['x-real-ip'];
  if (real) return String(real).trim();
  return socket.handshake.address;
}

export function isValidDeviceId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export function noteDevice(ip, deviceId) {
  if (!ip) return;
  let m = ipDevices.get(ip);
  if (!m) {
    m = new Map();
    ipDevices.set(ip, m);
  }
  m.set(deviceId, Date.now());
}

function isSharedIp(ip) {
  const m = ipDevices.get(ip);
  if (!m) return false;
  const now = Date.now();
  let n = 0;
  for (const t of m.values()) if (now - t < HOUR) n++;
  return n >= IP_SHARED_LIMIT;
}

export function makeLimiter(max, windowMs) {
  const hits = [];
  return () => {
    const now = Date.now();
    while (hits.length && now - hits[0] > windowMs) hits.shift();
    if (hits.length >= max) return false;
    hits.push(now);
    return true;
  };
}

// ---------- Ban check / apply ----------
// Return: null ya { until, reason, permanent }
export function getBanInfo(deviceId, ip) {
  const now = Date.now();
  let best = null;
  for (const key of [deviceId ? `d:${deviceId}` : null, ip ? `i:${ip}` : null]) {
    if (!key) continue;
    const rec = bans.get(key);
    if (rec && rec.until > now && (!best || rec.until > best.until)) best = rec;
  }
  if (!best) return null;
  return { until: best.until, reason: best.reason || null, permanent: !!best.permanent };
}

function applyBan(deviceId, ip, { reason = null, permanent = false } = {}) {
  const now = Date.now();
  const dKey = deviceId ? `d:${deviceId}` : null;
  const iKey = ip ? `i:${ip}` : null;
  const dRec = dKey ? bans.get(dKey) : null;
  const iRec = iKey ? bans.get(iKey) : null;
  const grp = crypto.randomUUID();

  const strikes = (dKey ? dRec?.strikes || 0 : iRec?.strikes || 0) + 1;
  const duration = BAN_STEPS[Math.min(strikes - 1, BAN_STEPS.length - 1)];
  const dUntil = permanent ? PERMANENT_UNTIL : now + duration;

  if (dKey) saveBan(dKey, { until: dUntil, strikes, reason, permanent, grp });
  if (iKey && !isSharedIp(ip)) {
    const ipDur = Math.min(duration, permanent ? IP_MAX_BAN_PERMANENT : IP_MAX_BAN);
    saveBan(iKey, {
      until: now + ipDur,
      strikes: dKey ? iRec?.strikes || 0 : strikes,
      reason,
      permanent: false,
      grp,
    });
  } else if (iKey) {
    console.log(`⚠️ IP ${ip} shared lag raha hai, IP ban skip kiya (sirf device ban)`);
  }
  return { until: dUntil, strikes };
}

// ---------- Reports ----------
function pickReason(list) {
  if (list.some((x) => x.reason === 'minor')) return 'minor';
  if (list.some((x) => x.nsfw)) return 'nudity';
  for (const r of ['nudity', 'violence', 'harassment', 'spam']) {
    if (list.some((x) => x.reason === r)) return r;
  }
  return null;
}

export function recordReport({ targetDevice, targetIp, reporterDevice, verdict, reason }) {
  const now = Date.now();

  const stats = reporterStats.get(reporterDevice) || { reports: [], clean: [] };
  stats.reports = stats.reports.filter((t) => now - t < DAY);
  stats.clean = stats.clean.filter((t) => now - t < DAY);
  reporterStats.set(reporterDevice, stats);
  if (stats.reports.length >= MAX_REPORTS_PER_DAY || stats.clean.length >= MAX_CLEAN_REPORTS) {
    return { ban: false, ignored: true };
  }
  stats.reports.push(now);
  if (verdict === 'clean') stats.clean.push(now);

  const key = targetDevice ? `d:${targetDevice}` : `i:${targetIp}`;
  const list = (reportsByTarget.get(key) || []).filter((r) => now - r.ts < DAY);
  const same = list.find((r) => r.reporter === reporterDevice);
  if (same) {
    same.nsfw = same.nsfw || verdict === 'nsfw';
    same.reason = same.reason === 'minor' ? 'minor' : reason;
    same.ts = now;
  } else {
    list.push({ reporter: reporterDevice, nsfw: verdict === 'nsfw', reason, ts: now });
  }
  reportsByTarget.set(key, list);

  const nsfwCount = list.filter((r) => r.nsfw).length;
  const seriousCount = list.filter((r) => SERIOUS_REASONS.includes(r.reason)).length;

  if (nsfwCount >= NSFW_THRESHOLD || seriousCount >= SERIOUS_THRESHOLD || list.length >= ANY_THRESHOLD) {
    const banReason = pickReason(list);
    const reporters = list.map((r) => r.reporter);
    reportsByTarget.delete(key);
    return { ban: true, reporters, reason: banReason, ...applyBan(targetDevice, targetIp, { reason: banReason }) };
  }
  return { ban: false, count: list.length };
}

// ---------- Admin review queue ----------
export function queueReport({ reason, targetDevice, targetIp, reporterDevice, verdict, image, count }) {
  const idx = queue.findIndex(
    (q) => q.targetDevice === targetDevice && q.reporterDevice === reporterDevice
  );
  if (idx !== -1) queue.splice(idx, 1);
  queue.unshift({
    id: crypto.randomUUID(),
    ts: Date.now(),
    reason,
    targetDevice,
    targetIp,
    reporterDevice,
    verdict,
    count: count || 1,
    urgent: reason === 'minor',
    image: typeof image === 'string' && image.length < 300_000 ? image : null,
  });
  while (queue.length > QUEUE_MAX) queue.pop();
}

export function getQueue() {
  const now = Date.now();
  return queue
    .filter((q) => now - q.ts < DAY)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.ts - a.ts)
    .map((q) => ({
      id: q.id,
      ts: q.ts,
      reason: q.reason,
      verdict: q.verdict,
      count: q.count,
      urgent: q.urgent,
      image: q.image,
      target: String(q.targetDevice || '').slice(0, 8),
    }));
}

export function removeQueueItem(id) {
  const idx = queue.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  return queue.splice(idx, 1)[0];
}

// Is target ki saari queue entries hatao, reporters ki list wapas do
export function removeQueueByTarget(targetDevice) {
  const reporters = [];
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].targetDevice === targetDevice) {
      reporters.push(queue[i].reporterDevice);
      queue.splice(i, 1);
    }
  }
  return reporters;
}

// ---------- Admin actions ----------
export function adminBan({ targetDevice, targetIp, permanent, reason }) {
  return applyBan(targetDevice, targetIp, { reason, permanent: !!permanent });
}

export function listBans() {
  const now = Date.now();
  return [...bans.entries()]
    .filter(([, r]) => r.until > now)
    .map(([key, r]) => ({
      key,
      until: r.until,
      permanent: !!r.permanent,
      reason: r.reason || null,
      strikes: r.strikes || 0,
    }))
    .sort((a, b) => b.until - a.until);
}

// Ek key ka ban hatao (usi group ke baaki keys bhi: device + IP)
export function unbanGroup(key) {
  const rec = bans.get(key);
  if (!rec) return false;
  const keys = [...bans.entries()]
    .filter(([k, r]) => k === key || (rec.grp && r.grp === rec.grp))
    .map(([k]) => k);
  keys.forEach((k) => {
    const r = bans.get(k);
    saveBan(k, { ...r, until: 0, permanent: false, strikes: Math.max(0, (r.strikes || 0) - 1) });
  });
  return true;
}

// ---------- NSFW detector (Sightengine, optional) ----------
// Return: 'nsfw' | 'clean' | null (detector off / error)
export async function checkImageNsfw(dataUrl) {
  const user = process.env.SIGHTENGINE_USER;
  const secret = process.env.SIGHTENGINE_SECRET;
  if (!user || !secret || !dataUrl) return null;

  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;

  try {
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 1_500_000) return null;

    const form = new FormData();
    form.append('media', new Blob([buf], { type: `image/${m[1]}` }), 'frame.jpg');
    form.append('models', 'nudity-2.1');
    form.append('api_user', user);
    form.append('api_secret', secret);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.status !== 'success') {
      console.warn('Sightengine error:', data.error?.message || data.status);
      return null;
    }
    const n = data.nudity || {};
    const score = Math.max(n.sexual_activity || 0, n.sexual_display || 0, n.erotica || 0);
    return score >= 0.7 ? 'nsfw' : 'clean';
  } catch (e) {
    console.warn('NSFW check failed:', e.message);
    return null;
  }
}

// ---------- Chat text filter ----------
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|net|org|io|xyz|me|link|ly)\b)/i;
const BAD_WORDS = ['porn', 'nude', 'nudes', 'xxx', 'onlyfans', 'sexchat']; // apne hisaab se badhao

export function cleanMessage(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim().slice(0, 500);
  if (!t) return null;
  if (LINK_RE.test(t)) return null;
  const lower = t.toLowerCase();
  if (BAD_WORDS.some((w) => lower.includes(w))) return null;
  return t;
}

// ---------- Memory cleanup ----------
setInterval(() => {
  const now = Date.now();
  for (const [ip, m] of ipDevices) {
    for (const [d, t] of m) if (now - t > HOUR) m.delete(d);
    if (m.size === 0) ipDevices.delete(ip);
  }
  for (const [k, list] of reportsByTarget) {
    const fresh = list.filter((r) => now - r.ts < DAY);
    if (fresh.length) reportsByTarget.set(k, fresh);
    else reportsByTarget.delete(k);
  }
  for (const [k, s] of reporterStats) {
    s.reports = s.reports.filter((t) => now - t < DAY);
    s.clean = s.clean.filter((t) => now - t < DAY);
    if (!s.reports.length && !s.clean.length) reporterStats.delete(k);
  }
  for (let i = queue.length - 1; i >= 0; i--) {
    if (now - queue[i].ts > DAY) queue.splice(i, 1); // purane screenshots hata do
  }
}, HOUR).unref();