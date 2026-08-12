import { useState } from 'react';
import type { PlayerStats } from '../game/types';

interface LeaderboardProps {
  entries: PlayerStats[];
  onClose: () => void;
  onClear: () => void;
}

function getRankDisplay(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `${rank}`;
  }
}

function getWinRate(entry: PlayerStats): string {
  if (entry.totalGames === 0) return '0%';
  return `${Math.round((entry.wins / entry.totalGames) * 100)}%`;
}

export function Leaderboard({ entries, onClose, onClear }: LeaderboardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  const handleClear = () => {
    if (showConfirm) {
      onClear();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className={`leaderboard-panel ${closing ? 'closing' : ''}`}>
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <span>🏆</span> Leaderboard
        </h2>
        <button className="leaderboard-close" onClick={handleClose} aria-label="Close leaderboard" id="close-leaderboard">
          ✕
        </button>
      </div>

      <div className="leaderboard-body">
        {entries.length === 0 ? (
          <div className="leaderboard-empty">
            <div className="leaderboard-empty-icon">🏆</div>
            <p className="leaderboard-empty-text">No games played yet.<br />Start a game to see your stats!</p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="leaderboard-row leaderboard-row-header">
              <span className="lb-rank">#</span>
              <span className="lb-name">Player</span>
              <span className="lb-stat">W</span>
              <span className="lb-stat">L</span>
              <span className="lb-stat">D</span>
              <span className="lb-winrate">Rate</span>
              <span className="lb-streak">Best🔥</span>
            </div>

            {/* Data rows */}
            {entries.map((entry, index) => (
              <div
                className="leaderboard-row"
                key={entry.name}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="lb-rank">{getRankDisplay(index + 1)}</span>
                <span className="lb-name" title={entry.name}>{entry.name}</span>
                <span className="lb-stat" style={{ color: 'var(--accent-green)' }}>{entry.wins}</span>
                <span className="lb-stat" style={{ color: 'var(--color-o)' }}>{entry.losses}</span>
                <span className="lb-stat">{entry.draws}</span>
                <span className="lb-winrate" style={{
                  color: entry.wins / Math.max(entry.totalGames, 1) >= 0.6
                    ? 'var(--accent-green)'
                    : entry.wins / Math.max(entry.totalGames, 1) >= 0.4
                      ? 'var(--accent-gold)'
                      : 'var(--color-o)'
                }}>
                  {getWinRate(entry)}
                </span>
                <span className="lb-streak">
                  {entry.bestStreak > 0 ? entry.bestStreak : '-'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {entries.length > 0 && (
        <div className="leaderboard-footer">
          <button className="clear-btn" onClick={handleClear} id="clear-leaderboard">
            {showConfirm ? '⚠️ Click again to confirm' : '🗑️ Clear Leaderboard'}
          </button>
        </div>
      )}
    </div>
  );
}
