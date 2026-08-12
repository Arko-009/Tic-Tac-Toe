import { useState, useCallback, useEffect, useRef } from 'react';
import type { Board, Player, GameConfig, GameResult, GameStatus, ScoreBoard } from '../game/types';
import { createEmptyBoard, makeMove, evaluateGame, getOpponent, isValidMove } from '../game/gameLogic';
import { getAIMove } from '../game/aiEngine';

interface GameState {
  board: Board;
  currentPlayer: Player;
  gameResult: GameResult;
  scores: ScoreBoard;
  moveHistory: number[];
  isAIThinking: boolean;
}

export function useGameState(config: GameConfig) {
  const [state, setState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: 'X',
    gameResult: { status: 'playing', winner: null, winningLine: null },
    scores: { X: 0, O: 0, draws: 0 },
    moveHistory: [],
    isAIThinking: false,
  });

  const aiTimeoutRef = useRef<number | null>(null);

  // Clean up AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (
      config.mode === 'ai' &&
      state.currentPlayer === 'O' &&
      state.gameResult.status === 'playing' &&
      !state.isAIThinking
    ) {
      setState((prev) => ({ ...prev, isAIThinking: true }));

      // Small delay to feel natural and show "thinking" state
      const delay = config.difficulty === 'impossible' ? 600 : config.difficulty === 'medium' ? 400 : 250;
      aiTimeoutRef.current = window.setTimeout(() => {
        setState((prev) => {
          const aiMove = getAIMove(prev.board, 'O', config.difficulty);
          const newBoard = makeMove(prev.board, aiMove, 'O');
          const result = evaluateGame(newBoard);

          const newScores = { ...prev.scores };
          if (result.status === 'won') {
            newScores[result.winner!] += 1;
          } else if (result.status === 'draw') {
            newScores.draws += 1;
          }

          return {
            ...prev,
            board: newBoard,
            currentPlayer: result.status === 'playing' ? 'X' : prev.currentPlayer,
            gameResult: result,
            scores: newScores,
            moveHistory: [...prev.moveHistory, aiMove],
            isAIThinking: false,
          };
        });
      }, delay);
    }
  }, [state.currentPlayer, state.gameResult.status, state.isAIThinking, config.mode, config.difficulty]);

  const handleCellClick = useCallback(
    (index: number) => {
      setState((prev) => {
        // Don't allow moves if game is over, AI is thinking, or cell is taken
        if (prev.gameResult.status !== 'playing' || prev.isAIThinking) return prev;
        if (!isValidMove(prev.board, index)) return prev;

        // In AI mode, only X (human) can click
        if (config.mode === 'ai' && prev.currentPlayer !== 'X') return prev;

        const newBoard = makeMove(prev.board, index, prev.currentPlayer);
        const result = evaluateGame(newBoard);

        const newScores = { ...prev.scores };
        if (result.status === 'won') {
          newScores[result.winner!] += 1;
        } else if (result.status === 'draw') {
          newScores.draws += 1;
        }

        return {
          ...prev,
          board: newBoard,
          currentPlayer: result.status === 'playing' ? getOpponent(prev.currentPlayer) : prev.currentPlayer,
          gameResult: result,
          scores: newScores,
          moveHistory: [...prev.moveHistory, index],
        };
      });
    },
    [config.mode]
  );

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setState((prev) => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: 'X',
      gameResult: { status: 'playing', winner: null, winningLine: null },
      moveHistory: [],
      isAIThinking: false,
    }));
  }, []);

  const resetAll = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setState({
      board: createEmptyBoard(),
      currentPlayer: 'X',
      gameResult: { status: 'playing', winner: null, winningLine: null },
      scores: { X: 0, O: 0, draws: 0 },
      moveHistory: [],
      isAIThinking: false,
    });
  }, []);

  return {
    board: state.board,
    currentPlayer: state.currentPlayer,
    gameResult: state.gameResult,
    scores: state.scores,
    isAIThinking: state.isAIThinking,
    moveCount: state.moveHistory.length,
    handleCellClick,
    resetGame,
    resetAll,
  };
}
