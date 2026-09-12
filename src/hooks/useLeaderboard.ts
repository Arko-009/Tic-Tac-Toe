import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayerStats } from '../game/types';
import {
  fetchLeaderboardApi,
  recordWinApi,
  recordLossApi,
  recordDrawApi,
  clearLeaderboardApi,
} from '../services/leaderboardApi';

export type LeaderboardConnectionStatus = 'cloud' | 'error' | 'syncing';

function sortLeaderboard(entries: PlayerStats[]): PlayerStats[] {
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

export function useLeaderboard() {
  const [entries, setEntries] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<LeaderboardConnectionStatus>('syncing');
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /** Fetch live leaderboard records directly from MongoDB Atlas */
  const refreshLeaderboard = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const remoteData = await fetchLeaderboardApi();
      if (!isMountedRef.current) return;
      if (Array.isArray(remoteData)) {
        setEntries(remoteData);
        setStatus('cloud');
        setError(null);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to MongoDB';
      console.warn('MongoDB sync error:', errorMessage);
      setStatus('error');
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  }, []);

  // Fetch initial leaderboard from MongoDB on mount
  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  /** Record a win live in MongoDB Atlas */
  const recordWin = useCallback((playerName: string) => {
    // Optimistic in-memory update for instant visual feedback
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

    // Send match outcome directly to MongoDB Atlas
    recordWinApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to update win in MongoDB Atlas:', err);
        if (isMountedRef.current) {
          setStatus('error');
          setError(err.message);
        }
      });
  }, []);

  /** Record a loss live in MongoDB Atlas */
  const recordLoss = useCallback((playerName: string) => {
    // Optimistic in-memory update for instant visual feedback
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

    // Send match outcome directly to MongoDB Atlas
    recordLossApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to update loss in MongoDB Atlas:', err);
        if (isMountedRef.current) {
          setStatus('error');
          setError(err.message);
        }
      });
  }, []);

  /** Record a draw live in MongoDB Atlas */
  const recordDraw = useCallback((playerName: string) => {
    // Optimistic in-memory update for instant visual feedback
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

    // Send match outcome directly to MongoDB Atlas
    recordDrawApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to update draw in MongoDB Atlas:', err);
        if (isMountedRef.current) {
          setStatus('error');
          setError(err.message);
        }
      });
  }, []);

  /** Get stats for a specific player */
  const getPlayerStats = useCallback(
    (playerName: string): PlayerStats | undefined => {
      return entries.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
    },
    [entries]
  );

  /** Clear the entire leaderboard directly from MongoDB Atlas */
  const clearLeaderboard = useCallback(() => {
    setEntries([]);
    clearLeaderboardApi()
      .then(() => {
        if (isMountedRef.current) {
          setStatus('cloud');
        }
      })
      .catch((err) => {
        console.error('Failed to clear leaderboard in MongoDB:', err);
        if (isMountedRef.current) {
          setStatus('error');
          setError(err.message);
        }
      });
  }, []);

  return {
    entries,
    isLoading,
    isSyncing,
    status,
    error,
    refreshLeaderboard,
    recordWin,
    recordLoss,
    recordDraw,
    getPlayerStats,
    clearLeaderboard,
  };
}
