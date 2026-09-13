import { HandLandmarker, FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { useGameStore } from '../store/useGameStore';
import { Gesture, GameState } from '../types';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

interface Point2D {
  x: number;
  y: number;
  timestamp: number;
}

export class HandTracker {
  private static instance: HandTracker;
  private handLandmarker: HandLandmarker | null = null;
  private gestureRecognizer: GestureRecognizer | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private isInitializing = false;
  private isTracking = false;
  private lastVideoTime = -1;
  private requestAnimationFrameId: number | null = null;

  // Smoothing & Telemetry
  private smoothedSteering = 0;
  private readonly STEERING_ALPHA = 0.2;
  private readonly DEAD_ZONE = 0.15;
  
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFps = 0;
  
  private trail: Point2D[] = [];

  private constructor() {}

  public static getInstance(): HandTracker {
    if (!HandTracker.instance) {
      HandTracker.instance = new HandTracker();
    }
    return HandTracker.instance;
  }

  public async initialize(): Promise<void> {
    if (this.handLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });

      this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  public async startTracking(videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
    if (!this.handLandmarker || !this.gestureRecognizer) {
      await this.initialize();
    }

    this.videoElement = videoElement;
    if (canvasElement) {
      this.canvasElement = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');
    }
    this.isTracking = true;
    this.processVideoFrame();
  }

  public stopTracking(): void {
    this.isTracking = false;
    if (this.requestAnimationFrameId !== null) {
      cancelAnimationFrame(this.requestAnimationFrameId);
    }
  }

  private processVideoFrame = () => {
    if (!this.isTracking || !this.videoElement || !this.handLandmarker || !this.gestureRecognizer) return;

    if (this.videoElement.readyState >= 2) {
      const startTimeMs = performance.now();
      if (this.lastVideoTime !== this.videoElement.currentTime) {
        this.lastVideoTime = this.videoElement.currentTime;

        // Calculate FPS
        this.frameCount++;
        if (startTimeMs - this.lastFrameTime >= 1000) {
          this.currentFps = this.frameCount;
          this.frameCount = 0;
          this.lastFrameTime = startTimeMs;
        }

        const landmarkerResult = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);
        const gestureResult = this.gestureRecognizer.recognizeForVideo(this.videoElement, startTimeMs);

        this.updateGameState(landmarkerResult, gestureResult);
        this.drawOverlay(landmarkerResult);
      }
    }

    this.requestAnimationFrameId = requestAnimationFrame(this.processVideoFrame);
  };

  private updateGameState(landmarkerResult: any, gestureResult: any) {
    const store = useGameStore.getState();
    if (!store.settings.handTrackingEnabled) return;

    if (landmarkerResult.landmarks && landmarkerResult.landmarks.length > 0) {
      const primaryHand = landmarkerResult.landmarks[0];
      const wrist = primaryHand[0];
      const middleMCP = primaryHand[9]; 
      
      const handCenter = {
        x: (wrist.x + middleMCP.x) / 2,
        y: (wrist.y + middleMCP.y) / 2,
      };

      let confidence = 1.0; 
      // Calculate steering (-1 to 1)
      // center.x is 0 to 1. MediaPipe uses un-flipped image, so when user moves right, 
      // their hand goes to the left side of the un-flipped image (smaller x).
      // Therefore, to steer right, we need a smaller x.
      let rawSteering = -(handCenter.x - 0.5) * 2;
      
      if (Math.abs(rawSteering) < this.DEAD_ZONE) {
        rawSteering = 0;
      } else {
        rawSteering = Math.sign(rawSteering) * ((Math.abs(rawSteering) - this.DEAD_ZONE) / (1 - this.DEAD_ZONE));
      }

      this.smoothedSteering = (this.STEERING_ALPHA * rawSteering) + ((1 - this.STEERING_ALPHA) * this.smoothedSteering);
      
      store.setSteering(this.smoothedSteering * store.settings.steeringSensitivity);

      let detectedGesture = Gesture.NONE;
      if (gestureResult.gestures && gestureResult.gestures.length > 0) {
        const topGesture = gestureResult.gestures[0][0];
        confidence = topGesture.score; 
        
        if (topGesture.score > 0.6) {
          switch (topGesture.categoryName) {
            case 'Open_Palm': detectedGesture = Gesture.OPEN_PALM; break;
            case 'Closed_Fist': detectedGesture = Gesture.CLOSED_FIST; break;
            case 'Thumb_Up': detectedGesture = Gesture.THUMBS_UP; break;
            case 'Victory': detectedGesture = Gesture.PEACE_SIGN; break;
          }
        }
      }
      
      store.setGesture(detectedGesture);
      
      store.updateCVTelemetry({
        x: handCenter.x,
        y: handCenter.y,
        confidence,
        fps: this.currentFps,
        isDetected: true
      });

    } else {
      this.smoothedSteering = this.smoothedSteering * 0.9;
      store.setSteering(this.smoothedSteering);
      store.setGesture(Gesture.NONE);
      store.updateCVTelemetry({
        x: 0.5,
        y: 0.5,
        confidence: 0,
        fps: this.currentFps,
        isDetected: false
      });
    }
  }

  private drawOverlay(result: any) {
    if (!this.canvasCtx || !this.canvasElement || !this.videoElement) return;
    
    const store = useGameStore.getState();
    const w = this.canvasElement.width;
    const h = this.canvasElement.height;
    const ctx = this.canvasCtx;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (!store.settings.showHandLandmarks && !store.settings.cvDebugMode && store.gameState !== GameState.CV_TEST) {
      ctx.restore();
      return;
    }

    // Mathematical mirroring function for X coordinates
    // Video is mirrored via CSS scaleX(-1), canvas is NOT mirrored.
    // So to draw on canvas such that it aligns with mirrored video, we invert X.
    const getX = (normalizedX: number) => (1 - normalizedX) * w;
    const getY = (normalizedY: number) => normalizedY * h;

    if (result.landmarks && result.landmarks.length > 0) {
      result.landmarks.forEach((landmarks: any[], index: number) => {
        const isPrimary = index === 0;
        
        // Connect skeleton
        ctx.strokeStyle = isPrimary ? 'rgba(74, 222, 128, 0.8)' : 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.shadowColor = isPrimary ? 'rgba(74, 222, 128, 0.5)' : 'transparent';
        ctx.shadowBlur = 10;
        
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          ctx.beginPath();
          ctx.moveTo(getX(start.x), getY(start.y));
          ctx.lineTo(getX(end.x), getY(end.y));
          ctx.stroke();
        });

        // Draw joints and fingertips
        ctx.shadowBlur = 0;
        for (let i = 0; i < landmarks.length; i++) {
          const lm = landmarks[i];
          const isFingertip = [4, 8, 12, 16, 20].includes(i);
          ctx.fillStyle = isPrimary ? (isFingertip ? '#ffffff' : '#4ade80') : '#666666';
          ctx.beginPath();
          ctx.arc(getX(lm.x), getY(lm.y), isFingertip ? 4 : 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw Center, Trail, and Labels for Primary Hand only
        if (isPrimary) {
          const wrist = landmarks[0];
          const middleMCP = landmarks[9];
          const centerX = getX((wrist.x + middleMCP.x) / 2);
          const centerY = getY((wrist.y + middleMCP.y) / 2);

          // Draw Center dot (star-like)
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // Outer ring for center
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
          ctx.stroke();

          // Update trail
          const now = performance.now();
          this.trail.push({ x: centerX, y: centerY, timestamp: now });
          this.trail = this.trail.filter(pt => now - pt.timestamp < 1500); // 1.5s trail

          // Draw fading trail
          if (this.trail.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < this.trail.length; i++) {
              const pt = this.trail[i];
              if (i === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            
            const grad = ctx.createLinearGradient(
              this.trail[0].x, this.trail[0].y, 
              this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y
            );
            grad.addColorStop(0, 'rgba(96, 165, 250, 0)');
            grad.addColorStop(1, 'rgba(96, 165, 250, 0.8)');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // Dynamic Labels hovering near hand
          ctx.font = 'bold 14px Inter';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          
          const labelX = centerX + 30;
          let labelY = centerY - 40;
          
          // Gesture Label
          const gestureName = store.currentGesture !== Gesture.NONE ? store.currentGesture.replace('_', ' ') : 'UNKNOWN';
          ctx.fillText(`GESTURE: ${gestureName}`, labelX, labelY);
          
          // Steering Label
          labelY += 20;
          let steerDir = 'CENTER';
          if (store.steering < -0.05) steerDir = '← LEFT';
          else if (store.steering > 0.05) steerDir = 'RIGHT →';
          ctx.fillText(`STEERING: ${steerDir}`, labelX, labelY);
          
          // Exact Steering Value
          labelY += 15;
          ctx.font = '12px Inter';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`VAL: ${(store.steering * 100).toFixed(0)}%`, labelX, labelY);

        } else {
          // Secondary hand label
          ctx.font = '12px Inter';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('IGNORED', getX(landmarks[0].x), getY(landmarks[0].y) + 20);
        }
      });
    } else {
      this.trail = [];
    }
    
    // Top-Left Debug Information (Global)
    if (store.settings.cvDebugMode || store.gameState === GameState.CV_TEST) {
      ctx.font = '12px monospace';
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      
      const padding = 20;
      let yOffset = 30;
      
      ctx.fillText(`HAND: ${store.isHandDetected ? 'DETECTED' : 'NOT DETECTED'}`, padding, yOffset);
      yOffset += 20;
      
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`GESTURE: ${store.currentGesture.replace('_', ' ')}`, padding, yOffset);
      yOffset += 20;
      
      ctx.fillText(`CONFIDENCE: ${(store.confidence * 100).toFixed(0)}%`, padding, yOffset);
      yOffset += 20;
      
      ctx.fillText(`X: ${store.handX.toFixed(2)} | Y: ${store.handY.toFixed(2)}`, padding, yOffset);
      yOffset += 20;
      
      ctx.fillText(`STEERING: ${store.steering.toFixed(2)}`, padding, yOffset);
      yOffset += 20;
      
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CV FPS: ${this.currentFps} | GAME FPS: ${store.gameFps}`, padding, yOffset);
    }
    
    ctx.restore();
  }
}
