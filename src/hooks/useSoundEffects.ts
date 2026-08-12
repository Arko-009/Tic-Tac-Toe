import { useCallback, useRef } from 'react';

type SoundType = 'move' | 'win' | 'draw' | 'hover' | 'click' | 'streak';

// We synthesize all sounds with the Web Audio API — zero external files
export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
      if (!enabledRef.current) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio context may not be available
      }
    },
    [getCtx]
  );

  const playSound = useCallback(
    (sound: SoundType) => {
      if (!enabledRef.current) return;
      switch (sound) {
        case 'move':
          playTone(600, 0.1, 'sine', 0.1);
          setTimeout(() => playTone(800, 0.08, 'sine', 0.08), 50);
          break;
        case 'win':
          playTone(523, 0.15, 'sine', 0.15);
          setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 120);
          setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 240);
          setTimeout(() => playTone(1047, 0.3, 'sine', 0.18), 360);
          break;
        case 'draw':
          playTone(400, 0.2, 'triangle', 0.1);
          setTimeout(() => playTone(350, 0.3, 'triangle', 0.1), 200);
          break;
        case 'hover':
          playTone(1200, 0.04, 'sine', 0.03);
          break;
        case 'click':
          playTone(900, 0.06, 'square', 0.05);
          break;
        case 'streak':
          // Ascending arpeggio for streak milestone
          [523, 659, 784, 1047, 1319].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 80);
          });
          break;
      }
    },
    [playTone]
  );

  const toggleSound = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  return {
    playSound,
    toggleSound,
    isSoundEnabled: () => enabledRef.current,
  };
}
