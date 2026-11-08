import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/credentials', async (req, res) => {
  try {
    const keyId = process.env.TURN_KEY_ID;
    const token = process.env.TURN_KEY_API_TOKEN;

    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }), 
      }
    );

    if (!response.ok) {
      console.error('❌ Cloudflare Error:', response.status);
      return res.status(response.status).json({ error: 'Cloudflare failed' });
    }

    const data = await response.json();
    // 🔥 Cloudflare object bhejta hai, use direct array banao
    res.json(data.iceServers); 

  } catch (error) {
    console.error('❌ TURN Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch TURN credentials' });
  }
});

export default router;