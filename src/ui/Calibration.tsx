import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameState, Gesture } from '../types';

export const Calibration: React.FC = () => {
  const { gameState, setGameState, steering, currentGesture, handX } = useGameStore();
  const [step, setStep] = useState(0);
  const [minX, setMinX] = useState(0.5);
  const [maxX, setMaxX] = useState(0.5);

  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (gameState !== GameState.CALIBRATION) return;

    // Track min/max X during calibration
    const updateExtremes = () => {
      const state = useGameStore.getState();
      setMinX(prev => Math.min(prev, state.handX));
      setMaxX(prev => Math.max(prev, state.handX));
      requestRef.current = requestAnimationFrame(updateExtremes);
    };
    requestRef.current = requestAnimationFrame(updateExtremes);

    const timer = setTimeout(() => {
      if (step < 3) {
        setStep(step + 1);
      } else {
        setGameState(GameState.PLAYING);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, step, setGameState]);

  if (gameState !== GameState.CALIBRATION) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.85)', color: 'white', fontFamily: 'Inter, sans-serif', zIndex: 90
    }}>
      <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#60a5fa' }}>CALIBRATION</h2>
      
      <div style={{ fontSize: '24px', textAlign: 'center', height: '80px' }}>
        {step === 0 && <p>Place your hand in front of the camera.</p>}
        {step === 1 && <p>Move your hand LEFT and RIGHT to steer.</p>}
        {step === 2 && <p>Show OPEN PALM 🖐 to accelerate.</p>}
        {step === 3 && <p>Show CLOSED FIST ✊ to brake.</p>}
      </div>

      {/* Raw Hand Tracking Visualization */}
      <div style={{ width: '400px', margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
          <span>LEFT LIMIT ({(minX * 100).toFixed(0)}%)</span>
          <span>CENTER (50%)</span>
          <span>RIGHT LIMIT ({(maxX * 100).toFixed(0)}%)</span>
        </div>
        
        {/* The Track */}
        <div style={{ position: 'relative', height: '12px', background: '#333', borderRadius: '6px' }}>
          {/* Detected range indicator */}
          <div style={{ 
            position: 'absolute', height: '100%', background: 'rgba(96, 165, 250, 0.3)', 
            left: `${minX * 100}%`, width: `${(maxX - minX) * 100}%` 
          }}></div>
          
          {/* Center line */}
          <div style={{ position: 'absolute', left: '50%', height: '20px', top: '-4px', width: '2px', background: '#aaa' }}></div>
          
          {/* Current Hand Position */}
          <div style={{
            position: 'absolute', top: '-6px', left: `${handX * 100}%`,
            width: '24px', height: '24px', borderRadius: '50%', background: '#4ade80',
            transform: 'translateX(-50%)', transition: 'left 0.1s linear'
          }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>Final Steering Output</div>
          <div style={{ width: '150px', height: '10px', background: '#333', borderRadius: '5px', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '-5px', left: `calc(50% + ${steering * 50}%)`,
              width: '20px', height: '20px', borderRadius: '50%', background: '#60a5fa',
              transform: 'translateX(-50%)', transition: 'left 0.1s'
            }} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>Detected Gesture</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: currentGesture !== Gesture.NONE ? '#4ade80' : '#ef4444' }}>
            {currentGesture.replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setGameState(GameState.PLAYING)}
        style={{ marginTop: '50px', padding: '10px 20px', background: 'transparent', border: '1px solid #aaa', color: '#aaa', borderRadius: '5px', cursor: 'pointer' }}
      >
        SKIP CALIBRATION
      </button>
    </div>
  );
};
