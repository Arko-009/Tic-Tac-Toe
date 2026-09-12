import type { PlayerStats } from '../game/types';

// Support remote deployed backend via VITE_API_URL or default to Vite proxy /api
const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = API_HOST ? `${API_HOST}/api/leaderboard` : '/api/leaderboard';

export async function fetchLeaderboardApi(): Promise<PlayerStats[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(BASE_URL, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText} (${response.status})`);
    }
    const result = await response.json();
    return result.data || [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function recordWinApi(playerName: string): Promise<PlayerStats[]> {
  const response = await fetch(`${BASE_URL}/win`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });
  if (!response.ok) {
    throw new Error(`Failed to record win: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function recordLossApi(playerName: string): Promise<PlayerStats[]> {
  const response = await fetch(`${BASE_URL}/loss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });
  if (!response.ok) {
    throw new Error(`Failed to record loss: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function recordDrawApi(playerName: string): Promise<PlayerStats[]> {
  const response = await fetch(`${BASE_URL}/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });
  if (!response.ok) {
    throw new Error(`Failed to record draw: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function syncLeaderboardApi(entries: PlayerStats[]): Promise<PlayerStats[]> {
  const response = await fetch(`${BASE_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!response.ok) {
    throw new Error(`Failed to sync leaderboard: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function clearLeaderboardApi(): Promise<void> {
  const response = await fetch(BASE_URL, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to clear leaderboard: ${response.statusText}`);
  }
}
