import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats } from '../game/types';

const STORAGE_KEY = 'tictactoe_leaderboard';

function loadLeaderboard(): PlayerStats[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data — reset
  }
  return [];
}

function saveLeaderboard(entries: PlayerStats[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

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
  const [entries, setEntries] = useState<PlayerStats[]>(() => sortLeaderboard(loadLeaderboard()));

  // Persist whenever entries change
  useEffect(() => {
    saveLeaderboard(entries);
  }, [entries]);

  /** Record a win for the given player name */
  const recordWin = useCallback((playerName: string) => {
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
        return sortLeaderboard(prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e)));
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
  }, []);

  /** Record a loss for the given player name */
  const recordLoss = useCallback((playerName: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          losses: existing.losses + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0, // Reset streak on loss
          lastPlayed: Date.now(),
        };
        return sortLeaderboard(prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e)));
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
  }, []);

  /** Record a draw for the given player name */
  const recordDraw = useCallback((playerName: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name.toLowerCase() === playerName.toLowerCase());
      if (existing) {
        const updated: PlayerStats = {
          ...existing,
          draws: existing.draws + 1,
          totalGames: existing.totalGames + 1,
          currentStreak: 0, // Reset streak on draw
          lastPlayed: Date.now(),
        };
        return sortLeaderboard(prev.map((e) => (e.name.toLowerCase() === playerName.toLowerCase() ? updated : e)));
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    entries,
    recordWin,
    recordLoss,
    recordDraw,
    getPlayerStats,
    clearLeaderboard,
  };
}
