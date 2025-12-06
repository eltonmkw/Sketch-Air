import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { HandPoint } from '../types';
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";
import { Video, VideoOff, Eraser, Play, Pause, Hand, Power, AlertCircle } from 'lucide-react';

interface AirCanvasProps {
  onCanvasUpdate: (dataUrl: string) => void;
  isDrawingMode: boolean;
  strokeColor?: string;
}

export interface AirCanvasHandle {
  clearCanvas: () => void;
}

const AirCanvas = forwardRef<AirCanvasHandle, AirCanvasProps>(({ onCanvasUpdate, isDrawingMode, strokeColor = '#000000' }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // States
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true); // Default to enabled
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [gestureState, setGestureState] = useState<'drawing' | 'hover' | 'none'>('none');
  
  // Tracking Refs
  const lastPointRef = useRef<HandPoint | null>(null);
  const isDrawingRef = useRef(false);
  const requestRef = useRef<number>(0);

  // Expose clearCanvas to parent
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
          onCanvasUpdate('');
        }
      }
    }
  }));

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setHandLandmarker(landmarker);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error loading MediaPipe:", error);
      }
    };
    initMediaPipe();
  }, []);

  const clearInternalCanvas = () => {
     const canvas = canvasRef.current;
     if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           onCanvasUpdate('');
        }
     }
  };

  // Initialize/Toggle Camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const toggleCamera = async () => {
      // START CAMERA
      if (isCameraActive && isModelLoaded) {
        if (!videoRef.current) return;
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => {
              setCameraAllowed(true);
              setIsDrawingEnabled(true);
            };
          }
        } catch (err) {
          console.error("Camera error:", err);
          setIsCameraActive(false); 
        }
      } 
      // STOP CAMERA
      else {
        setCameraAllowed(false);
        setGestureState('none');
        isDrawingRef.current = false;
        lastPointRef.current = null;
        
        // Auto-clear canvas on stop
        clearInternalCanvas();

        if (videoRef.current && videoRef.current.srcObject) {
          const currentStream = videoRef.current.srcObject as MediaStream;
          currentStream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    };

    toggleCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, isModelLoaded]);

  const drawLine = (p1: HandPoint, p2: HandPoint, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4; // Slightly thinner for "Paint" feel
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  // Helper: Check if a finger is extended
  const isFingerExtended = (landmarks: any[], tipIdx: number, pipIdx: number) => {
    const wrist = landmarks[0];
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    
    // Distance from wrist
    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    
    // Tip must be significantly further from wrist than PIP
    return distTip > (distPip * 1.1); 
  };

  // Main Animation Loop
  const animate = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !handLandmarker || !cameraAllowed) {
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    let startTimeMs = performance.now();
    let results;
    try {
        results = handLandmarker.detectForVideo(video, startTimeMs);
    } catch (e) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    if (results && results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // Index finger tip (8)
      const indexTip = landmarks[8];
      const x = indexTip.x * canvas.width;
      const y = indexTip.y * canvas.height;
      const currentPoint = { x, y };

      // Check all fingers
      const indexExtended = isFingerExtended(landmarks, 8, 6);
      const middleExtended = isFingerExtended(landmarks, 12, 10);
      const ringExtended = isFingerExtended(landmarks, 16, 14);
      const pinkyExtended = isFingerExtended(landmarks, 20, 18);

      // Count extended fingers
      const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

      // Logic: 
      // DRAW: Only Index extended (Count === 1 && Index is True)
      // HOVER: Anything else (Open hand, Fist, Peace sign, etc.)
      
      let shouldDraw = false;
      let state: 'drawing' | 'hover' = 'hover';

      if (indexExtended && extendedCount === 1) {
        shouldDraw = true;
        state = 'drawing';
      } else {
        shouldDraw = false;
        state = 'hover';
      }

      // Force Pause Override
      if (!isDrawingEnabled) {
        shouldDraw = false;
        // Keep visual state as hover to show cursor
        state = 'hover';
      }

      setGestureState(state);

      if (shouldDraw) {
        if (!isDrawingRef.current) {
            lastPointRef.current = currentPoint;
        } else if (lastPointRef.current) {
             drawLine(lastPointRef.current, currentPoint, ctx);
             lastPointRef.current = currentPoint;
        }
        isDrawingRef.current = true;
      } else {
        // Just stopped drawing
        if (isDrawingRef.current) {
           onCanvasUpdate(canvas.toDataURL("image/png"));
        }
        isDrawingRef.current = false;
        lastPointRef.current = null;
      }

      // Visual Feedback Cursor
      ctx.beginPath();
      const radius = shouldDraw ? 5 : 10;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      if (state === 'drawing' && isDrawingEnabled) {
         ctx.fillStyle = strokeColor;
         ctx.strokeStyle = '#000000';
         ctx.lineWidth = 1;
      } else {
         // Hover State
         ctx.fillStyle = 'rgba(255, 255, 0, 0.4)'; // Transparent Yellow
         ctx.strokeStyle = '#000000';
         ctx.lineWidth = 1;
      }

      ctx.fill();
      ctx.stroke();

    } else {
        setGestureState('none');
        isDrawingRef.current = false;
        lastPointRef.current = null;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [cameraAllowed, handLandmarker, strokeColor, onCanvasUpdate, isDrawingEnabled]);

  useEffect(() => {
    if (cameraAllowed) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, cameraAllowed]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden group">
      {/* The Webcam layer (opacity lowered to look like it's "behind" the paper slightly, or tracing paper) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraAllowed ? 'opacity-50' : 'opacity-0'}`}
      />
      
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${cameraAllowed ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Start / Loading Screen (Styled like a system message) */}
      {(!isCameraActive || !isModelLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f0f0f0] z-20 text-gray-700">
          {!isModelLoaded ? (
             <div className="flex flex-col items-center p-6 border border-gray-300 bg-white shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm">Loading components...</p>
             </div>
          ) : (
             <div className="text-center space-y-4 p-8 border border-gray-300 bg-white shadow-sm max-w-sm">
                <div className="flex justify-center text-blue-500">
                   <Video className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-black">Enable Webcam</h3>
                <p className="text-xs text-gray-500">
                    To start drawing in the air, please allow camera access.
                </p>
                <button 
                  onClick={() => setIsCameraActive(true)}
                  className="bg-gray-100 hover:bg-blue-100 border border-gray-300 text-gray-800 px-6 py-1 text-sm rounded-sm mx-auto flex items-center gap-2 active:translate-y-px"
                >
                   <Play className="w-3 h-3 fill-current" />
                   Start
                </button>
             </div>
          )}
        </div>
      )}

      {/* Control Overlay (Styled like status indicators) */}
      {isCameraActive && (
        <>
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <div className="bg-white/90 border border-gray-400 text-[10px] px-2 py-1 shadow-sm text-black">
                 <p className="font-bold mb-1 border-b border-gray-300">Gestures</p>
                 <div className={`flex items-center gap-2 ${gestureState === 'drawing' && isDrawingEnabled ? 'text-green-700 font-bold' : 'text-gray-500'}`}>
                    <span>☝ Index: Draw</span>
                 </div>
                 <div className={`flex items-center gap-2 ${gestureState === 'hover' ? 'text-yellow-700 font-bold' : 'text-gray-500'}`}>
                    <span>✋ Open: Move</span>
                 </div>
              </div>
          </div>

          <div className="absolute bottom-2 right-2 z-10 flex gap-2">
             <button 
               onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
               className={`px-3 py-1 bg-white border border-gray-400 text-xs shadow-sm hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2 ${!isDrawingEnabled ? 'text-red-600 font-bold' : 'text-green-700'}`}
             >
               {isDrawingEnabled ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500"></div>}
               {isDrawingEnabled ? "Drawing: ON" : "Drawing: OFF"}
             </button>

             <button 
               onClick={() => setIsCameraActive(false)}
               className="bg-white border border-gray-400 text-black px-3 py-1 text-xs shadow-sm hover:bg-red-50 hover:border-red-300 flex items-center gap-1"
             >
               <Power className="w-3 h-3" />
               Stop
             </button>
          </div>
        </>
      )}
    </div>
  );
});

export default AirCanvas;