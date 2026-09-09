import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import leaderboardRouter from './routes/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/leaderboard', leaderboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Production: serve built frontend from dist
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server and initiate DB connection
function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tic-Tac-Toe API Server running at http://localhost:${PORT}`);
  });

  // Initiate database connection in background
  connectDB().catch((err) => {
    console.error('⚠️ Initial MongoDB connection failed, will retry on request:', err.message);
  });

  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
