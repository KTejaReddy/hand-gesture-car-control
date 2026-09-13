import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { GameState, Gesture } from '../types';

export const Car: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);
  const brakeLightLeftRef = useRef<THREE.Mesh>(null);
  const brakeLightRightRef = useRef<THREE.Mesh>(null);

  const physics = useRef({
    velocityX: 0,
    speed: 0,
    currentPitch: 0,
    currentRoll: 0,
    wheelRotation: 0,
    exhaustGlow: 0
  });

  const MAX_SPEED = 200;
  const ACCEL = 60; 
  const BRAKING = 150; 
  const FRICTION_Z = 20; 
  const MAX_LATERAL_SPEED = 25;
  const LATERAL_ACCEL = 100;
  const LATERAL_FRICTION = 40;

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== GameState.PLAYING) return;
    if (!groupRef.current || !bodyRef.current) return;

    let { speed, steering, currentGesture, distance } = store;
    const phys = physics.current;

    let targetPitch = 0;
    let isBraking = false;

    if (currentGesture === Gesture.OPEN_PALM || currentGesture === Gesture.THUMBS_UP) {
      const nitroMulti = currentGesture === Gesture.THUMBS_UP ? 1.6 : 1;
      phys.speed += (ACCEL * nitroMulti) * delta;
      targetPitch = -0.04; 
      
      if (currentGesture === Gesture.THUMBS_UP && store.nitro > 0) {
        store.setNitro(store.nitro - (25 * delta));
        store.setNitroActive(true);
        phys.exhaustGlow = THREE.MathUtils.lerp(phys.exhaustGlow, 5, delta * 10);
      } else {
        store.setNitroActive(false);
        phys.exhaustGlow = THREE.MathUtils.lerp(phys.exhaustGlow, 0, delta * 10);
      }
    } else if (currentGesture === Gesture.CLOSED_FIST) {
      phys.speed -= BRAKING * delta;
      targetPitch = 0.08; 
      isBraking = true;
      store.setNitroActive(false);
      phys.exhaustGlow = THREE.MathUtils.lerp(phys.exhaustGlow, 0, delta * 10);
    } else {
      phys.speed -= FRICTION_Z * delta; 
      store.setNitroActive(false);
      phys.exhaustGlow = THREE.MathUtils.lerp(phys.exhaustGlow, 0, delta * 10);
    }

    phys.speed = Math.max(0, Math.min(phys.speed, MAX_SPEED * (currentGesture === Gesture.THUMBS_UP ? 1.2 : 1)));
    store.setSpeed(phys.speed);
    store.setDistance(distance + (phys.speed / 3.6) * delta);

    if (currentGesture !== Gesture.THUMBS_UP && store.nitro < 100) {
      store.setNitro(store.nitro + (3 * delta));
    }

    const speedFactor = Math.max(0.6, 1 - (phys.speed / (MAX_SPEED * 1.2)));
    
    if (Math.abs(steering) > 0.05) {
      // Actively steering! +steering = right (+X), -steering = left (-X)
      phys.velocityX += (steering * LATERAL_ACCEL * speedFactor) * delta;
      // Multiplicative damping so it reaches a terminal sideways velocity
      phys.velocityX *= (1 - 4 * delta);
    } else {
      // Not steering, apply linear friction to stop sideways movement
      if (phys.velocityX > 0) {
        phys.velocityX = Math.max(0, phys.velocityX - LATERAL_FRICTION * delta);
      } else if (phys.velocityX < 0) {
        phys.velocityX = Math.min(0, phys.velocityX + LATERAL_FRICTION * delta);
      }
    }

    phys.velocityX = Math.max(-MAX_LATERAL_SPEED, Math.min(MAX_LATERAL_SPEED, phys.velocityX));

    groupRef.current.position.x += phys.velocityX * delta;
    
    const ROAD_WIDTH = 9.5;
    if (groupRef.current.position.x > ROAD_WIDTH) {
      groupRef.current.position.x = ROAD_WIDTH;
      phys.velocityX = 0;
    } else if (groupRef.current.position.x < -ROAD_WIDTH) {
      groupRef.current.position.x = -ROAD_WIDTH;
      phys.velocityX = 0;
    }
    store.setPlayerX(groupRef.current.position.x);

    const targetRoll = (phys.velocityX / MAX_LATERAL_SPEED) * 0.15;
    phys.currentRoll = THREE.MathUtils.lerp(phys.currentRoll, targetRoll, delta * 8);
    phys.currentPitch = THREE.MathUtils.lerp(phys.currentPitch, targetPitch, delta * 6);
    
    bodyRef.current.rotation.z = phys.currentRoll;
    bodyRef.current.rotation.x = phys.currentPitch;

    const rotationsPerSec = (phys.speed / 3.6) / 2.2;
    phys.wheelRotation += (rotationsPerSec * Math.PI * 2) * delta;
    const steerAngle = -steering * 0.4 * speedFactor;

    [frontLeftWheelRef, frontRightWheelRef, rearLeftWheelRef, rearRightWheelRef].forEach(ref => {
      if (ref.current) {
        const mesh = ref.current.children[0];
        if (mesh) mesh.rotation.x = phys.wheelRotation;
      }
    });

    if (frontLeftWheelRef.current) frontLeftWheelRef.current.rotation.y = steerAngle;
    if (frontRightWheelRef.current) frontRightWheelRef.current.rotation.y = steerAngle;

    const brakeIntensity = isBraking ? 10 : (phys.speed > 0 ? 0.5 : 0);
    if (brakeLightLeftRef.current && brakeLightRightRef.current) {
       const matL = brakeLightLeftRef.current.material as THREE.MeshStandardMaterial;
       const matR = brakeLightRightRef.current.material as THREE.MeshStandardMaterial;
       matL.emissiveIntensity = THREE.MathUtils.lerp(matL.emissiveIntensity, brakeIntensity, delta * 15);
       matR.emissiveIntensity = THREE.MathUtils.lerp(matR.emissiveIntensity, brakeIntensity, delta * 15);
    }
  });

  const materials = useMemo(() => {
    return {
      paint: new THREE.MeshStandardMaterial({
        color: '#b91c1c', 
        metalness: 0.6,
        roughness: 0.2,
        envMapIntensity: 1.5
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#000000',
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        envMapIntensity: 1.5
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: '#111111',
        roughness: 0.8,
        metalness: 0.2
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: '#cccccc',
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 1.5
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.9,
        metalness: 0.1
      }),
      brakeLight: new THREE.MeshStandardMaterial({
        color: '#ff0000',
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
        toneMapped: false
      }),
      headlight: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 5.0,
        toneMapped: false
      })
    };
  }, []);

  const Wheel = React.forwardRef<THREE.Group, { position: [number, number, number] }>(({ position }, ref) => (
    <group position={position} ref={ref}>
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.rubber} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.25, 32]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.chrome}>
          <cylinderGeometry args={[0.25, 0.25, 0.27, 16]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.chrome}>
          <cylinderGeometry args={[0.2, 0.2, 0.26, 32]} />
        </mesh>
        <mesh position={[0, 0.15, 0]} material={materials.paint}>
          <boxGeometry args={[0.28, 0.1, 0.1]} />
        </mesh>
      </group>
    </group>
  ));

  return (
    <group ref={groupRef} position={[0, 0, 4]}>
      <SpotLight position={[-0.8, 0.6, -2.5]} target={new THREE.Vector3(-0.8, 0, -20)} />
      <SpotLight position={[0.8, 0.6, -2.5]} target={new THREE.Vector3(0.8, 0, -20)} />

      <group ref={bodyRef}>
        {/* Lower Body */}
        <mesh position={[0, 0.4, 0]} material={materials.paint} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.45, 4.4]} />
        </mesh>
        
        {/* Front Splitter */}
        <mesh position={[0, 0.22, -2.1]} material={materials.plastic} castShadow>
          <boxGeometry args={[1.95, 0.15, 0.5]} />
        </mesh>
        
        {/* Rear Diffuser */}
        <mesh position={[0, 0.25, 2.1]} material={materials.plastic} castShadow>
          <boxGeometry args={[1.95, 0.15, 0.5]} />
        </mesh>
        
        {/* Cabin (Glass) */}
        <mesh position={[0, 0.85, -0.2]} material={materials.glass} castShadow>
          <boxGeometry args={[1.5, 0.5, 2.2]} />
        </mesh>
        
        {/* Roof line */}
        <mesh position={[0, 1.1, -0.3]} material={materials.paint} castShadow>
          <boxGeometry args={[1.4, 0.05, 1.8]} />
        </mesh>
        
        {/* Side Mirrors */}
        <mesh position={[-0.85, 0.7, -0.7]} material={materials.paint} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0.85, 0.7, -0.7]} material={materials.paint} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
        </mesh>

        {/* Spoiler */}
        <mesh position={[0, 0.8, 2.0]} material={materials.plastic} castShadow>
          <boxGeometry args={[1.8, 0.05, 0.3]} />
        </mesh>
        <mesh position={[-0.7, 0.7, 1.9]} material={materials.plastic} castShadow><boxGeometry args={[0.05, 0.2, 0.2]}/></mesh>
        <mesh position={[0.7, 0.7, 1.9]} material={materials.plastic} castShadow><boxGeometry args={[0.05, 0.2, 0.2]}/></mesh>

        {/* Headlights */}
        <mesh position={[-0.7, 0.5, -2.18]} material={materials.headlight}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
        </mesh>
        <mesh position={[0.7, 0.5, -2.18]} material={materials.headlight}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
        </mesh>
        
        {/* Taillights */}
        <mesh ref={brakeLightLeftRef} position={[-0.7, 0.5, 2.18]} material={materials.brakeLight}>
          <boxGeometry args={[0.4, 0.08, 0.05]} />
        </mesh>
        <mesh ref={brakeLightRightRef} position={[0.7, 0.5, 2.18]} material={materials.brakeLight}>
          <boxGeometry args={[0.4, 0.08, 0.05]} />
        </mesh>

        {/* Exhaust Pipes */}
        <mesh position={[-0.5, 0.25, 2.3]} material={materials.chrome}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
          <mesh rotation={[Math.PI/2, 0, 0]} />
        </mesh>
        <mesh position={[0.5, 0.25, 2.3]} material={materials.chrome}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
          <mesh rotation={[Math.PI/2, 0, 0]} />
        </mesh>
      </group>

      <Wheel ref={frontLeftWheelRef} position={[-1.0, 0.38, -1.3]} />
      <Wheel ref={frontRightWheelRef} position={[1.0, 0.38, -1.3]} />
      <Wheel ref={rearLeftWheelRef} position={[-1.0, 0.38, 1.4]} />
      <Wheel ref={rearRightWheelRef} position={[1.0, 0.38, 1.4]} />
    </group>
  );
};

const SpotLight = ({ position, target }: { position: [number, number, number], target: THREE.Vector3 }) => {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  
  React.useEffect(() => {
    if (lightRef.current && targetRef.current) {
      targetRef.current.position.copy(target);
      lightRef.current.target = targetRef.current;
    }
  }, [target]);

  return (
    <>
      <primitive object={targetRef.current} />
      <spotLight 
        ref={lightRef}
        position={position}
        color="#ffffff"
        intensity={2000}
        angle={Math.PI / 4}
        penumbra={0.5}
        distance={60}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
    </>
  );
};
