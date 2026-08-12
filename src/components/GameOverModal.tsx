import type { GameConfig, GameResult, Player } from '../game/types';

interface GameOverModalProps {
  result: GameResult;
  config: GameConfig;
  currentStreak: number;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onViewLeaderboard: () => void;
}

export function GameOverModal({
  result,
  config,
  currentStreak,
  onPlayAgain,
  onChangeMode,
  onViewLeaderboard,
}: GameOverModalProps) {
  const isDraw = result.status === 'draw';
  const winner = result.winner as Player;
  const winnerName = winner === 'X' ? config.playerXName : config.playerOName;

  const emoji = isDraw ? '🤝' : currentStreak >= 5 ? '🔥' : currentStreak >= 3 ? '⚡' : '🎉';
  const title = isDraw ? "It's a Draw!" : `${winnerName} Wins!`;

  const fireEmojis =
    currentStreak >= 10
      ? '🔥🔥🔥🔥🔥'
      : currentStreak >= 7
        ? '🔥🔥🔥🔥'
        : currentStreak >= 5
          ? '🔥🔥🔥'
          : currentStreak >= 3
            ? '🔥🔥'
            : currentStreak >= 2
              ? '🔥'
              : '';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onPlayAgain()}>
      <div className="modal-content">
        <div className="modal-emoji">{emoji}</div>
        <h2
          className={`modal-title ${isDraw ? 'draw' : winner === 'X' ? 'win-x' : 'win-o'}`}
        >
          {title}
        </h2>
        <p className="modal-subtitle">
          {isDraw
            ? 'Great minds think alike!'
            : config.mode === 'ai' && winner === 'X'
              ? `You beat the ${config.playerOName}!`
              : config.mode === 'ai' && winner === 'O'
                ? 'The AI outplayed you this time.'
                : `${winnerName} takes the round!`}
        </p>

        {!isDraw && currentStreak >= 2 && (
          <div className="modal-streak">
            <span>{fireEmojis}</span>
            <span className="modal-streak-text">{currentStreak} Win Streak!</span>
            <span>{fireEmojis}</span>
          </div>
        )}

        <div className="modal-buttons">
          <button className="modal-btn modal-btn-primary" onClick={onPlayAgain} id="play-again">
            🎮 Play Again
          </button>
          <button className="modal-btn modal-btn-secondary" onClick={onViewLeaderboard} id="modal-leaderboard">
            🏆 Leaderboard
          </button>
          <button className="modal-btn modal-btn-secondary" onClick={onChangeMode} id="change-mode">
            ← Change Mode
          </button>
        </div>
      </div>
    </div>
  );
}
