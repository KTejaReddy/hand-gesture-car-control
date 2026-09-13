import React from 'react';
import './styles/index.css';
import { MainMenu } from './ui/MainMenu';
import { Calibration } from './ui/Calibration';
import { HUD } from './ui/HUD';
import { CVTestMode } from './ui/CVTestMode';
import { WebcamPreview } from './handTracking/WebcamPreview';
import { GameScene } from './game/GameScene';
import { useKeyboardControls } from './hooks/useKeyboardControls';

function App() {
  useKeyboardControls();

  return (
    <>
      <MainMenu />
      <CVTestMode />
      <Calibration />
      <HUD />
      <WebcamPreview />
      
      {/* 3D Canvas Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <GameScene />
      </div>
    </>
  );
}

export default App;
