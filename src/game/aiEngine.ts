import type { Board, Difficulty, Player } from './types';
import { checkWinner, getOpponent, getValidMoves, isBoardFull } from './gameLogic';

/**
 * Minimax with alpha-beta pruning.
 * Returns a score: +10 for AI win, -10 for human win, 0 for draw.
 * Depth is subtracted/added to prefer faster wins / slower losses.
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  alpha: number,
  beta: number,
  memo: Map<string, number>
): number {
  const key = board.join(',') + (isMaximizing ? '|M' : '|m');
  if (memo.has(key)) return memo.get(key)!;

  const result = checkWinner(board);
  if (result) {
    const score = result.winner === aiPlayer ? 10 - depth : depth - 10;
    memo.set(key, score);
    return score;
  }
  if (isBoardFull(board)) {
    memo.set(key, 0);
    return 0;
  }

  const humanPlayer = getOpponent(aiPlayer);
  const moves = getValidMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const newBoard = [...board];
      newBoard[move] = aiPlayer;
      const score = minimax(newBoard, depth + 1, false, aiPlayer, alpha, beta, memo);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    memo.set(key, best);
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newBoard = [...board];
      newBoard[move] = humanPlayer;
      const score = minimax(newBoard, depth + 1, true, aiPlayer, alpha, beta, memo);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    memo.set(key, best);
    return best;
  }
}

/** Find the best move using full minimax — unbeatable */
function getBestMove(board: Board, aiPlayer: Player): number {
  const moves = getValidMoves(board);
  const memo = new Map<string, number>();
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const newBoard = [...board];
    newBoard[move] = aiPlayer;
    const score = minimax(newBoard, 0, false, aiPlayer, -Infinity, Infinity, memo);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/** Pick a random valid move */
function getRandomMove(board: Board): number {
  const moves = getValidMoves(board);
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Medium AI: uses minimax 70% of the time, random 30%.
 * But always takes a winning move if available, and blocks opponent wins.
 */
function getMediumMove(board: Board, aiPlayer: Player): number {
  const moves = getValidMoves(board);
  const humanPlayer = getOpponent(aiPlayer);

  // Always take a winning move
  for (const move of moves) {
    const testBoard = [...board];
    testBoard[move] = aiPlayer;
    if (checkWinner(testBoard)) return move;
  }

  // Always block opponent's winning move
  for (const move of moves) {
    const testBoard = [...board];
    testBoard[move] = humanPlayer;
    if (checkWinner(testBoard)) return move;
  }

  // 70% smart, 30% random
  if (Math.random() < 0.7) {
    return getBestMove(board, aiPlayer);
  }
  return getRandomMove(board);
}

/**
 * Get the AI's move based on difficulty level.
 */
export function getAIMove(board: Board, aiPlayer: Player, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(board);
    case 'medium':
      return getMediumMove(board, aiPlayer);
    case 'impossible':
      return getBestMove(board, aiPlayer);
  }
}
