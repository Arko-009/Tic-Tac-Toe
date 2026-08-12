import type { Board, CellValue, GameResult, Player } from './types';

/** All 8 possible winning lines (indices into the board array) */
export const WINNING_LINES: number[][] = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left → bottom-right
  [2, 4, 6], // diagonal top-right → bottom-left
];

/** Create an empty 9-cell board */
export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

/** Check if a specific cell is available */
export function isValidMove(board: Board, index: number): boolean {
  return index >= 0 && index < 9 && board[index] === null;
}

/** Place a piece on the board (returns a new board) */
export function makeMove(board: Board, index: number, player: Player): Board {
  if (!isValidMove(board, index)) return board;
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}

/** Get all valid move indices */
export function getValidMoves(board: Board): number[] {
  return board.reduce<number[]>((moves, cell, i) => {
    if (cell === null) moves.push(i);
    return moves;
  }, []);
}

/** Check for a winner — returns the winning player and line, or null */
export function checkWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

/** Check if the board is completely filled */
export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

/** Evaluate the full game state */
export function evaluateGame(board: Board): GameResult {
  const winResult = checkWinner(board);
  if (winResult) {
    return {
      status: 'won',
      winner: winResult.winner,
      winningLine: winResult.line,
    };
  }
  if (isBoardFull(board)) {
    return {
      status: 'draw',
      winner: null,
      winningLine: null,
    };
  }
  return {
    status: 'playing',
    winner: null,
    winningLine: null,
  };
}

/** Switch to the other player */
export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}
