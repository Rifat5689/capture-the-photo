import express from 'express';
import { getVisitors, deleteVisitorPhoto } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getVisitors);
router.delete('/:id/photo', protect, deleteVisitorPhoto);

export default router;
