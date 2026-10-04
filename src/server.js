import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import connectDB from './config/db.js'; // To be implemented
// import apiRoutes from './routes/api.js'; // To be implemented

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Middleware
app.use(helmet());
app.use(cors({
  origin: true, // This automatically allows any origin to connect, solving all CORS problems
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'NewsLink Capture API running' });
});

// Routes Placeholder
// app.use('/api', apiRoutes);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // connectDB(); // Initialize DB connection
});
