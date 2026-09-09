import type { PlayerStats } from '../game/types';

const BASE_URL = '/api/leaderboard';

export async function fetchLeaderboardApi(): Promise<PlayerStats[]> {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
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
