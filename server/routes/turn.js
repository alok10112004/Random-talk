import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/credentials', async (req, res) => {
  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${process.env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TURN_KEY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }), // 24 ghante
      }
    );
    const data = await response.json();
    res.json(data.iceServers);
  } catch (error) {
    console.error('TURN Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;