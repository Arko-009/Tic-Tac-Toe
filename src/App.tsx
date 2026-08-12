import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameConfig, GameScreen } from './game/types';
import { useGameState } from './hooks/useGameState';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useSoundEffects } from './hooks/useSoundEffects';
import { GameModeSelector } from './components/GameModeSelector';
import { Board } from './components/Board';
import { GameHeader } from './components/GameHeader';
import { GameOverModal } from './components/GameOverModal';
import { Leaderboard } from './components/Leaderboard';
import { ParticleCanvas } from './components/ParticleCanvas';
import { StreakBadge } from './components/StreakBadge';
import './App.css';
import './components.css';

const DEFAULT_CONFIG: GameConfig = {
  mode: 'ai',
  difficulty: 'medium',
  playerXName: 'Player 1',
  playerOName: 'Smart Bot',
};

function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleType, setParticleType] = useState<'confetti' | 'fire' | 'none'>('none');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameResultProcessed, setGameResultProcessed] = useState(false);

  const { playSound, toggleSound } = useSoundEffects();
  const leaderboard = useLeaderboard();
  const gameState = useGameState(config);

  const prevMoveCountRef = useRef(0);

  // Play move sound when board changes
  useEffect(() => {
    if (gameState.moveCount > prevMoveCountRef.current && gameState.moveCount > 0) {
      playSound('move');
    }
    prevMoveCountRef.current = gameState.moveCount;
  }, [gameState.moveCount, playSound]);

  // Handle game over — record results and trigger effects
  useEffect(() => {
    if (gameState.gameResult.status === 'playing' || gameResultProcessed) return;

    setGameResultProcessed(true);

    if (gameState.gameResult.status === 'won') {
      const winner = gameState.gameResult.winner!;
      const winnerName = winner === 'X' ? config.playerXName : config.playerOName;
      const loserName = winner === 'X' ? config.playerOName : config.playerXName;

      leaderboard.recordWin(winnerName);
      leaderboard.recordLoss(loserName);

      playSound('win');

      const winnerStats = leaderboard.getPlayerStats(winnerName);
      const streak = winnerStats ? winnerStats.currentStreak : 1;

      if (streak >= 5) {
        setParticleType('fire');
        setParticleTrigger((p) => p + 1);
        setTimeout(() => {
          setParticleType('confetti');
          setParticleTrigger((p) => p + 1);
        }, 300);
        playSound('streak');
      } else {
        setParticleType('confetti');
        setParticleTrigger((p) => p + 1);
      }
    } else if (gameState.gameResult.status === 'draw') {
      leaderboard.recordDraw(config.playerXName);
      leaderboard.recordDraw(config.playerOName);
      playSound('draw');
    }
  }, [gameState.gameResult, gameResultProcessed, config, leaderboard, playSound]);

  const handleStartGame = useCallback(
    (newConfig: GameConfig) => {
      setConfig(newConfig);
      setScreen('game');
      setGameResultProcessed(false);
      playSound('click');
    },
    [playSound]
  );

  const handlePlayAgain = useCallback(() => {
    gameState.resetGame();
    setGameResultProcessed(false);
    playSound('click');
  }, [gameState, playSound]);

  const handleChangeMode = useCallback(() => {
    gameState.resetAll();
    setScreen('menu');
    setGameResultProcessed(false);
    playSound('click');
  }, [gameState, playSound]);

  const handleCellClick = useCallback(
    (index: number) => {
      gameState.handleCellClick(index);
    },
    [gameState]
  );

  const handleCellHover = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  const handleToggleSound = useCallback(() => {
    const enabled = toggleSound();
    setSoundEnabled(enabled);
  }, [toggleSound]);

  // Get current streak for the winner
  const getWinnerStreak = () => {
    if (gameState.gameResult.status !== 'won') return 0;
    const winnerName =
      gameState.gameResult.winner === 'X' ? config.playerXName : config.playerOName;
    const stats = leaderboard.getPlayerStats(winnerName);
    return stats?.currentStreak ?? 1;
  };

  // Get active streak for display during game
  const getActiveStreak = () => {
    const statsX = leaderboard.getPlayerStats(config.playerXName);
    const statsO = leaderboard.getPlayerStats(config.playerOName);
    if (statsX && statsX.currentStreak >= 2) return { streak: statsX.currentStreak, name: config.playerXName };
    if (statsO && statsO.currentStreak >= 2) return { streak: statsO.currentStreak, name: config.playerOName };
    return null;
  };

  const activeStreak = getActiveStreak();

  return (
    <div className="app">
      <ParticleCanvas trigger={particleTrigger} type={particleType} />

      {/* Sound Toggle */}
      <button
        className="sound-toggle"
        onClick={handleToggleSound}
        aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
        id="sound-toggle"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className="app-content">
          <GameModeSelector
            onStart={handleStartGame}
            onViewLeaderboard={() => setShowLeaderboard(true)}
          />
        </div>
      )}

      {/* GAME SCREEN */}
      {screen === 'game' && (
        <div className="app-content">
          <button className="back-button" onClick={handleChangeMode} id="back-to-menu">
            ← Menu
          </button>

          <GameHeader
            config={config}
            currentPlayer={gameState.currentPlayer}
            scores={gameState.scores}
            isAIThinking={gameState.isAIThinking}
            isGameOver={gameState.gameResult.status !== 'playing'}
          />

          {activeStreak && gameState.gameResult.status === 'playing' && (
            <StreakBadge streak={activeStreak.streak} playerName={activeStreak.name} />
          )}

          <Board
            board={gameState.board}
            currentPlayer={gameState.currentPlayer}
            winningLine={gameState.gameResult.winningLine}
            isGameOver={gameState.gameResult.status !== 'playing'}
            isDisabled={gameState.isAIThinking}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
          />

          <div className="game-actions">
            <button className="action-btn" onClick={handlePlayAgain} id="reset-game">
              🔄 New Round
            </button>
            <button className="action-btn" onClick={() => setShowLeaderboard(true)} id="game-leaderboard">
              🏆 Stats
            </button>
          </div>

          {/* Game Over Modal */}
          {gameState.gameResult.status !== 'playing' && (
            <GameOverModal
              result={gameState.gameResult}
              config={config}
              currentStreak={getWinnerStreak()}
              onPlayAgain={handlePlayAgain}
              onChangeMode={handleChangeMode}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </div>
      )}

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <Leaderboard
          entries={leaderboard.entries}
          onClose={() => setShowLeaderboard(false)}
          onClear={leaderboard.clearLeaderboard}
        />
      )}
    </div>
  );
}

export default App;
