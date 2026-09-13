import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';
import { Settings, CarFront, Play, HelpCircle, Activity, Bug } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const { gameState, setGameState } = useGameStore();

  if (gameState !== GameState.MENU && gameState !== GameState.GAME_OVER) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(0, 0, 0, 0.9))',
      color: 'white', fontFamily: 'Inter, sans-serif', zIndex: 100, backdropFilter: 'blur(5px)'
    }}>
      
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ 
          fontSize: '72px', fontWeight: '900', margin: 0, 
          background: 'linear-gradient(to right, #60a5fa, #c084fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '4px', textTransform: 'uppercase', fontStyle: 'italic'
        }}>
          Gesture Racer
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', marginTop: '10px', letterSpacing: '2px' }}>
          Drive with your hands. No controller needed.
        </p>
      </div>

      {gameState === GameState.GAME_OVER && (
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', fontSize: '36px', margin: '0 0 10px 0' }}>GAME OVER</h2>
          <p style={{ fontSize: '24px', color: '#fff', margin: 0 }}>Score: {Math.floor(useGameStore.getState().score).toLocaleString()}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
        <MenuButton 
          icon={<Play size={24} />} 
          text={gameState === GameState.GAME_OVER ? "PLAY AGAIN" : "START RACE"} 
          onClick={() => {
            useGameStore.getState().resetGame();
            setGameState(GameState.CALIBRATION);
          }} 
          primary 
        />
        <MenuButton icon={<CarFront size={24} />} text="GARAGE" onClick={() => {}} />
        <MenuButton icon={<Settings size={24} />} text="SETTINGS" onClick={() => {}} />
        <MenuButton 
          icon={<Activity size={24} />} 
          text="TEST HAND TRACKING" 
          onClick={() => {
             useGameStore.getState().updateSettings({ cvDebugMode: true });
             setGameState(GameState.CV_TEST);
          }} 
        />
        <MenuButton 
          icon={<Bug size={24} />} 
          text={`CV DEBUG MODE: ${useGameStore.getState().settings.cvDebugMode ? 'ON' : 'OFF'}`} 
          onClick={() => {
             const current = useGameStore.getState().settings.cvDebugMode;
             useGameStore.getState().updateSettings({ cvDebugMode: !current });
          }} 
        />
      </div>

    </div>
  );
};

const MenuButton: React.FC<{ icon: React.ReactNode, text: string, onClick: () => void, primary?: boolean }> = ({ icon, text, onClick, primary }) => {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
        padding: '16px 24px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px',
        background: primary ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.1)',
        color: 'white', border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: primary ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        if (!primary) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (!primary) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      }}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
