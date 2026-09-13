import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment as DreiEnvironment, PerspectiveCamera } from '@react-three/drei';
import { Car } from './Car';
import { Environment } from './Environment';
import { TrafficManager } from './TrafficManager';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';

// Dynamic Camera Controller
const CameraController = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame((state, delta) => {
    const store = useGameStore.getState();
    const speed = store.speed;
    const steering = store.steering; // -1 to 1

    if (cameraRef.current) {
      // Base positions
      let targetZ = 8;
      let targetY = 3.0;
      let targetFov = 60;
      
      // High speed pulls camera back and widens FOV
      if (speed > 100) {
        const factor = Math.min(1, (speed - 100) / 150); // 0 to 1
        targetZ = 8 + (factor * 2); 
        targetY = 3.0 - (factor * 0.5);
        targetFov = 60 + (factor * 15);
      }
      
      // Braking pushes camera forward (simulated by sudden speed drop, but we can just use speed directly)
      
      cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetZ, delta * 2);
      cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, targetY, delta * 2);
      cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, targetFov, delta * 3);
      
      // Slight camera tilt during hard steering
      const targetRoll = -steering * 0.05;
      cameraRef.current.rotation.set(-0.1, 0, targetRoll);
      
      cameraRef.current.updateProjectionMatrix();
    }
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 3.0, 8]} fov={60} />;
};

export const GameScene: React.FC = () => {
  const { gameState } = useGameStore();

  return (
    <Canvas shadows={{ type: THREE.PCFShadowMap }}>
      <CameraController />
      
      {/* Atmospheric Fog */}
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 20, 150]} />
      
      {/* Global Lighting */}
      <ambientLight intensity={2.0} />
      <directionalLight 
        position={[20, 50, 20]} 
        intensity={10.0} 
        color="#ffffff"
      />

      {/* Environment Map for realistic PBR reflections */}
      <Suspense fallback={null}>
        <DreiEnvironment preset="night" background={false} />
      </Suspense>

      <Environment />
      {gameState !== GameState.MENU && <TrafficManager />}
      {gameState !== GameState.MENU && <Car />}
    </Canvas>
  );
};
