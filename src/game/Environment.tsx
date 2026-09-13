import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';

const PROP_COUNT = 20;
const ROAD_LENGTH = 300;

export const Environment: React.FC = () => {
  const roadMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const propsGroupRef = useRef<THREE.Group>(null);
  
  const { speed, gameState } = useGameStore();

  const roadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, 1024, 1024);
      
      for (let i = 0; i < 50000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#333333' : '#111111';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
      }

      ctx.fillStyle = '#ffffff';
      for(let y = 0; y < 1024; y += 128) {
        ctx.fillRect(341 - 4, y, 8, 64);
        ctx.fillRect(682 - 4, y, 8, 64);
      }

      ctx.fillStyle = '#eab308';
      ctx.fillRect(40, 0, 12, 1024);
      ctx.fillRect(984 - 12, 0, 12, 1024);
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(170, 0, 40, 1024);
      ctx.fillRect(470, 0, 40, 1024);
      ctx.fillRect(810, 0, 40, 1024);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 15);
    tex.anisotropy = 16;
    return tex;
  }, []);

  const propsData = useMemo(() => {
    return Array.from({ length: PROP_COUNT }).map((_, i) => ({
      z: -i * (ROAD_LENGTH / PROP_COUNT),
      isLight: i % 2 === 0
    }));
  }, []);

  useFrame((state, delta) => {
    if (gameState === GameState.PLAYING) {
      const speedMs = speed / 3.6;
      
      if (roadMaterialRef.current && roadMaterialRef.current.map) {
        roadMaterialRef.current.map.offset.y -= (speed / 120) * delta;
      }

      if (propsGroupRef.current) {
        propsGroupRef.current.children.forEach(prop => {
          prop.position.z += speedMs * delta;
          if (prop.position.z > 10) {
            prop.position.z -= ROAD_LENGTH;
          }
        });
      }
    }
  });

  return (
    <group position={[0, 0, 20]}>
      {/* High-quality Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -ROAD_LENGTH/2]} receiveShadow>
        <planeGeometry args={[20, ROAD_LENGTH]} />
        <meshStandardMaterial ref={roadMaterialRef} map={roadTexture} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Shoulders / Dirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, -0.05, -ROAD_LENGTH/2]} receiveShadow>
        <planeGeometry args={[40, ROAD_LENGTH]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.05, -ROAD_LENGTH/2]} receiveShadow>
        <planeGeometry args={[40, ROAD_LENGTH]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>

      {/* Concrete Barriers */}
      <mesh position={[-10.2, 0.5, -ROAD_LENGTH/2]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 1, ROAD_LENGTH]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
      <mesh position={[10.2, 0.5, -ROAD_LENGTH/2]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 1, ROAD_LENGTH]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>

      {/* Moving Scenery (Lights, poles) */}
      <group ref={propsGroupRef}>
        {propsData.map((prop, i) => (
          <group key={i} position={[0, 0, prop.z]}>
            <mesh position={[-11, 4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 8]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[11, 4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 8]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {prop.isLight && (
              <>
                <mesh position={[-9, 8, 0]}>
                  <boxGeometry args={[4, 0.1, 0.1]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffedd5" emissiveIntensity={5} />
                </mesh>
                
                <mesh position={[9, 8, 0]}>
                  <boxGeometry args={[4, 0.1, 0.1]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffedd5" emissiveIntensity={5} />
                </mesh>
              </>
            )}
          </group>
        ))}
      </group>
    </group>
  );
};
