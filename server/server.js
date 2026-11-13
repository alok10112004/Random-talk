import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import videoChat from './socket/videoChat.js';
import authRoutes from './routes/auth.js';
import countryRoutes from './routes/countries.js';
import { loadBans } from './moderation.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);
app.get('/', (req, res) => res.send('Random Talk server is running 🚀'));

// ---- TURN (cache + rate limit) ----
const turnHits = new Map();
setInterval(() => turnHits.clear(), 10 * 60_000).unref();

function turnRateLimit(req, res, next) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const arr = (turnHits.get(ip) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 20) return res.status(429).json({ error: 'Too many requests' });
  arr.push(now);
  turnHits.set(ip, arr);
  next();
}

let turnCache = { servers: null, expires: 0 };

app.get('/api/turn', turnRateLimit, async (req, res) => {
  try {
    if (turnCache.servers && Date.now() < turnCache.expires) {
      return res.json(turnCache.servers);
    }
    const keyId = process.env.TURN_KEY_ID;
    const token = process.env.TURN_KEY_API_TOKEN;
    if (!keyId || !token) {
      return res.status(500).json({ error: 'Missing TURN keys in Variables' });
    }
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 14400 }), // 4 ghante
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error('Cloudflare TURN error:', data);
      return res.status(500).json({ error: 'Cloudflare TURN failed' });
    }
    turnCache = { servers: data.iceServers, expires: Date.now() + 30 * 60_000 };
    res.json(data.iceServers);
  } catch (err) {
    console.error('TURN error:', err);
    res.status(500).json({ error: 'TURN error' });
  }
});

// ---- Socket.io ----
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 2e6,
});

io.on('connection', (socket) => {
  videoChat(io, socket);
});

// ---- DB + Start ----
const PORT = process.env.PORT || 5000;

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB connected → random-talk');
      await loadBans();
    })
    .catch((err) => console.error('❌ Mongo error (skipping):', err.message));
}

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Random Talk server on port ${PORT}`));