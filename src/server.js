import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import newspaperRoutes from './routes/newspaperRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import adminVisitorRoutes from './routes/adminVisitorRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import Newspaper from './models/Newspaper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Middleware
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: true, // This automatically allows any origin to connect, solving all CORS problems
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'NewsLink Capture API running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/newspapers', newspaperRoutes);
app.use('/api/admin/visitors', adminVisitorRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/media', mediaRoutes);

// Social media crawler detection - serve OG meta tags for link previews
const CRAWLER_AGENTS = [
  'facebookexternalhit', 'Facebot', 'WhatsApp', 'Twitterbot',
  'LinkedInBot', 'Slackbot', 'TelegramBot', 'Discordbot',
  'Pinterest', 'Googlebot', 'bingbot', 'Applebot'
];

const isCrawler = (userAgent) => {
  if (!userAgent) return false;
  return CRAWLER_AGENTS.some(bot => userAgent.includes(bot));
};

const escapeHtml = (str) => {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

app.get('/news/:slug', async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  if (!isCrawler(userAgent)) {
    return next(); // Let SPA handle it for normal users
  }

  try {
    const newspaper = await Newspaper.findOne({ linkId: req.params.slug });
    if (!newspaper) return next();

    const title = escapeHtml(newspaper.headline || newspaper.title || 'Breaking News');
    const description = escapeHtml(newspaper.summary || 'Read the full story here...');
    const image = newspaper.coverImage || '';
    const siteUrl = `${req.protocol}://${req.get('host')}`;
    const pageUrl = `${siteUrl}/news/${req.params.slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="NewsLink">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="description" content="${description}">
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${image}" alt="${title}">
</body>
</html>`;

    return res.send(html);
  } catch (error) {
    console.error('Crawler OG meta error:', error);
    return next();
  }
});

// Also handle /news/:slug/view for crawlers
app.get('/news/:slug/view', async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  if (!isCrawler(userAgent)) {
    return next();
  }

  try {
    const newspaper = await Newspaper.findOne({ linkId: req.params.slug });
    if (!newspaper) return next();

    const title = escapeHtml(newspaper.headline || newspaper.title || 'Breaking News');
    const description = escapeHtml(newspaper.summary || 'Read the full story here...');
    const image = newspaper.coverImage || '';
    const siteUrl = `${req.protocol}://${req.get('host')}`;
    const pageUrl = `${siteUrl}/news/${req.params.slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="NewsLink">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="description" content="${description}">
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${image}" alt="${title}">
</body>
</html>`;

    return res.send(html);
  } catch (error) {
    console.error('Crawler OG meta error:', error);
    return next();
  }
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});
