import express from 'express';
import { getObjectFromR2 } from '../services/cloudflareStorage.js';

const router = express.Router();

router.get('/visitors/:file', async (req, res) => {
  try {
    const obj = await getObjectFromR2(`visitors/${req.params.file}`);
    res.set({
      'Content-Type': obj.ContentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(obj.Body);
  } catch (error) {
    res.status(404).json({ success: false, message: 'Image not found' });
  }
});

export default router;
