let waiting = [];
let onlineCount = 0;

const userReports = {};
const REPORTS_TO_BLOCK = 5;
const MIN_BLOCK_HOURS = 1;
const MAX_BLOCK_HOURS = 5;

function getRandomBlockDuration() {
  const hours = Math.floor(Math.random() * (MAX_BLOCK_HOURS - MIN_BLOCK_HOURS + 1)) + MIN_BLOCK_HOURS;
  return hours * 60 * 60 * 1000;
}

function isBlocked(userId) {
  const record = userReports[userId];
  if (!record) return null;
  if (record.blockedUntil && record.blockedUntil > Date.now()) return record.blockedUntil;
  if (record.blockedUntil && record.blockedUntil <= Date.now()) {
    record.blockedUntil = null;
    record.count = 0;
  }
  return null;
}

// 🔥 Naya function: Matchmaking logic ko alag nikaal diya taaki bar-bar use kar sakein
function attemptMatch(socket) {
  // Agar socket disconnect ho gaya hai toh kuch mat karo
  if (!socket.connected) return;

  // Purani entry hata do
  waiting = waiting.filter((w) => w.socket.id !== socket.id);

  const myCountry = socket.data.country;
  let partnerIndex = waiting.findIndex((w) => w.country === myCountry && w.socket.connected);

  if (partnerIndex === -1 && myCountry !== 'ANY') {
    partnerIndex = waiting.findIndex((w) => w.country === 'ANY' && w.socket.connected);
  }
  if (partnerIndex === -1 && myCountry === 'ANY') {
    partnerIndex = waiting.findIndex((w) => w.socket.connected);
  }

  if (partnerIndex !== -1) {
    const partner = waiting[partnerIndex].socket;
    waiting.splice(partnerIndex, 1);

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
    console.log(`✅ matched: ${socket.id} <-> ${partner.id}`);
  } else {
    waiting.push({ socket, country: myCountry });
    socket.emit('waiting');
    console.log(`⏳ waiting: ${socket.id}`);
  }
}

export default function videoChat(io, socket) {
  console.log('videoChat init for', socket.id);

  onlineCount++;
  io.emit('online-count', onlineCount);

  socket.data.country = 'ANY';
  socket.data.userId = null;
  socket.data.cooldownTimer = null; 

  socket.on('identify', ({ userId }) => {
    socket.data.userId = userId;
    const blockedUntil = isBlocked(userId);
    if (blockedUntil) {
      socket.emit('you-are-blocked', { until: blockedUntil, remainingMs: blockedUntil - Date.now() });
    }
  });

  socket.on('set-country', ({ country }) => {
    socket.data.country = country || 'ANY';
  });

  // ---- Find Partner ----
  socket.on('find-partner', () => {
    if (socket.data.userId) {
      const blockedUntil = isBlocked(socket.data.userId);
      if (blockedUntil) {
        socket.emit('you-are-blocked', { until: blockedUntil, remainingMs: blockedUntil - Date.now() });
        return;
      }
    }
    attemptMatch(socket); // 🔥 Naya function call kiya
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  // ---- Next (Skip) ----
  socket.on('next', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    });

    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    if (socket.data.cooldownTimer) clearTimeout(socket.data.cooldownTimer);

    console.log(`⏭️ ${socket.id} skipped. Cooldown for 3s...`);
    
    // 3 second wait karega, phir khud match karwayega
    socket.data.cooldownTimer = setTimeout(() => {
      if (socket.connected) {
        console.log(`🔄 Cooldown over, finding partner for: ${socket.id}`);
        attemptMatch(socket); // 🔥 Timer khatam hone pe direct match karwao
      }
      socket.data.cooldownTimer = null;
    }, 3000); 
  });

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
  });

  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', { message, from: socket.id });
  });

  // Baaki report aur disconnect ka code same hai...
  socket.on('report', ({ reason, partnerId }) => {
    if (!partnerId) { socket.emit('report-received'); return; }
    if (!userReports[partnerId]) { userReports[partnerId] = { count: 0, blockedUntil: null }; }
    userReports[partnerId].count++;
    const newCount = userReports[partnerId].count;
    let targetSocket = null;
    io.sockets.sockets.forEach((s) => { if (s.data.userId === partnerId) targetSocket = s; });
    if (newCount >= REPORTS_TO_BLOCK) {
      const blockDuration = getRandomBlockDuration();
      userReports[partnerId].blockedUntil = Date.now() + blockDuration;
      if (targetSocket) {
        targetSocket.emit('you-are-blocked', { until: userReports[partnerId].blockedUntil, remainingMs: blockDuration });
        waiting = waiting.filter((w) => w.socket.id !== targetSocket.id);
      }
    }
    socket.emit('report-received');
  });

  socket.on('disconnect', () => {
    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    if (socket.data.cooldownTimer) clearTimeout(socket.data.cooldownTimer);
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online-count', onlineCount);
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => socket.to(roomId).emit('partner-disconnected'));
  });
}