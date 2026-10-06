import express from 'express';
import { getVisitors, deleteVisitorPhoto, deleteVisitor, deleteAllVisitors, getClicks } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getVisitors);
router.get('/clicks', protect, getClicks);
router.delete('/all/data', protect, deleteAllVisitors);
router.delete('/:id/photo', protect, deleteVisitorPhoto);
router.delete('/:id', protect, deleteVisitor);

export default router;
