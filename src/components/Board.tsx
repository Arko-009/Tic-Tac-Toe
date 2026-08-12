import type { Board as BoardType, Player } from '../game/types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  currentPlayer: Player;
  winningLine: number[] | null;
  isGameOver: boolean;
  isDisabled: boolean;
  onCellClick: (index: number) => void;
  onCellHover: () => void;
}

export function Board({
  board,
  currentPlayer,
  winningLine,
  isGameOver,
  isDisabled,
  onCellClick,
  onCellHover,
}: BoardProps) {
  return (
    <div className="board-wrapper">
      <div className={`board ${isGameOver ? 'game-over' : ''}`} role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            index={index}
            isWinning={winningLine !== null && winningLine.includes(index)}
            isDisabled={isDisabled || isGameOver}
            currentPlayer={currentPlayer}
            onClick={onCellClick}
            onHover={onCellHover}
          />
        ))}
      </div>
    </div>
  );
}
