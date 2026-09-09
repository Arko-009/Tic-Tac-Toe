import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats } from '../game/types';
import {
  fetchLeaderboardApi,
  recordWinApi,
  recordLossApi,
  recordDrawApi,
  clearLeaderboardApi,
} from '../services/leaderboardApi';

function sortLeaderboard(entries: PlayerStats[]): PlayerStats[] {
  return [...entries].sort((a, b) => {
    // Sort by best streak descending
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    // Then by win rate descending
    const aRate = a.totalGames > 0 ? a.wins / a.totalGames : 0;
    const bRate = b.totalGames > 0 ? b.wins / b.totalGames : 0;
    if (bRate !== aRate) return bRate - aRate;
    // Then by total wins descending
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Then by most recent
    return b.lastPlayed - a.lastPlayed;
  });
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard directly from MongoDB Atlas on mount
  useEffect(() => {
    let isMounted = true;

    async function loadFromMongoDB() {
      try {
        const remoteData = await fetchLeaderboardApi();
        if (isMounted) {
          setEntries(remoteData);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard from MongoDB:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFromMongoDB();

    return () => {
      isMounted = false;
    };
  }, []);

  /** Record a win for the given player name */
  const recordWin = useCallback((playerName: string) => {
    // 1. Optimistic state update in memory for immediate UI responsiveness
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          wins: existing.wins + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: existing.currentStreak + 1,
          bestStreak: Math.max(existing.bestStreak, existing.currentStreak + 1),
          lastPlayed: Date.now(),
        };
        return sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      }
      const newEntry: PlayerStats = {
        name: playerName,
        wins: 1,
        losses: 0,
        draws: 0,
        currentStreak: 1,
        bestStreak: 1,
        totalGames: 1,
        lastPlayed: Date.now(),
      };
      return sortLeaderboard([...prev, newEntry]);
    });

    // 2. Persist directly to MongoDB Atlas
    recordWinApi(playerName)
      .then((data) => {
        setEntries(data);
      })
      .catch((err) => {
        console.error('Failed to record win in MongoDB:', err);
      });
  }, []);

  /** Record a loss for the given player name */
  const recordLoss = useCallback((playerName: string) => {
    // 1. Optimistic state update in memory for immediate UI responsiveness
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          losses: existing.losses + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0,
          lastPlayed: Date.now(),
        };
        return sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      }
      const newEntry: PlayerStats = {
        name: playerName,
        wins: 0,
        losses: 1,
        draws: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 1,
        lastPlayed: Date.now(),
      };
      return sortLeaderboard([...prev, newEntry]);
    });

    // 2. Persist directly to MongoDB Atlas
    recordLossApi(playerName)
      .then((data) => {
        setEntries(data);
      })
      .catch((err) => {
        console.error('Failed to record loss in MongoDB:', err);
      });
  }, []);

  /** Record a draw for the given player name */
  const recordDraw = useCallback((playerName: string) => {
    // 1. Optimistic state update in memory for immediate UI responsiveness
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          draws: existing.draws + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0,
          lastPlayed: Date.now(),
        };
        return sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      }
      const newEntry: PlayerStats = {
        name: playerName,
        wins: 0,
        losses: 0,
        draws: 1,
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 1,
        lastPlayed: Date.now(),
      };
      return sortLeaderboard([...prev, newEntry]);
    });

    // 2. Persist directly to MongoDB Atlas
    recordDrawApi(playerName)
      .then((data) => {
        setEntries(data);
      })
      .catch((err) => {
        console.error('Failed to record draw in MongoDB:', err);
      });
  }, []);

  /** Get stats for a specific player */
  const getPlayerStats = useCallback(
    (playerName: string): PlayerStats | undefined => {
      return entries.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
    },
    [entries]
  );

  /** Clear the entire leaderboard directly in MongoDB Atlas */
  const clearLeaderboard = useCallback(() => {
    setEntries([]);
    clearLeaderboardApi().catch((err) => {
      console.error('Failed to clear leaderboard in MongoDB:', err);
    });
  }, []);

  return {
    entries,
    isLoading,
    recordWin,
    recordLoss,
    recordDraw,
    getPlayerStats,
    clearLeaderboard,
  };
}
