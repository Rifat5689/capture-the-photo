import express from 'express';
import multer from 'multer';
import { registerClick, captureVisitor, getNewspaperByLinkId, generateSharePreview, captureVideo } from '../controllers/visitorController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // increased for video
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

router.get('/:linkId', getNewspaperByLinkId);
router.get('/:linkId/share', generateSharePreview);
router.post('/:linkId/click', registerClick);
router.post('/:linkId/capture', upload.single('photo'), captureVisitor);
router.post('/:linkId/video', upload.single('video'), captureVideo);

export default router;
