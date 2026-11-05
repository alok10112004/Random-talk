let waiting = [];
let onlineCount = 0;

// Report tracking — in-memory
const userReports = {};

const REPORTS_TO_BLOCK = 5;
const MIN_BLOCK_HOURS = 1;
const MAX_BLOCK_HOURS = 5;

function getRandomBlockDuration() {
  const hours =
    Math.floor(Math.random() * (MAX_BLOCK_HOURS - MIN_BLOCK_HOURS + 1)) +
    MIN_BLOCK_HOURS;
  return hours * 60 * 60 * 1000;
}

function isBlocked(userId) {
  const record = userReports[userId];
  if (!record) return null;
  if (record.blockedUntil && record.blockedUntil > Date.now()) {
    return record.blockedUntil;
  }
  if (record.blockedUntil && record.blockedUntil <= Date.now()) {
    record.blockedUntil = null;
    record.count = 0;
  }
  return null;
}

export default function videoChat(io, socket) {
  console.log('videoChat init for', socket.id);

  onlineCount++;
  io.emit('online-count', onlineCount);

  socket.data.country = 'ANY';
  socket.data.userId = null;
  // 🔥 Cooldown timer track karne ke liye
  socket.data.cooldownTimer = null; 

  // ---- Identify ----
  socket.on('identify', ({ userId }) => {
    socket.data.userId = userId;
    console.log(`🆔 ${socket.id} identified as ${userId}`);

    const blockedUntil = isBlocked(userId);
    if (blockedUntil) {
      socket.emit('you-are-blocked', {
        until: blockedUntil,
        remainingMs: blockedUntil - Date.now(),
      });
    }
  });

  socket.on('set-country', ({ country }) => {
    socket.data.country = country || 'ANY';
    console.log(`🌍 ${socket.id} set country → ${socket.data.country}`);
  });

  // ---- Find partner ----
  socket.on('find-partner', () => {
    // Blocked check
    if (socket.data.userId) {
      const blockedUntil = isBlocked(socket.data.userId);
      if (blockedUntil) {
        socket.emit('you-are-blocked', {
          until: blockedUntil,
          remainingMs: blockedUntil - Date.now(),
        });
        return;
      }
    }

    // Purani entry hata do
    waiting = waiting.filter((w) => w.socket.id !== socket.id);

    const myCountry = socket.data.country;

    // Same country wala dhundho
    let partnerIndex = waiting.findIndex(
      (w) => w.country === myCountry && w.socket.connected
    );

    // ANY fallback
    if (partnerIndex === -1 && myCountry !== 'ANY') {
      partnerIndex = waiting.findIndex(
        (w) => w.country === 'ANY' && w.socket.connected
      );
    }

    // Koi bhi
    if (partnerIndex === -1 && myCountry === 'ANY') {
      partnerIndex = waiting.findIndex((w) => w.socket.connected);
    }

    if (partnerIndex !== -1) {
      const partner = waiting[partnerIndex].socket;
      waiting.splice(partnerIndex, 1);

      // Agar partner ka koi cooldown chal raha hai toh use clear karo
      if (partner.data.cooldownTimer) {
        clearTimeout(partner.data.cooldownTimer);
        partner.data.cooldownTimer = null;
      }

      const roomId = `${socket.id}#${partner.id}`;

      socket.join(roomId);
      partner.join(roomId);

      socket.emit('matched', {
        roomId,
        partnerId: partner.id,
        initiator: true,
        partnerCountry: partner.data.country || 'ANY',
      });

      partner.emit('matched', {
        roomId,
        partnerId: socket.id,
        initiator: false,
        partnerCountry: socket.data.country || 'ANY',
      });

      console.log(
        `✅ matched: ${socket.id}(${myCountry}) <-> ${partner.id}(${partner.data.country})`
      );
    } else {
      waiting.push({ socket, country: myCountry });
      socket.emit('waiting');
      console.log(`⏳ waiting: ${socket.id} | country=${myCountry} | queue=${waiting.length}`);
    }
  });

  // ---- Signal ----
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  // ---- Next (SKIP LOGIC WITH COOLDOWN) ----
  socket.on('next', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    });

    // 🔥 SKIP COOLDOWN: 3 second ka wait taaki wapas usi se na jud jaye
    waiting = waiting.filter((w) => w.socket.id !== socket.id); // Pehle queue se hatao
    
    // Agar pehle se koi timer chal raha hai toh clear karo
    if (socket.data.cooldownTimer) clearTimeout(socket.data.cooldownTimer);

    console.log(`⏭️ ${socket.id} skipped. Cooldown for 3s...`);
    
    socket.data.cooldownTimer = setTimeout(() => {
      // 3 second baad check karo ki user connect hai ya nahi
      if (socket.connected) {
        console.log(`🔄 Cooldown over, joining queue: ${socket.id}`);
        // Wapas queue me daal do (frontend se emit find-partner bhi ho sakta hai, par safety ke liye)
        socket.emit('waiting'); 
      }
      socket.data.cooldownTimer = null;
    }, 3000); 
  });

  // ---- Stop ----
  socket.on('stop', () => {
    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    if (socket.data.cooldownTimer) {
      clearTimeout(socket.data.cooldownTimer);
      socket.data.cooldownTimer = null;
    }
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    });
    console.log(`⏹ stopped: ${socket.id}`);
  });

  // ---- Chat ----
  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', { message, from: socket.id });
  });

  // ---- Report ----
  socket.on('report', ({ reason, partnerId }) => {
    // ... (report wala code same rahega, isme koi change nahi hai)
    console.log(`🚩 REPORT: ${socket.data.userId} reported ${partnerId} | reason: ${reason}`);
    if (!partnerId) { socket.emit('report-received'); return; }
    if (!userReports[partnerId]) { userReports[partnerId] = { count: 0, blockedUntil: null }; }
    userReports[partnerId].count++;
    const newCount = userReports[partnerId].count;
    let targetSocket = null;
    io.sockets.sockets.forEach((s) => { if (s.data.userId === partnerId) { targetSocket = s; } });

    if (newCount >= REPORTS_TO_BLOCK) {
      const blockDuration = getRandomBlockDuration();
      const blockedUntil = Date.now() + blockDuration;
      userReports[partnerId].blockedUntil = blockedUntil;
      if (targetSocket) {
        targetSocket.emit('you-are-blocked', { until: blockedUntil, remainingMs: blockDuration, durationHours: Math.round(blockDuration / (60 * 60 * 1000)) });
        waiting = waiting.filter((w) => w.socket.id !== targetSocket.id);
      }
    } else if (newCount === 4) {
      if (targetSocket) targetSocket.emit('warning', { level: 3, message: 'FINAL WARNING', detail: 'Next report will result in ban.' });
    } else if (newCount === 3) {
      if (targetSocket) targetSocket.emit('warning', { level: 2, message: 'Warning', detail: 'Please follow guidelines.' });
    } else if (newCount === 2) {
      if (targetSocket) targetSocket.emit('warning', { level: 1, message: 'Notice', detail: 'Be respectful.' });
    }
    socket.emit('report-received');
  });

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    if (socket.data.cooldownTimer) clearTimeout(socket.data.cooldownTimer);
    
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online-count', onlineCount);
    console.log(`🔴 ${socket.id} disconnected | online: ${onlineCount}`);

    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
    });
  });
}