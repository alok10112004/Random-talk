import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Build folder (dist) serve karo
app.use(express.static(path.join(__dirname, 'dist')));

// API ya file wali request ko HTML mat bhejo
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || path.extname(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

// Baaki sab requests React Router ko
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend Server Ready on port ${PORT}`);
});