import {
  getClientIp,
  isValidDeviceId,
  noteDevice,
  getBanInfo,
  recordReport,
  queueReport,
  removeQueueByTarget,
  checkImageNsfw,
  makeLimiter,
  cleanMessage,
  VALID_REASONS,
} from '../moderation.js';

let waiting = [];
let onlineCount = 0;
const ipSockets = new Map();
const MAX_SOCKETS_PER_IP = 30;

const WARNINGS = {
  1: { message: 'Notice', detail: 'Be respectful.' },
  3: { message: 'FINAL WARNING', detail: 'Next report will result in ban.' },
};

const countryOk = (a, b) => a === b || a === 'ANY' || b === 'ANY';

function removeWaiting(id) {
  waiting = waiting.filter((w) => w.socket.id !== id);
}

function leaveAllRooms(s) {
  [...s.rooms].filter((r) => r !== s.id).forEach((r) => s.leave(r));
}

function tryMatch(socket) {
  removeWaiting(socket.id);
  const myCountry = socket.data.country;
  const idx = waiting.findIndex(
    (w) =>
      w.socket.connected &&
      w.socket.id !== socket.id &&
      countryOk(myCountry, w.country) &&
      socket.data.avoid !== w.socket.id &&
      w.socket.data.avoid !== socket.id
  );
  if (idx !== -1) {
    const partner = waiting[idx].socket;
    waiting.splice(idx, 1);
    pairSockets(socket, partner);
  } else {
    waiting.push({ socket, country: myCountry });
    socket.emit('waiting');
  }
}

function detach(io, socket) {
  const p = socket.data.partner;
  const rooms = [...socket.rooms].filter((r) => r !== socket.id);
  rooms.forEach((roomId) => {
    socket.to(roomId).emit('partner-left');
    io.in(roomId).socketsLeave(roomId);
  });
  socket.data.partner = null;

  if (p) {
    const other = io.sockets.sockets.get(p.id);
    if (other && other.data.partner?.id === socket.id) {
      other.data.partner = null;
      if (other.connected) tryMatch(other);
    }
  }
}

function remember(socket, partnerSocket) {
  const rec = {
    id: partnerSocket.id,
    deviceId: partnerSocket.data.deviceId,
    ip: partnerSocket.data.ip,
  };
  const h = socket.data.history || [];
  socket.data.history = [rec, ...h.filter((x) => x.id !== rec.id)].slice(0, 10);
}

function pairSockets(socketA, socketB) {
  const roomId = `${socketA.id}#${socketB.id}`;
  socketA.join(roomId);
  socketB.join(roomId);

  socketA.data.partner = { id: socketB.id, deviceId: socketB.data.deviceId, ip: socketB.data.ip };
  socketB.data.partner = { id: socketA.id, deviceId: socketA.data.deviceId, ip: socketA.data.ip };
  remember(socketA, socketB);
  remember(socketB, socketA);

  socketA.emit('matched', {
    roomId,
    partnerId: socketB.id,
    initiator: true,
    partnerCountry: socketB.data.country || 'ANY',
  });
  socketB.emit('matched', {
    roomId,
    partnerId: socketA.id,
    initiator: false,
    partnerCountry: socketA.data.country || 'ANY',
  });
  console.log(`✅ matched: ${socketA.id} <-> ${socketB.id}`);
}

function blockPayload(info) {
  return {
    until: info.until,
    remainingMs: info.until - Date.now(),
    reason: info.reason,
    permanent: info.permanent,
  };
}

function kick(io, s, info) {
  removeWaiting(s.id);
  s.emit('you-are-blocked', blockPayload(info));
  detach(io, s);
  setTimeout(() => s.disconnect(true), 500);
}

// Jitne connected users ban list me aate hain unko nikalo
export function enforceBans(io) {
  io.sockets.sockets.forEach((s) => {
    const info = getBanInfo(s.data.deviceId, s.data.ip);
    if (info) kick(io, s, info);
  });
}

// Report karne walon ko batao ki action liya gaya
export function notifyReporters(io, deviceIds = []) {
  const set = new Set(deviceIds.filter(Boolean));
  if (!set.size) return;
  io.sockets.sockets.forEach((s) => {
    if (set.has(s.data.deviceId)) s.emit('report-action');
  });
}

// Sirf unhi logo ko report kar sakte ho jinse tum match hue the
function findTarget(socket, partnerId) {
  if (partnerId) return (socket.data.history || []).find((h) => h.id === partnerId) || null;
  return socket.data.partner;
}

export default function videoChat(io, socket) {
  const deviceId = socket.handshake.auth?.deviceId;
  const ip = getClientIp(socket);

  socket.data.ip = ip;
  socket.data.country = 'ANY';
  socket.data.userId = null;
  socket.data.partner = null;
  socket.data.history = [];
  socket.data.avoid = null;

  if (!isValidDeviceId(deviceId)) {
    socket.emit('outdated-client');
    setTimeout(() => socket.disconnect(true), 300);
    return;
  }
  socket.data.deviceId = deviceId;
  noteDevice(ip, deviceId);

  const info = getBanInfo(deviceId, ip);
  if (info) {
    socket.emit('you-are-blocked', blockPayload(info));
    setTimeout(() => socket.disconnect(true), 300);
    return;
  }

  const count = (ipSockets.get(ip) || 0) + 1;
  if (count > MAX_SOCKETS_PER_IP) {
    socket.emit('too-many-connections');
    setTimeout(() => socket.disconnect(true), 300);
    return;
  }
  ipSockets.set(ip, count);

  onlineCount++;
  io.emit('online-count', onlineCount);
  console.log(`🛡️ connect ${socket.id} ip=${ip}`);

  const limits = {
    find: makeLimiter(5, 10_000),
    chat: makeLimiter(8, 5_000),
    signal: makeLimiter(300, 10_000),
    report: makeLimiter(5, 60_000),
  };

  socket.on('identify', ({ userId } = {}) => {
    socket.data.userId = typeof userId === 'string' ? userId.slice(0, 100) : null;
  });

  socket.on('set-country', ({ country } = {}) => {
    socket.data.country = String(country || 'ANY').slice(0, 40);
  });

  socket.on('find-partner', () => {
    if (!limits.find()) return;
    const b = getBanInfo(socket.data.deviceId, socket.data.ip);
    if (b) return kick(io, socket, b);
    if (socket.data.partner) return;
    tryMatch(socket);
  });

  socket.on('signal', ({ roomId, data } = {}) => {
    if (!limits.signal()) return;
    if (!roomId || !socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('signal', { data });
  });

  socket.on('next', () => {
    if (!limits.find()) return;
    detach(io, socket);
    tryMatch(socket);
  });

  socket.on('stop', () => {
    removeWaiting(socket.id);
    detach(io, socket);
  });

  socket.on('chat-message', ({ roomId, message } = {}) => {
    if (!limits.chat()) return;
    if (!roomId || !socket.rooms.has(roomId)) return;
    const text = cleanMessage(message);
    if (!text) {
      socket.emit('message-blocked');
      return;
    }
    socket.to(roomId).emit('chat-message', { message: text, from: socket.id });
  });

  socket.on('report', async ({ partnerId, reason, image } = {}) => {
    socket.emit('report-received');
    if (!limits.report()) return;

    const target = findTarget(socket, partnerId);
    if (!target || !target.deviceId) return;
    socket.data.avoid = target.id;

    const cleanReason = VALID_REASONS.includes(reason) ? reason : 'harassment';
    const img = typeof image === 'string' && image.length < 1_500_000 ? image : null;
    const verdict = img ? await checkImageNsfw(img) : null;

    const result = recordReport({
      targetDevice: target.deviceId,
      targetIp: target.ip,
      reporterDevice: socket.data.deviceId,
      verdict,
      reason: cleanReason,
    });
    console.log(
      `🚩 report reason=${cleanReason} target=${target.id} verdict=${verdict} -> ${
        result.ban ? 'BAN' : result.ignored ? 'ignored' : `counted(${result.count})`
      }`
    );
    if (cleanReason === 'minor') console.warn(`⚠️ MINOR report on target=${target.id}, /admin check karo`);

    if (result.ban) {
      removeQueueByTarget(target.deviceId);
      enforceBans(io);
      notifyReporters(io, result.reporters);
    } else if (!result.ignored) {
      queueReport({
        reason: cleanReason,
        targetDevice: target.deviceId,
        targetIp: target.ip,
        reporterDevice: socket.data.deviceId,
        verdict,
        image: img,
        count: result.count,
      });
      if (result.count >= 2) {
        const targetSocket = io.sockets.sockets.get(target.id);
        if (targetSocket && targetSocket.data.deviceId === target.deviceId) {
          const level = result.count === 2 ? 1 : 3;
          targetSocket.emit('warning', { level, ...WARNINGS[level] });
        }
      }
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) socket.to(roomId).emit('partner-left');
    }
  });

  socket.on('disconnect', () => {
    removeWaiting(socket.id);
    const p = socket.data.partner;
    socket.data.partner = null;
    if (p) {
      const other = io.sockets.sockets.get(p.id);
      if (other && other.data.partner?.id === socket.id) {
        other.data.partner = null;
        leaveAllRooms(other);
        if (other.connected) tryMatch(other);
      }
    }
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online-count', onlineCount);

    const left = (ipSockets.get(ip) || 1) - 1;
    if (left <= 0) ipSockets.delete(ip);
    else ipSockets.set(ip, left);
  });
}