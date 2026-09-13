import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';

export const HUD: React.FC = () => {
  const { gameState, score, distance, speed, health, nitro, currentGesture, steering } = useGameStore();

  if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', boxSizing: 'border-box',
      pointerEvents: 'none', padding: '30px', color: 'white', fontFamily: 'Inter, sans-serif',
      textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Score</div>
          <div style={{ fontSize: '32px', color: '#fff' }}>{Math.floor(score).toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Distance</div>
          <div style={{ fontSize: '28px', color: '#4ade80' }}>{(distance / 1000).toFixed(1)} KM</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Speed</div>
          <div style={{ fontSize: '36px', color: speed > 150 ? '#f87171' : '#fff' }}>{Math.floor(speed)} <span style={{fontSize: '18px', color: '#aaa'}}>KM/H</span></div>
        </div>
      </div>

      {/* Center Info (if paused) */}
      {gameState === GameState.PAUSED && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '48px', fontWeight: 'bold', letterSpacing: '8px', color: 'white' }}>
          PAUSED
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Left: Health */}
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>HEALTH</span>
            <span>{Math.floor(health)}%</span>
          </div>
          <div style={{ height: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${health}%`, height: '100%', background: health > 30 ? '#4ade80' : '#ef4444', transition: 'width 0.2s' }} />
          </div>
        </div>

        {/* Center: Gesture Info */}
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '15px 30px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>Current Gesture</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{currentGesture.replace('_', ' ')}</div>
          
          <div style={{ marginTop: '10px', height: '4px', width: '150px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative' }}>
             {/* Steering Indicator */}
             <div style={{ 
               position: 'absolute', top: '-4px', left: `calc(50% + ${steering * 50}%)`, 
               width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
               transform: 'translateX(-50%)', transition: 'left 0.1s'
             }} />
          </div>
        </div>

        {/* Right: Nitro */}
        <div style={{ width: '300px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', color: '#60a5fa' }}>NITRO</span>
            <span style={{ color: '#60a5fa' }}>{Math.floor(nitro)}%</span>
          </div>
          <div style={{ height: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${nitro}%`, height: '100%', background: '#60a5fa', transition: 'width 0.2s', boxShadow: '0 0 10px #60a5fa' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
