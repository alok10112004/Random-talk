import mongoose from 'mongoose';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---------- Settings ----------
const BAN_STEPS = [
  Number(process.env.BAN_FIRST_MINUTES || 60) * MIN, // 1st ban
  24 * HOUR,                                         // 2nd
  7 * DAY,                                           // 3rd
  30 * DAY,                                          // 4th+
];
const IP_MAX_BAN = 24 * HOUR;   // IP par max itna ban (shared IP ka nuksan kam)
const IP_SHARED_LIMIT = 15;     // ek IP par itne devices dikhe to IP ban skip
const NSFW_THRESHOLD = Number(process.env.REPORT_NSFW_THRESHOLD || 2);
const ANY_THRESHOLD = Number(process.env.REPORT_ANY_THRESHOLD || 4);
const MAX_REPORTS_PER_DAY = 10;
const MAX_CLEAN_REPORTS = 4;

// ---------- Storage ----------
const bans = new Map();            // key -> { until, strikes }
const reportsByTarget = new Map(); // key -> [{ reporter, nsfw, ts }]
const reporterStats = new Map();   // deviceId -> { reports: [], clean: [] }
const ipDevices = new Map();       // ip -> Map(deviceId -> lastSeen)

const banSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  until: { type: Number, default: 0 },
  strikes: { type: Number, default: 0 },
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
    docs.forEach((d) => bans.set(d.key, { until: d.until, strikes: d.strikes }));
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
export function checkBan(deviceId, ip) {
  const now = Date.now();
  let until = 0;
  for (const key of [deviceId ? `d:${deviceId}` : null, ip ? `i:${ip}` : null]) {
    if (!key) continue;
    const rec = bans.get(key);
    if (rec && rec.until > now && rec.until > until) until = rec.until;
  }
  return until;
}

function applyBan(deviceId, ip) {
  const now = Date.now();
  const dKey = deviceId ? `d:${deviceId}` : null;
  const iKey = ip ? `i:${ip}` : null;
  const dRec = dKey ? bans.get(dKey) : null;
  const iRec = iKey ? bans.get(iKey) : null;

  const strikes = (dKey ? dRec?.strikes || 0 : iRec?.strikes || 0) + 1;
  const duration = BAN_STEPS[Math.min(strikes - 1, BAN_STEPS.length - 1)];

  if (dKey) saveBan(dKey, { until: now + duration, strikes });
  if (iKey && !isSharedIp(ip)) {
    saveBan(iKey, {
      until: now + Math.min(duration, IP_MAX_BAN),
      strikes: dKey ? iRec?.strikes || 0 : strikes,
    });
  } else if (iKey) {
    console.log(`⚠️ IP ${ip} shared lag raha hai, IP ban skip kiya (sirf device ban)`);
  }
  return { until: now + duration, strikes };
}

// ---------- Reports ----------
export function recordReport({ targetDevice, targetIp, reporterDevice, verdict }) {
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
    same.ts = now;
  } else {
    list.push({ reporter: reporterDevice, nsfw: verdict === 'nsfw', ts: now });
  }
  reportsByTarget.set(key, list);

  const nsfwCount = list.filter((r) => r.nsfw).length;
  if (nsfwCount >= NSFW_THRESHOLD || list.length >= ANY_THRESHOLD) {
    reportsByTarget.delete(key);
    return { ban: true, ...applyBan(targetDevice, targetIp) };
  }
  return { ban: false, count: list.length };
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
}, HOUR).unref();