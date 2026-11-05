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

// 🔥 DONO KO MATCH KARNE KA FUNCTION
function pairSockets(io, socketA, socketB) {
  const roomId = `${socketA.id}#${socketB.id}`;
  socketA.join(roomId);
  socketB.join(roomId);

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

export default function videoChat(io, socket) {
  console.log('videoChat init for', socket.id);

  onlineCount++;
  io.emit('online-count', onlineCount);

  socket.data.country = 'ANY';
  socket.data.userId = null;
  socket.data.lastPartner = null; // 🔥 Naya variable: Pichle partner ko yaad rakhne ke liye

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

    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    const myCountry = socket.data.country;

    let partnerIndex = waiting.findIndex((w) => w.socket.connected && (w.country === myCountry || w.country === 'ANY' || myCountry === 'ANY'));

    if (partnerIndex !== -1) {
      const partner = waiting[partnerIndex].socket;
      waiting.splice(partnerIndex, 1);
      pairSockets(io, socket, partner);
    } else {
      waiting.push({ socket, country: myCountry });
      socket.emit('waiting');
    }
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  // ---- Next (Instant Skip + Rematch) ----
  socket.on('next', () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    });

    // Purane partner ko yaad karo
    const previousPartner = socket.data.lastPartner;
    
    // Queue se nikal do
    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    
    // Partner ko bhi queue me daal do (taaki wo wapas wait kar sake)
    if (previousPartner && previousPartner.connected) {
      if (!waiting.find(w => w.socket.id === previousPartner.id)) {
         waiting.push({ socket: previousPartner, country: previousPartner.data.country });
      }
    }

    const myCountry = socket.data.country;
    let partnerIndex = waiting.findIndex((w) => w.socket.connected && w.socket.id !== socket.id && (w.country === myCountry || w.country === 'ANY' || myCountry === 'ANY'));

    if (partnerIndex !== -1) {
      // Agar queue me koi hai (naya ya purana), turant match karo
      const partner = waiting[partnerIndex].socket;
      waiting.splice(partnerIndex, 1);
      pairSockets(io, socket, partner);
    } else {
      // Agar koi nahi hai, toh wait karo
      waiting.push({ socket, country: myCountry });
      socket.emit('waiting');
    }
  });

  socket.on('stop', () => {
    waiting = waiting.filter((w) => w.socket.id !== socket.id);
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('partner-disconnected');
      socket.leave(roomId);
    });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', { message, from: socket.id });
  });

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
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online-count', onlineCount);
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);
    rooms.forEach((roomId) => socket.to(roomId).emit('partner-disconnected'));
  });
}