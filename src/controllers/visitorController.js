import Visitor from '../models/Visitor.js';
import Newspaper from '../models/Newspaper.js';
import { uploadPhotoToR2, deletePhotoFromR2 } from '../services/cloudflareStorage.js';

export const registerClick = async (req, res) => {
  try {
    const newspaper = await Newspaper.findOne({ linkId: req.params.linkId });
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });
    res.json({ success: true, message: 'Click registered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewspaperByLinkId = async (req, res) => {
  try {
    const newspaper = await Newspaper.findOne({ linkId: req.params.linkId });
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });
    res.json({ success: true, data: newspaper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const captureVisitor = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { sessionId } = req.body;
    const file = req.file;

    const newspaper = await Newspaper.findOne({ linkId });
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });

    if (!file) {
      await Visitor.create({ newspaperId: newspaper._id, linkId, sessionId: sessionId || 'unknown', permissionStatus: 'denied' });
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const photoUrl = await uploadPhotoToR2(file.buffer, file.originalname, file.mimetype);

    const visitor = await Visitor.create({
      newspaperId: newspaper._id,
      linkId,
      sessionId: sessionId || 'unknown',
      photoUrl,
      permissionStatus: 'granted',
    });

    res.status(201).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({}).sort({ createdAt: -1 }).populate('newspaperId', 'title');
    res.json({ success: true, data: visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVisitorPhoto = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.photoUrl) {
      await deletePhotoFromR2(visitor.photoUrl);
      visitor.photoUrl = null;
      await visitor.save();
    }
    res.json({ success: true, message: 'Photo deleted securely' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewspaperAnalytics = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });

    const visitors = await Visitor.find({ newspaperId: req.params.id }).sort({ createdAt: -1 });
    
    const uniqueSessions = new Set(visitors.map(v => v.sessionId)).size;
    const successfulCaptures = visitors.filter(v => v.permissionStatus === 'granted').length;
    const deniedPermissions = visitors.filter(v => v.permissionStatus === 'denied').length;

    res.json({
      success: true,
      data: {
        totalClicks: visitors.length,
        uniqueVisitors: uniqueSessions,
        successfulCaptures,
        deniedPermissions,
        recentVisitors: visitors.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
