import { useState } from 'react';
import type { Difficulty, GameConfig, GameMode } from '../game/types';
import { DifficultySelector } from './DifficultySelector';

interface GameModeSelectorProps {
  onStart: (config: GameConfig) => void;
  onViewLeaderboard: () => void;
}

export function GameModeSelector({ onStart, onViewLeaderboard }: GameModeSelectorProps) {
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerXName, setPlayerXName] = useState('');
  const [playerOName, setPlayerOName] = useState('');

  const handleStart = () => {
    const xName = playerXName.trim() || 'Player 1';
    const oName =
      mode === 'ai'
        ? difficulty === 'easy'
          ? 'Easy Bot'
          : difficulty === 'medium'
            ? 'Smart Bot'
            : 'Impossible Bot'
        : playerOName.trim() || 'Player 2';

    onStart({
      mode,
      difficulty,
      playerXName: xName,
      playerOName: oName,
    });
  };

  return (
    <div className="menu-screen">
      <div>
        <h1 className="menu-logo">TIC-TAC-TOE</h1>
        <p className="menu-logo-sub">Ultimate Edition</p>
      </div>

      {/* Name Input */}
      <div className="menu-section">
        <h2 className="menu-section-title">Players</h2>
        <div className="name-input-group">
          <div className="name-input-row">
            <span className="name-input-label label-x">X</span>
            <input
              className="name-input input-x"
              type="text"
              placeholder="Your name..."
              value={playerXName}
              onChange={(e) => setPlayerXName(e.target.value)}
              maxLength={15}
              id="player-x-name"
            />
          </div>
          {mode === 'friend' && (
            <div className="name-input-row">
              <span className="name-input-label label-o">O</span>
              <input
                className="name-input input-o"
                type="text"
                placeholder="Friend's name..."
                value={playerOName}
                onChange={(e) => setPlayerOName(e.target.value)}
                maxLength={15}
                id="player-o-name"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="menu-section">
        <h2 className="menu-section-title">Game Mode</h2>
        <div className="mode-cards">
          <div
            className={`mode-card ${mode === 'ai' ? 'selected' : ''}`}
            onClick={() => setMode('ai')}
            role="button"
            tabIndex={0}
            id="mode-ai"
          >
            <span className="mode-icon">🤖</span>
            <span className="mode-label">vs AI</span>
            <span className="mode-desc">Challenge the machine</span>
          </div>
          <div
            className={`mode-card ${mode === 'friend' ? 'selected' : ''}`}
            onClick={() => setMode('friend')}
            role="button"
            tabIndex={0}
            id="mode-friend"
          >
            <span className="mode-icon">👥</span>
            <span className="mode-label">vs Friend</span>
            <span className="mode-desc">Local multiplayer</span>
          </div>
        </div>
      </div>

      {/* Difficulty (AI mode only) */}
      {mode === 'ai' && (
        <div className="menu-section">
          <h2 className="menu-section-title">Difficulty</h2>
          <DifficultySelector selected={difficulty} onChange={setDifficulty} />
        </div>
      )}

      {/* Start */}
      <button className="start-button" onClick={handleStart} id="start-game">
        ⚡ Start Game
      </button>

      <button className="leaderboard-link" onClick={onViewLeaderboard} id="view-leaderboard">
        🏆 View Leaderboard
      </button>
    </div>
  );
}
