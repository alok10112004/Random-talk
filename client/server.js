import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Build folder (dist) serve karo
app.use(express.static(path.join(__dirname, 'dist')));

// Baaki saari requests React Router ko bhej do
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend Server Ready on port ${PORT}`); // 🔥 Yahan change kiya hai
});