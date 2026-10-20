import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
  ]);
});

export default router;