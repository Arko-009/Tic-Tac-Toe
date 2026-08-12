import type { GameConfig, Player, ScoreBoard } from '../game/types';

interface GameHeaderProps {
  config: GameConfig;
  currentPlayer: Player;
  scores: ScoreBoard;
  isAIThinking: boolean;
  isGameOver: boolean;
}

export function GameHeader({ config, currentPlayer, scores, isAIThinking, isGameOver }: GameHeaderProps) {
  const playerName =
    currentPlayer === 'X' ? config.playerXName : config.playerOName;

  const turnText = isGameOver
    ? 'Game Over'
    : isAIThinking
      ? `${config.playerOName} is thinking...`
      : `${playerName}'s turn`;

  return (
    <div className="game-header">
      <h1 className="game-title">
        <span className="game-title-icon">⚡</span>
        TIC-TAC-TOE
      </h1>
      <p className="game-subtitle">Ultimate Edition</p>

      <div
        className={`turn-indicator ${
          isGameOver ? '' : currentPlayer === 'X' ? 'player-x' : 'player-o'
        } ${isAIThinking ? 'thinking' : ''}`}
      >
        {!isGameOver && <span className="turn-dot" />}
        <span>{turnText}</span>
      </div>

      <div className="score-display">
        <div className="score-card score-x">
          <div className="score-label">{config.playerXName}</div>
          <div className="score-value">{scores.X}</div>
        </div>
        <div className="score-card score-draw">
          <div className="score-label">Draw</div>
          <div className="score-value">{scores.draws}</div>
        </div>
        <div className="score-card score-o">
          <div className="score-label">{config.playerOName}</div>
          <div className="score-value">{scores.O}</div>
        </div>
      </div>
    </div>
  );
}
