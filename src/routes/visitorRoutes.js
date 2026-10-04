import express from 'express';
import multer from 'multer';
import { registerClick, captureVisitor, getNewspaperByLinkId } from '../controllers/visitorController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.get('/:linkId', getNewspaperByLinkId);
router.post('/:linkId/click', registerClick);
router.post('/:linkId/capture', upload.single('photo'), captureVisitor);

export default router;
