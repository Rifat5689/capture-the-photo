import express from 'express';
import { 
  getNewspapers, 
  createNewspaper, 
  getNewspaperById, 
  updateNewspaper, 
  deleteNewspaper, 
  togglePublish 
} from '../controllers/newspaperController.js';
import { getNewspaperAnalytics } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNewspapers)
  .post(protect, createNewspaper);

router.route('/:id')
  .get(protect, getNewspaperById)
  .put(protect, updateNewspaper)
  .delete(protect, deleteNewspaper);

router.post('/:id/publish', protect, togglePublish);
router.get('/:id/analytics', protect, getNewspaperAnalytics);

export default router;
