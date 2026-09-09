import { Router } from 'express';
import { getLeaderboardCollection } from '../db.js';

const router = Router();
const collation = { locale: 'en', strength: 2 };

function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    // 1. Sort by best streak descending
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    // 2. Then by win rate descending
    const aRate = a.totalGames > 0 ? a.wins / a.totalGames : 0;
    const bRate = b.totalGames > 0 ? b.wins / b.totalGames : 0;
    if (bRate !== aRate) return bRate - aRate;
    // 3. Then by total wins descending
    if (b.wins !== a.wins) return b.wins - a.wins;
    // 4. Then by most recent
    return b.lastPlayed - a.lastPlayed;
  });
}

/**
 * GET /api/leaderboard
 * Fetch sorted leaderboard entries
 */
router.get('/', async (req, res) => {
  try {
    const collection = await getLeaderboardCollection();
    const rawEntries = await collection
      .find({}, { projection: { _id: 0 } })
      .toArray();

    const sorted = sortLeaderboard(rawEntries);
    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST /api/leaderboard/win
 * Record a win for the specified player
 */
router.post('/win', async (req, res) => {
  const { playerName } = req.body;
  if (!playerName || typeof playerName !== 'string') {
    return res.status(400).json({ success: false, error: 'Player name is required' });
  }

  const trimmedName = playerName.trim();
  const now = Date.now();

  try {
    const collection = await getLeaderboardCollection();
    const existing = await collection.findOne({ name: trimmedName }, { collation });

    if (existing) {
      const newCurrentStreak = (existing.currentStreak || 0) + 1;
      const newBestStreak = Math.max(existing.bestStreak || 0, newCurrentStreak);

      await collection.updateOne(
        { _id: existing._id },
        {
          $inc: { wins: 1, totalGames: 1 },
          $set: {
            currentStreak: newCurrentStreak,
            bestStreak: newBestStreak,
            lastPlayed: now,
          },
        }
      );
    } else {
      await collection.insertOne({
        name: trimmedName,
        wins: 1,
        losses: 0,
        draws: 0,
        currentStreak: 1,
        bestStreak: 1,
        totalGames: 1,
        lastPlayed: now,
      });
    }

    const updatedList = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.json({ success: true, data: sortLeaderboard(updatedList) });
  } catch (error) {
    console.error('Error recording win:', error);
    res.status(500).json({ success: false, error: 'Failed to record win' });
  }
});

/**
 * POST /api/leaderboard/loss
 * Record a loss for the specified player
 */
router.post('/loss', async (req, res) => {
  const { playerName } = req.body;
  if (!playerName || typeof playerName !== 'string') {
    return res.status(400).json({ success: false, error: 'Player name is required' });
  }

  const trimmedName = playerName.trim();
  const now = Date.now();

  try {
    const collection = await getLeaderboardCollection();
    const existing = await collection.findOne({ name: trimmedName }, { collation });

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $inc: { losses: 1, totalGames: 1 },
          $set: {
            currentStreak: 0,
            lastPlayed: now,
          },
        }
      );
    } else {
      await collection.insertOne({
        name: trimmedName,
        wins: 0,
        losses: 1,
        draws: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 1,
        lastPlayed: now,
      });
    }

    const updatedList = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.json({ success: true, data: sortLeaderboard(updatedList) });
  } catch (error) {
    console.error('Error recording loss:', error);
    res.status(500).json({ success: false, error: 'Failed to record loss' });
  }
});

/**
 * POST /api/leaderboard/draw
 * Record a draw for the specified player
 */
router.post('/draw', async (req, res) => {
  const { playerName } = req.body;
  if (!playerName || typeof playerName !== 'string') {
    return res.status(400).json({ success: false, error: 'Player name is required' });
  }

  const trimmedName = playerName.trim();
  const now = Date.now();

  try {
    const collection = await getLeaderboardCollection();
    const existing = await collection.findOne({ name: trimmedName }, { collation });

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $inc: { draws: 1, totalGames: 1 },
          $set: {
            currentStreak: 0,
            lastPlayed: now,
          },
        }
      );
    } else {
      await collection.insertOne({
        name: trimmedName,
        wins: 0,
        losses: 0,
        draws: 1,
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 1,
        lastPlayed: now,
      });
    }

    const updatedList = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.json({ success: true, data: sortLeaderboard(updatedList) });
  } catch (error) {
    console.error('Error recording draw:', error);
    res.status(500).json({ success: false, error: 'Failed to record draw' });
  }
});

/**
 * POST /api/leaderboard/sync
 * Sync local storage records to MongoDB
 */
router.post('/sync', async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) {
    return res.status(400).json({ success: false, error: 'Entries must be an array' });
  }

  try {
    const collection = await getLeaderboardCollection();
    for (const item of entries) {
      if (!item.name) continue;
      const existing = await collection.findOne({ name: item.name }, { collation });
      if (!existing) {
        await collection.insertOne({
          name: item.name,
          wins: Number(item.wins) || 0,
          losses: Number(item.losses) || 0,
          draws: Number(item.draws) || 0,
          currentStreak: Number(item.currentStreak) || 0,
          bestStreak: Number(item.bestStreak) || 0,
          totalGames: Number(item.totalGames) || 0,
          lastPlayed: Number(item.lastPlayed) || Date.now(),
        });
      }
    }

    const updatedList = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.json({ success: true, data: sortLeaderboard(updatedList) });
  } catch (error) {
    console.error('Error syncing leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to sync leaderboard' });
  }
});

/**
 * DELETE /api/leaderboard
 * Clear all leaderboard entries
 */
router.delete('/', async (req, res) => {
  try {
    const collection = await getLeaderboardCollection();
    await collection.deleteMany({});
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to clear leaderboard' });
  }
});

export default router;
