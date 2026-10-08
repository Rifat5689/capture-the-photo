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

