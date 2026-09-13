import React, { useEffect, useRef, useState } from 'react';
import { HandTracker } from './HandTracker';
import { useGameStore } from '../store/useGameStore';
import { GameState } from '../types';

interface Props {
  large?: boolean;
}

export const WebcamPreview: React.FC<Props> = ({ large = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, gameState } = useGameStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'user' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            videoRef.current?.play();
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            
            // Initialize tracking
            const tracker = HandTracker.getInstance();
            await tracker.initialize();
            tracker.startTracking(videoRef.current!, canvasRef.current!);
          };
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setError("Camera permission denied.");
      }
    };

    if (settings.handTrackingEnabled || gameState === GameState.CV_TEST) {
      startWebcam();
    }

    return () => {
      HandTracker.getInstance().stopTracking();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [settings.handTrackingEnabled, gameState]);

  // If we are in the main menu (but not CV test), hide the PIP
  if (!large && (gameState === GameState.MENU || !settings.showWebcamPreview)) {
    return null;
  }

  const containerStyle: React.CSSProperties = large ? {
    width: '640px',
    height: '480px',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
    border: '4px solid rgba(255,255,255,0.2)',
  } : {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '240px',
    height: '180px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '2px solid rgba(255,255,255,0.1)',
    zIndex: 50
  };

  return (
    <div style={{ ...containerStyle, backgroundColor: '#000', overflow: 'hidden', position: large ? 'relative' : 'absolute' }}>
      {error ? (
        <div style={{ color: 'red', padding: '20px', fontSize: '12px', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              objectFit: 'cover', 
              transform: 'scaleX(-1)' // Mirror video
            }}
            playsInline
            muted
          />
          {/* Note: Canvas is NOT mirrored via CSS. We mirror coordinates mathematically in HandTracker.ts */}
          <canvas
            ref={canvasRef}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              objectFit: 'cover' 
            }}
          />
        </>
      )}
    </div>
  );
};
