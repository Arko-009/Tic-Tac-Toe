import express from 'express';
import cors from 'cors';
import leaderboardRouter from '../server/routes/leaderboard.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Route handlers — support /api/leaderboard, /leaderboard, and /
app.use('/api/leaderboard', leaderboardRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/', leaderboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default function handler(req, res) {
  return app(req, res);
}
