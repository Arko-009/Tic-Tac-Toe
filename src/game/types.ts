export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = CellValue[];
export type GameMode = 'ai' | 'friend';
export type Difficulty = 'easy' | 'medium' | 'impossible';
export type GameScreen = 'menu' | 'game' | 'leaderboard';
export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameResult {
  status: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  lastPlayed: number; // timestamp
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  playerXName: string;
  playerOName: string;
}

export interface ScoreBoard {
  X: number;
  O: number;
  draws: number;
}
