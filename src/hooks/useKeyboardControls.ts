import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameState, Gesture } from '../types';

export const useKeyboardControls = () => {
  useEffect(() => {
    const store = useGameStore.getState();

    const handleKeyDown = (e: KeyboardEvent) => {
      // If hand tracking is active, don't override steering/gestures immediately, 
      // but if user uses keyboard, we assume they want fallback.
      
      const { setSteering, setGesture, setGameState, gameState } = useGameStore.getState();

      if (e.key === 'Escape') {
        if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
        return;
      }

      if (gameState !== GameState.PLAYING) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setGesture(Gesture.OPEN_PALM);
          break;
        case 's':
        case 'arrowdown':
          setGesture(Gesture.CLOSED_FIST);
          break;
        case 'a':
        case 'arrowleft':
          setSteering(-1);
          break;
        case 'd':
        case 'arrowright':
          setSteering(1);
          break;
        case ' ':
          setGesture(Gesture.THUMBS_UP);
          break;
        case 'c':
          setGesture(Gesture.PEACE_SIGN);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { setSteering, setGesture, currentGesture, steering } = useGameStore.getState();
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
        case 's':
        case 'arrowdown':
        case ' ':
        case 'c':
          setGesture(Gesture.NONE);
          break;
        case 'a':
        case 'arrowleft':
          if (steering < 0) setSteering(0);
          break;
        case 'd':
        case 'arrowright':
          if (steering > 0) setSteering(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
};
