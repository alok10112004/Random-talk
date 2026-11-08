import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/credentials', async (req, res) => {
  try {
    const keyId = process.env.TURN_KEY_ID;
    const token = process.env.TURN_KEY_API_TOKEN;

    // Check karo ki variables khali toh nahi hain
    if (!keyId || !token) {
      console.error('❌ Missing TURN Keys in Environment Variables');
      return res.status(500).json({ error: 'Server config missing' });
    }

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

    // Agar Cloudflare ne error diya, toh log karo
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudflare Error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Cloudflare API failed', details: errorText });
    }

    const data = await response.json();
    console.log('✅ TURN Data successfully fetched');
    
    // Data ko frontend ko bhejo
    res.json(data.iceServers); 

  } catch (error) {
    console.error('❌ TURN Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch TURN credentials', message: error.message });
  }
});

export default router;