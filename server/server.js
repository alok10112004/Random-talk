import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import videoChat from './socket/videoChat.js';
import authRoutes from './routes/auth.js';
import countryRoutes from './routes/countries.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);

app.get('/', (req, res) => res.send('Random Talk server is running 🚀'));

// ---- TURN credentials (Cloudflare) ----
async function getTurnServers(req, res) {
  try {
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
        body: JSON.stringify({ ttl: 86400 }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error('Cloudflare TURN error:', data);
      return res.status(500).json({ error: 'Cloudflare TURN failed', details: data });
    }
    res.json(data.iceServers);
  } catch (err) {
    console.error('TURN error:', err);
    res.status(500).json({ error: err.message });
  }
}

app.get('/api/turn', getTurnServers);
app.get('/test-turn', getTurnServers);

// ---- Socket.io ----
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🟢 connected:', socket.id);
  videoChat(io, socket);
});

// ---- DB + Start ----
const PORT = process.env.PORT || 5000;

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected → random-talk'))
    .catch((err) => console.error('❌ Mongo error (skipping):', err.message));
}

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Random Talk server on port ${PORT}`));