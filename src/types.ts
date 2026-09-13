export enum GameState {
  BOOT = 'BOOT',
  MENU = 'MENU',
  CALIBRATION = 'CALIBRATION',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  CV_TEST = 'CV_TEST',
}

export enum Gesture {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM', // Accelerate
  CLOSED_FIST = 'CLOSED_FIST', // Brake
  THUMBS_UP = 'THUMBS_UP', // Nitro
  PEACE_SIGN = 'PEACE_SIGN', // Camera change
  WAVE = 'WAVE', // Pause
}

export interface GameSettings {
  handTrackingEnabled: boolean;
  steeringSensitivity: number;
  steeringDeadZone: number;
  showWebcamPreview: boolean;
  showHandLandmarks: boolean;
  cvDebugMode: boolean;
  soundVolume: number;
}
