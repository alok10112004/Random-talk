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

// 🔥 CORS FIX: Sabhi Vercel links aur localhost ko allow karo
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean); // Khali values hata do

const corsOptions = {
  origin: function (origin, callback) {
    // Agar origin nahi hai (jaise mobile apps ya postman), ya allowed list me hai
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// ---- Middleware ----
app.use(cors(corsOptions));
app.use(express.json());

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/countries', countryRoutes);

app.get('/', (req, res) => res.send('Random Talk server is running 🚀'));

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