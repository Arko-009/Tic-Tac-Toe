import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayerStats } from '../game/types';
import {
  fetchLeaderboardApi,
  recordWinApi,
  recordLossApi,
  recordDrawApi,
  clearLeaderboardApi,
} from '../services/leaderboardApi';

const STORAGE_CACHE_KEY = 'tictactoe_leaderboard_cache';

// Seed data from MongoDB Atlas so visitors immediately see stored rankings
// even before the network request finishes or if visiting offline/GitHub Pages
export const INITIAL_LEADERBOARD_SEED: PlayerStats[] = [
  {
    name: 'Alice',
    wins: 2,
    losses: 0,
    draws: 0,
    currentStreak: 2,
    bestStreak: 2,
    totalGames: 2,
    lastPlayed: 1788969582776,
  },
  {
    name: 'Arko',
    wins: 1,
    losses: 0,
    draws: 0,
    currentStreak: 1,
    bestStreak: 1,
    totalGames: 1,
    lastPlayed: 1788970783663,
  },
  {
    name: 'Easy Bot',
    wins: 0,
    losses: 1,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 1,
    lastPlayed: 1788970783667,
  },
  {
    name: 'Bob',
    wins: 0,
    losses: 1,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 1,
    lastPlayed: 1788969582944,
  },
];

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

function getInitialEntries(): PlayerStats[] {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortLeaderboard(parsed);
      }
    }
  } catch {
    // Fall back to seed data
  }
  return sortLeaderboard(INITIAL_LEADERBOARD_SEED);
}

export type LeaderboardConnectionStatus = 'cloud' | 'offline' | 'syncing';

export function useLeaderboard() {
  const [entries, setEntries] = useState<PlayerStats[]>(getInitialEntries);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch leaderboard directly from MongoDB Atlas
  const refreshLeaderboard = useCallback(async () => {
    setIsSyncing(true);
    try {
      const remoteData = await fetchLeaderboardApi();
      if (!isMountedRef.current) return;
      if (Array.isArray(remoteData)) {
        setEntries(remoteData);
        setStatus('cloud');
        setError(null);
        try {
          localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(remoteData));
        } catch {
          // localStorage may be unavailable
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      console.warn('Leaderboard cloud sync noticed:', errorMessage);
      setStatus('offline');
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  }, []);

  // Auto-sync from MongoDB on initial mount
  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  /** Record a win for the given player name */
  const recordWin = useCallback((playerName: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      let updatedList: PlayerStats[];
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          wins: existing.wins + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: existing.currentStreak + 1,
          bestStreak: Math.max(existing.bestStreak, existing.currentStreak + 1),
          lastPlayed: Date.now(),
        };
        updatedList = sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      } else {
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
        updatedList = sortLeaderboard([...prev, newEntry]);
      }
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedList));
      } catch {
        // ignore
      }
      return updatedList;
    });

    // Persist to MongoDB Atlas
    recordWinApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Saved win locally; cloud sync deferred:', err.message);
        if (isMountedRef.current) {
          setStatus('offline');
        }
      });
  }, []);

  /** Record a loss for the given player name */
  const recordLoss = useCallback((playerName: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      let updatedList: PlayerStats[];
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          losses: existing.losses + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0,
          lastPlayed: Date.now(),
        };
        updatedList = sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      } else {
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
        updatedList = sortLeaderboard([...prev, newEntry]);
      }
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedList));
      } catch {
        // ignore
      }
      return updatedList;
    });

    // Persist to MongoDB Atlas
    recordLossApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Saved loss locally; cloud sync deferred:', err.message);
        if (isMountedRef.current) {
          setStatus('offline');
        }
      });
  }, []);

  /** Record a draw for the given player name */
  const recordDraw = useCallback((playerName: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      let updatedList: PlayerStats[];
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          draws: existing.draws + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0,
          lastPlayed: Date.now(),
        };
        updatedList = sortLeaderboard(
          prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e))
        );
      } else {
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
        updatedList = sortLeaderboard([...prev, newEntry]);
      }
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedList));
      } catch {
        // ignore
      }
      return updatedList;
    });

    // Persist to MongoDB Atlas
    recordDrawApi(playerName)
      .then((data) => {
        if (isMountedRef.current && Array.isArray(data)) {
          setEntries(data);
          setStatus('cloud');
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Saved draw locally; cloud sync deferred:', err.message);
        if (isMountedRef.current) {
          setStatus('offline');
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

  /** Clear the entire leaderboard */
  const clearLeaderboard = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_CACHE_KEY);
    } catch {
      // ignore
    }
    clearLeaderboardApi().catch((err) => {
      console.warn('Cleared local leaderboard; cloud delete error:', err.message);
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
