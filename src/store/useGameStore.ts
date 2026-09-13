import { create } from 'zustand';
import { GameState, Gesture } from '../types';
import type { GameSettings } from '../types';

interface GameStore {
  // Game Lifecycle State
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // Player Stats
  score: number;
  distance: number;
  speed: number;
  health: number;
  nitro: number;
  isNitroActive: boolean;
  
  // Stats Setters
  addScore: (amount: number) => void;
  setDistance: (dist: number) => void;
  setSpeed: (speed: number) => void;
  setHealth: (health: number) => void;
  setNitro: (nitro: number) => void;
  setNitroActive: (active: boolean) => void;

  // Hand Tracking Input (Mutable for performance, but we keep a reactive copy for UI if needed)
  currentGesture: Gesture;
  steering: number; // -1 (Left) to 1 (Right)
  playerX: number; // For collision detection
  handX: number; // Raw normalized X (0-1)
  handY: number; // Raw normalized Y (0-1)
  confidence: number;
  isHandDetected: boolean;
  cvFps: number;
  gameFps: number;
  handHistory: number[]; // Store recent X positions for the graph
  
  setGesture: (gesture: Gesture) => void;
  setSteering: (val: number) => void;
  setPlayerX: (val: number) => void;
  updateCVTelemetry: (data: { x: number, y: number, confidence: number, fps: number, isDetected: boolean }) => void;
  setGameFps: (fps: number) => void;

  // Settings
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;

  // Resets
  resetGame: () => void;
}

const defaultSettings: GameSettings = {
  handTrackingEnabled: true,
  steeringSensitivity: 1.0,
  steeringDeadZone: 0.15,
  showWebcamPreview: true,
  showHandLandmarks: true,
  cvDebugMode: false,
  soundVolume: 0.5,
};

export const useGameStore = create<GameStore>((set) => ({
  gameState: GameState.MENU,
  setGameState: (state) => set({ gameState: state }),

  score: 0,
  distance: 0,
  speed: 0,
  health: 100,
  nitro: 100,
  isNitroActive: false,

  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  setDistance: (dist) => set({ distance: dist }),
  setSpeed: (speed) => set({ speed }),
  setHealth: (health) => set({ health: Math.max(0, Math.min(100, health)) }),
  setNitro: (nitro) => set({ nitro: Math.max(0, Math.min(100, nitro)) }),
  setNitroActive: (active) => set({ isNitroActive: active }),

  currentGesture: Gesture.NONE,
  steering: 0,
  playerX: 0,
  handX: 0,
  handY: 0,
  confidence: 0,
  isHandDetected: false,
  cvFps: 0,
  gameFps: 0,
  handHistory: [],

  setGesture: (gesture) => set({ currentGesture: gesture }),
  setSteering: (val) => set({ steering: val }),
  setPlayerX: (val) => set({ playerX: val }),
  updateCVTelemetry: (data) => set((state) => {
    const newHistory = [...state.handHistory, data.x].slice(-50); // Keep last 50 points
    return {
      handX: data.x,
      handY: data.y,
      confidence: data.confidence,
      cvFps: data.fps,
      isHandDetected: data.isDetected,
      handHistory: newHistory
    };
  }),
  setGameFps: (fps) => set({ gameFps: fps }),

  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  resetGame: () =>
    set({
      score: 0,
      distance: 0,
      speed: 0,
      health: 100,
      nitro: 100,
      isNitroActive: false,
      gameState: GameState.PLAYING,
      currentGesture: Gesture.NONE,
      steering: 0,
    }),
}));
