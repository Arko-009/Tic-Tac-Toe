import { useState } from 'react';
import type { PlayerStats } from '../game/types';
import type { LeaderboardConnectionStatus } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  entries: PlayerStats[];
  isLoading?: boolean;
  isSyncing?: boolean;
  status?: LeaderboardConnectionStatus;
  error?: string | null;
  onClose: () => void;
  onClear: () => void;
  onRefresh?: () => void;
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

export function Leaderboard({
  entries,
  isLoading = false,
  isSyncing = false,
  status = 'cloud',
  error,
  onClose,
  onClear,
  onRefresh,
}: LeaderboardProps) {
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
    <>
      <div
        className={`leaderboard-backdrop ${closing ? 'closing' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className={`leaderboard-panel ${closing ? 'closing' : ''}`}>
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <h2 className="leaderboard-title">
            <span>🏆</span> Leaderboard
          </h2>
          {isSyncing ? (
            <span className="lb-sync-tag" title="Syncing with MongoDB Atlas...">⏳ Syncing</span>
          ) : status === 'error' ? (
            <span className="lb-error-tag" title={error || 'Unable to connect to MongoDB Atlas'}>⚠️ Disconnected</span>
          ) : (
            <span className="lb-cloud-tag" title="Live connection to MongoDB Atlas">☁️ Live MongoDB</span>
          )}
        </div>
        <div className="leaderboard-header-actions">
          {onRefresh && (
            <button
              className={`leaderboard-refresh-btn ${isSyncing ? 'spinning' : ''}`}
              onClick={onRefresh}
              aria-label="Refresh leaderboard"
              title="Refresh directly from MongoDB Atlas"
              disabled={isSyncing}
            >
              🔄
            </button>
          )}
          <button
            className="leaderboard-close"
            onClick={handleClose}
            aria-label="Close leaderboard"
            id="close-leaderboard"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="leaderboard-body">
        {isLoading && entries.length === 0 ? (
          <div className="leaderboard-empty">
            <div className="leaderboard-empty-icon">⏳</div>
            <p className="leaderboard-empty-text">Loading stats from MongoDB Atlas...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">
            <div className="leaderboard-empty-icon">{status === 'error' ? '🔌' : '🏆'}</div>
            {status === 'error' ? (
              <>
                <p className="leaderboard-empty-text">
                  Unable to connect to MongoDB Atlas.<br />
                  <small style={{ opacity: 0.7 }}>{error || 'Network error'}</small>
                </p>
                {onRefresh && (
                  <button className="leaderboard-retry-btn" onClick={onRefresh}>
                    🔄 Retry Connection
                  </button>
                )}
              </>
            ) : (
              <p className="leaderboard-empty-text">No games recorded yet in MongoDB.<br />Play a match to record the first game!</p>
            )}
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
                <span
                  className="lb-winrate"
                  style={{
                    color: entry.wins / Math.max(entry.totalGames, 1) >= 0.6
                      ? 'var(--accent-green)'
                      : entry.wins / Math.max(entry.totalGames, 1) >= 0.4
                        ? 'var(--accent-gold)'
                        : 'var(--color-o)'
                  }}
                >
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
            {showConfirm ? '⚠️ Click again to confirm wipe' : '🗑️ Clear Leaderboard'}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
