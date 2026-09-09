import type { Board, Difficulty, Player } from './types';
import { checkWinner, getOpponent, getValidMoves, isBoardFull, WINNING_LINES } from './gameLogic';

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
  beta: number
): number {
  const result = checkWinner(board);
  if (result) {
    return result.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (isBoardFull(board)) {
    return 0;
  }

  const humanPlayer = getOpponent(aiPlayer);
  const moves = getValidMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const newBoard = [...board];
      newBoard[move] = aiPlayer;
      const score = minimax(newBoard, depth + 1, false, aiPlayer, alpha, beta);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newBoard = [...board];
      newBoard[move] = humanPlayer;
      const score = minimax(newBoard, depth + 1, true, aiPlayer, alpha, beta);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Evaluate how aggressive and trap-setting a candidate move is.
 * Used to break ties among optimal moves with equal minimax score.
 */
function evaluateAggression(board: Board, move: number, aiPlayer: Player): number {
  const newBoard = [...board];
  newBoard[move] = aiPlayer;
  const humanPlayer = getOpponent(aiPlayer);

  // 1. Immediate Win
  if (checkWinner(newBoard)?.winner === aiPlayer) return 10000;

  let attackScore = 0;

  // 2. Fork Detection (Double Threat Creation)
  // Count how many lines now have 2 AI pieces and 1 empty cell
  let doubleThreats = 0;
  for (const line of WINNING_LINES) {
    const aiCount = line.filter((idx) => newBoard[idx] === aiPlayer).length;
    const humanCount = line.filter((idx) => newBoard[idx] === humanPlayer).length;
    if (aiCount === 2 && humanCount === 0) {
      doubleThreats++;
    }
  }
  if (doubleThreats >= 2) {
    attackScore += 5000; // FORK! Guarantees an unblockable victory on the next turn
  }

  // 3. Open Winning Pathways (Pressure Generation)
  for (const line of WINNING_LINES) {
    const aiCount = line.filter((idx) => newBoard[idx] === aiPlayer).length;
    const humanCount = line.filter((idx) => newBoard[idx] === humanPlayer).length;
    if (humanCount === 0) {
      attackScore += aiCount * 20; // Aggressive line stacking
    }
  }

  // 4. Positional Superiority
  if (move === 4) {
    attackScore += 100; // Center domination
  } else if ([0, 2, 6, 8].includes(move)) {
    attackScore += 50;  // Corner domination for double-threat setups
  } else {
    attackScore += 10;
  }

  return attackScore;
}

/** Find the absolute best & most aggressive move — unbeatable & ruthless */
function getBestMove(board: Board, aiPlayer: Player): number {
  const moves = getValidMoves(board);

  let bestScore = -Infinity;
  let candidateMoves: { move: number; attackScore: number }[] = [];

  for (const move of moves) {
    const newBoard = [...board];
    newBoard[move] = aiPlayer;
    const score = minimax(newBoard, 0, false, aiPlayer, -Infinity, Infinity);
    const attackScore = evaluateAggression(board, move, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      candidateMoves = [{ move, attackScore }];
    } else if (score === bestScore) {
      candidateMoves.push({ move, attackScore });
    }
  }

  // Pick the move with the highest aggression/trap score among tied optimal moves
  candidateMoves.sort((a, b) => b.attackScore - a.attackScore);
  return candidateMoves[0].move;
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
