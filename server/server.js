import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import videoChat from './socket/videoChat.js';
import authRoutes from './routes/auth.js';
import countryRoutes from './routes/countries.js';
import turnRoutes from './routes/turn.js'; 

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔥 CORS FIX: Vercel ko allow karo
const allowedOrigins = [
  'https://random-talk-psi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/turn', turnRoutes); 

app.get('/', (req, res) => res.send('Random Talk server is running 🚀'));

// 🔥 TEST ROUTE
app.get('/test-turn', async (req, res) => {
  try {
    const keyId = process.env.TURN_KEY_ID;
    const token = process.env.TURN_KEY_API_TOKEN;
    if (!keyId || !token) {
      return res.status(500).json({ error: 'Missing TURN keys in Variables' });
    }
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 86400 })
    });
    const data = await response.json();
    res.json(data.iceServers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Socket.io ----
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
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

server.listen(PORT, () => console.log(`🚀 Random Talk server on http://localhost:${PORT}`));