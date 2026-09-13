import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';
import { Play, ArrowLeft } from 'lucide-react';
import { WebcamPreview } from '../handTracking/WebcamPreview';

export const CVTestMode: React.FC = () => {
  const { gameState, setGameState } = useGameStore();

  if (gameState !== GameState.CV_TEST) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.95)', color: 'white', fontFamily: 'Inter, sans-serif', zIndex: 80, backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#60a5fa', letterSpacing: '2px' }}>TEST HAND TRACKING</h2>
      
      <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '18px' }}>
        Move your hand to test tracking accuracy and steering mapping.
      </p>

      {/* Large Webcam Preview */}
      <div style={{ marginBottom: '40px' }}>
        <WebcamPreview large={true} />
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={() => {
             useGameStore.getState().resetGame();
             setGameState(GameState.CALIBRATION);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '16px 32px', fontSize: '18px', fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}
        >
          <Play size={24} /> START RACE
        </button>

        <button 
          onClick={() => setGameState(GameState.MENU)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '16px 32px', fontSize: '18px', fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={24} /> BACK TO MENU
        </button>
      </div>
    </div>
  );
};
