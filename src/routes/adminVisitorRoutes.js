import express from 'express';
import { getVisitors, deleteVisitorPhoto, deleteVisitorVideo, deleteAllMedia, getClicks } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getVisitors);
router.get('/clicks', protect, getClicks);
router.delete('/media/all', protect, deleteAllMedia);
router.delete('/:id/photo', protect, deleteVisitorPhoto);
router.delete('/:id/video', protect, deleteVisitorVideo);

export default router;
