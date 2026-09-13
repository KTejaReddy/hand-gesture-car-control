import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';

interface TrafficCarState {
  id: number;
  position: THREE.Vector3;
  speed: number;
  color: string;
  active: boolean;
  lane: number;
  type: 'sedan' | 'truck';
}

const LANES = [-7, -2.5, 2.5, 7];
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#94a3b8', '#1c1917', '#991b1b'];

// Traffic Car Component to handle realistic rendering per car
const TrafficVehicle: React.FC<{ car: TrafficCarState }> = ({ car }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const materials = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: car.color, metalness: 0.5, roughness: 0.3, clearcoat: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.1 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 }),
    lights: new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 2, toneMapped: false }),
    headlights: new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 2, toneMapped: false })
  }), [car.color]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(car.position);
      groupRef.current.visible = car.active;
    }
  });

  return (
    <group ref={groupRef} visible={car.active}>
      {car.type === 'sedan' ? (
        <group>
          <mesh position={[0, 0.4, 0]} material={materials.paint} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.5, 4.0]} />
          </mesh>
          <mesh position={[0, 0.8, -0.2]} material={materials.glass} castShadow>
            <boxGeometry args={[1.4, 0.4, 2.0]} />
          </mesh>
          {/* Taillights */}
          <mesh position={[-0.6, 0.5, 2.0]} material={materials.lights}><boxGeometry args={[0.4, 0.1, 0.05]}/></mesh>
          <mesh position={[0.6, 0.5, 2.0]} material={materials.lights}><boxGeometry args={[0.4, 0.1, 0.05]}/></mesh>
          {/* Headlights */}
          <mesh position={[-0.7, 0.4, -2.0]} material={materials.headlights}><boxGeometry args={[0.3, 0.1, 0.05]}/></mesh>
          <mesh position={[0.7, 0.4, -2.0]} material={materials.headlights}><boxGeometry args={[0.3, 0.1, 0.05]}/></mesh>
        </group>
      ) : (
        <group>
          {/* Truck Body */}
          <mesh position={[0, 1.2, 0.5]} material={materials.paint} castShadow receiveShadow>
            <boxGeometry args={[2.2, 2.0, 5.0]} />
          </mesh>
          <mesh position={[0, 0.8, -2.7]} material={materials.paint} castShadow receiveShadow>
            <boxGeometry args={[2.0, 1.2, 1.5]} />
          </mesh>
          <mesh position={[0, 1.0, -3.46]} material={materials.glass}><boxGeometry args={[1.8, 0.5, 0.1]}/></mesh>
          {/* Taillights */}
          <mesh position={[-0.8, 0.4, 3.0]} material={materials.lights}><boxGeometry args={[0.4, 0.1, 0.05]}/></mesh>
          <mesh position={[0.8, 0.4, 3.0]} material={materials.lights}><boxGeometry args={[0.4, 0.1, 0.05]}/></mesh>
          {/* Headlights */}
          <mesh position={[-0.8, 0.4, -3.45]} material={materials.headlights}><boxGeometry args={[0.4, 0.2, 0.05]}/></mesh>
          <mesh position={[0.8, 0.4, -3.45]} material={materials.headlights}><boxGeometry args={[0.4, 0.2, 0.05]}/></mesh>
        </group>
      )}
    </group>
  );
};

export const TrafficManager: React.FC = () => {
  const { gameState, speed: playerSpeed, playerX, setHealth, health, setGameState, addScore } = useGameStore();
  
  // Array of 12 traffic cars
  const cars = useRef<TrafficCarState[]>(Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    position: new THREE.Vector3(0, 0, 100),
    speed: 0,
    color: '#fff',
    active: false,
    lane: 0,
    type: Math.random() > 0.8 ? 'truck' : 'sedan'
  })));

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;
    
    // Spawn Logic
    if (Math.random() < 0.03) {
      const inactiveCar = cars.current.find(c => !c.active);
      if (inactiveCar) {
        inactiveCar.active = true;
        inactiveCar.lane = LANES[Math.floor(Math.random() * LANES.length)];
        inactiveCar.position.set(
          inactiveCar.lane,
          0,
          -120 - (Math.random() * 80) // Spawn way ahead
        );
        inactiveCar.speed = 90 + (Math.random() * 50); // 90 to 140 km/h
        inactiveCar.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        inactiveCar.type = Math.random() > 0.7 ? 'truck' : 'sedan';
      }
    }

    let currentHealth = health;
    const speedMsPlayer = playerSpeed / 3.6;

    cars.current.forEach((car) => {
      if (car.active) {
        const speedMsCar = car.speed / 3.6;
        const relativeSpeed = speedMsCar - speedMsPlayer;
        
        car.position.z -= relativeSpeed * delta; // Since -Z is forward

        // Collision Check (AABB)
        const carWidth = car.type === 'truck' ? 2.2 : 1.8;
        const carLength = car.type === 'truck' ? 6.5 : 4.0;
        
        if (
          car.position.z > (4 - carLength/2) && car.position.z < (4 + carLength/2 + 2) && // Z overlap with player at Z=4
          Math.abs(car.position.x - playerX) < ((carWidth + 1.8) / 2) // X overlap
        ) {
          car.active = false;
          currentHealth -= 20;
          setHealth(currentHealth);
          if (currentHealth <= 0) {
             setGameState(GameState.GAME_OVER);
          }
          // Collision spark could be fired here
        }
        
        // Despawn
        if (car.position.z > 25) {
          car.active = false;
          addScore(100);
        }
      }
    });
  });

  return (
    <group>
      {cars.current.map((car, i) => (
        <TrafficVehicle key={i} car={car} />
      ))}
    </group>
  );
};
