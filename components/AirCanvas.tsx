
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { HandPoint } from '../types';
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";
import { Video, Play, Power, Trash2, Mic, Sparkles, Save, ThumbsUp } from 'lucide-react';

interface AirCanvasProps {
  onCanvasUpdate: (dataUrl: string) => void;
  onVoiceTrigger: () => void;
  onGenerateTrigger: () => void;
  onSaveTrigger: () => void;
  isDrawingMode: boolean;
  strokeColor: string;
  strokeWidth: number;
  isResultVisible: boolean; // New prop to know if we are looking at a result
}

export interface AirCanvasHandle {
  clearCanvas: () => void;
  undo: () => void;
}

const AirCanvas = forwardRef<AirCanvasHandle, AirCanvasProps>(({ onCanvasUpdate, onVoiceTrigger, onGenerateTrigger, onSaveTrigger, isDrawingMode, strokeColor, strokeWidth, isResultVisible }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null); // Layer for INK
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // Layer for CURSOR (UI)
  
  // States
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true); // Default to enabled
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [gestureState, setGestureState] = useState<'drawing' | 'hover' | 'clearing' | 'voice' | 'generating' | 'saving' | 'thumbsUp' | 'none'>('none');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isWarmup, setIsWarmup] = useState(true); // Warmup state to prevent instant triggers
  
  // Tracking Refs
  const lastPointRef = useRef<HandPoint | null>(null);
  const smoothedPointRef = useRef<HandPoint | null>(null); // For stabilization
  const isDrawingActiveRef = useRef(false); // Latch state for drawing
  const requestRef = useRef<number>(0);
  
  // Undo History
  const historyRef = useRef<ImageData[]>([]);

  // Gesture Consistency Refs
  const pinchConsistencyRef = useRef<number>(0);
  const oneFingerConsistencyRef = useRef<number>(0);
  const peaceSignConsistencyRef = useRef<number>(0);
  const threeFingerConsistencyRef = useRef<number>(0);
  const thumbsUpConsistencyRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0); // Global cooldown for triggers

  // Swipe Detection Refs
  const lastWristXRef = useRef<number | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  // Helper to save current state to history
  const saveToHistory = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Limit history to 20 steps to save memory
        if (historyRef.current.length > 20) {
            historyRef.current.shift();
        }
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      saveToHistory(); // Save before clearing
      triggerClearCanvas();
    },
    undo: () => {
      const canvas = drawingCanvasRef.current;
      if (canvas && historyRef.current.length > 0) {
         const ctx = canvas.getContext('2d');
         if (ctx) {
            const previousState = historyRef.current.pop();
            if (previousState) {
                ctx.putImageData(previousState, 0, 0);
                onCanvasUpdate(canvas.toDataURL("image/png"));
            }
         }
      } else {
         setFeedbackMessage("Nothing to Undo");
         setTimeout(() => setFeedbackMessage(null), 1000);
      }
    }
  }));

  const triggerClearCanvas = () => {
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
          onCanvasUpdate('');
          
          // Show Feedback
          setFeedbackMessage("✨ Canvas Cleared!");
          setTimeout(() => setFeedbackMessage(null), 1500);
        }
      }
  };

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
     const canvas = drawingCanvasRef.current;
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
              // Start Warmup period
              setIsWarmup(true);
              setTimeout(() => setIsWarmup(false), 2000); // 2 second warmup
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
        isDrawingActiveRef.current = false;
        lastPointRef.current = null;
        smoothedPointRef.current = null;
        pinchConsistencyRef.current = 0;
        historyRef.current = []; // Clear history on stop
        setIsWarmup(true);
        
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

  // Helper function to composite solid white background with sketch for export
  const getCompositeDataUrl = (canvas: HTMLCanvasElement): string => {
     const tempCanvas = document.createElement('canvas');
     tempCanvas.width = canvas.width;
     tempCanvas.height = canvas.height;
     const tempCtx = tempCanvas.getContext('2d');
     if (!tempCtx) return '';

     // 1. Fill White Background
     tempCtx.fillStyle = '#FFFFFF';
     tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
     
     // 2. Draw the sketch (which has transparent background) on top
     tempCtx.drawImage(canvas, 0, 0);
     
     // Export as JPEG to ensure no transparency
     return tempCanvas.toDataURL('image/jpeg', 0.95);
  };


  const drawLine = (p1: HandPoint, p2: HandPoint, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    
    // Use quadratic curve for smoother joints if we had more history, 
    // but with high-fps dense points, standard lineTo with dynamic smoothing is sufficient.
    ctx.lineTo(p2.x, p2.y);
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  // Linear Interpolation for Smoothing
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Main Animation Loop
  const animate = useCallback(() => {
    if (!videoRef.current || !drawingCanvasRef.current || !overlayCanvasRef.current || !handLandmarker || !cameraAllowed) {
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const drawingCanvas = drawingCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    const drawingCtx = drawingCanvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    
    if (!drawingCtx || !overlayCtx) return;

    // 1. Sync Canvas Sizes & Transforms
    if (drawingCanvas.width !== video.videoWidth || drawingCanvas.height !== video.videoHeight) {
      drawingCanvas.width = video.videoWidth;
      drawingCanvas.height = video.videoHeight;
      // Mirror transform for Drawing Layer
      drawingCtx.translate(drawingCanvas.width, 0);
      drawingCtx.scale(-1, 1);
    }
    
    if (overlayCanvas.width !== video.videoWidth || overlayCanvas.height !== video.videoHeight) {
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;
      // Mirror transform for Overlay Layer
      overlayCtx.translate(overlayCanvas.width, 0);
      overlayCtx.scale(-1, 1);
    }

    // 2. Clear Overlay Layer (UI/Cursor)
    overlayCtx.save();
    overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.restore();

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
      
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      const thumbIP = landmarks[3];
      const wrist = landmarks[0];

      // Calculate Pinch Distance
      const pinchDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
      
      // --- DYNAMIC STABILIZATION LOGIC ---
      const rawX = indexTip.x * drawingCanvas.width;
      const rawY = indexTip.y * drawingCanvas.height;

      if (!smoothedPointRef.current) {
          smoothedPointRef.current = { x: rawX, y: rawY };
      } else {
          const dx = rawX - smoothedPointRef.current.x;
          const dy = rawY - smoothedPointRef.current.y;
          const dist = Math.hypot(dx, dy);

          // Enhanced Stabilization
          // Slow movement (< 10px): Heavy smoothing (0.05) to kill jitter
          // Fast movement (> 100px): Light smoothing (0.5) for responsiveness
          const baseFactor = 0.05; 
          const speedFactor = Math.min(dist / 200, 0.45); 
          const smoothingFactor = baseFactor + speedFactor;

          smoothedPointRef.current = {
              x: lerp(smoothedPointRef.current.x, rawX, smoothingFactor),
              y: lerp(smoothedPointRef.current.y, rawY, smoothingFactor)
          };
      }

      // We use the Smoothed point for everything (Drawing & Cursor)
      const currentPoint = smoothedPointRef.current;
      const x = currentPoint.x;
      const y = currentPoint.y;


      // Cooldown check for special triggers
      const TRIGGER_COOLDOWN = 3000; // 3 seconds between voice/gen/save triggers
      const canTrigger = !isWarmup && (Date.now() - lastTriggerTimeRef.current > TRIGGER_COOLDOWN);

      // --- PINCH (DRAWING) LOGIC ---
      const canDraw = !isResultVisible && isDrawingEnabled && !isWarmup; 

      const START_THRESHOLD = 0.04; 
      const STOP_THRESHOLD = 0.08; 
      const REQUIRED_CONSISTENT_FRAMES = 5; 

      if (pinchDistance < START_THRESHOLD) {
          pinchConsistencyRef.current = pinchConsistencyRef.current + 1;
          
          if (pinchConsistencyRef.current >= REQUIRED_CONSISTENT_FRAMES) {
             if (!isDrawingActiveRef.current && canDraw) {
                 saveToHistory();
                 // Reset the smoothed point to current to avoid jumping lines on start
                 lastPointRef.current = currentPoint; 
             }
             if (canDraw) {
                 isDrawingActiveRef.current = true;
             }
          }
      } else {
          pinchConsistencyRef.current = 0;
          if (pinchDistance > STOP_THRESHOLD) {
             isDrawingActiveRef.current = false;
          }
      }

      // --- SWIPE TO ERASE LOGIC ---
      if (!isDrawingActiveRef.current && canDraw) {
          if (lastWristXRef.current !== null) {
              const dx = wrist.x - lastWristXRef.current;
              // Threshold: 0.06 normalized units per frame is a very fast movement
              const SWIPE_SPEED_THRESHOLD = 0.06;
              const COOLDOWN_MS = 1000;

              if (Math.abs(dx) > SWIPE_SPEED_THRESHOLD) {
                  const now = Date.now();
                  if (now - lastSwipeTimeRef.current > COOLDOWN_MS) {
                      saveToHistory(); // Save before swipe erase
                      setGestureState('clearing');
                      triggerClearCanvas();
                      lastSwipeTimeRef.current = now;
                  }
              }
          }
          lastWristXRef.current = wrist.x;
      } else {
          lastWristXRef.current = null; 
      }
      // ----------------------------

      // --- GESTURE LOGIC: 1 Finger (Voice), 2 Fingers (Gen), 3 Fingers (Save), Thumbs Up (Stop) ---
      const isExtended = (tipIdx: number, pipIdx: number) => {
          return landmarks[tipIdx].y < landmarks[pipIdx].y;
      }
      
      const indexExtended = isExtended(8, 6);
      const middleExtended = isExtended(12, 10);
      const ringExtended = isExtended(16, 14);
      const pinkyExtended = isExtended(20, 18);
      
      // CRITICAL FIX: Ensure thumb is FAR from index for One Finger Pose to avoid false triggers while drawing
      const thumbIsNotPinching = pinchDistance > 0.15; 
      // Thumbs Up: Thumb tip above IP, others curled
      const thumbIsUp = thumbTip.y < thumbIP.y;

      const ONE_FINGER_POSE = indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbIsNotPinching;
      const PEACE_SIGN_POSE = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
      const THREE_FINGER_POSE = indexExtended && middleExtended && ringExtended && !pinkyExtended;
      const THUMBS_UP_POSE = thumbIsUp && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbIsNotPinching;

      // Special Trigger Logic (only if not drawing and off cooldown)
      if (canTrigger) {
          
          const HOLD_FRAMES = 30; // Hold for ~1 second (30fps)

          // VOICE (1 Finger)
          if (ONE_FINGER_POSE && !isDrawingActiveRef.current) {
              oneFingerConsistencyRef.current++;
              if (oneFingerConsistencyRef.current > HOLD_FRAMES) {
                  onVoiceTrigger();
                  lastTriggerTimeRef.current = Date.now();
                  oneFingerConsistencyRef.current = 0;
                  setFeedbackMessage("🎤 Listening...");
                  setTimeout(() => setFeedbackMessage(null), 2000);
              }
          } else {
              oneFingerConsistencyRef.current = 0;
          }

          // GENERATE (2 Fingers)
          if (PEACE_SIGN_POSE && !isDrawingActiveRef.current) {
              peaceSignConsistencyRef.current++;
              if (peaceSignConsistencyRef.current > HOLD_FRAMES) {
                  onGenerateTrigger();
                  lastTriggerTimeRef.current = Date.now();
                  peaceSignConsistencyRef.current = 0;
                  setFeedbackMessage("✨ Transforming...");
                  setTimeout(() => setFeedbackMessage(null), 2000);
              }
          } else {
              peaceSignConsistencyRef.current = 0;
          }

          // SAVE (3 Fingers)
          if (THREE_FINGER_POSE && !isDrawingActiveRef.current) {
              threeFingerConsistencyRef.current++;
              if (threeFingerConsistencyRef.current > HOLD_FRAMES) {
                  onSaveTrigger();
                  lastTriggerTimeRef.current = Date.now();
                  threeFingerConsistencyRef.current = 0;
                  setFeedbackMessage("💾 Saving to Gallery...");
                  setTimeout(() => setFeedbackMessage(null), 2000);
              }
          } else {
              threeFingerConsistencyRef.current = 0;
          }

          // STOP DRAWING (Thumbs Up)
          if (THUMBS_UP_POSE) {
              thumbsUpConsistencyRef.current++;
              // Faster trigger for stop (less hold time needed)
              if (thumbsUpConsistencyRef.current > 5) {
                  if (isDrawingActiveRef.current) {
                      isDrawingActiveRef.current = false;
                      setFeedbackMessage("👍 Thumbs Up: Stopped");
                      setTimeout(() => setFeedbackMessage(null), 1000);
                  }
                  thumbsUpConsistencyRef.current = 0;
              }
          } else {
              thumbsUpConsistencyRef.current = 0;
          }
      }
      // ---------------------------------------------------------


      if (!isDrawingEnabled) {
        isDrawingActiveRef.current = false;
        pinchConsistencyRef.current = 0;
      }

      // Determine Visual State for Legend
      const isDrawing = isDrawingActiveRef.current;
      if (Date.now() - lastSwipeTimeRef.current < 500) {
          setGestureState('clearing');
      } else if (threeFingerConsistencyRef.current > 10) {
          setGestureState('saving');
      } else if (peaceSignConsistencyRef.current > 10) {
          setGestureState('generating');
      } else if (oneFingerConsistencyRef.current > 10) {
          setGestureState('voice');
      } else if (thumbsUpConsistencyRef.current > 3 || (THUMBS_UP_POSE && !isDrawing)) {
          setGestureState('thumbsUp');
      } else {
          setGestureState(isDrawing ? 'drawing' : 'hover');
      }

      // 3. DRAWING Logic
      if (isDrawing) {
        if (!lastPointRef.current) {
            lastPointRef.current = currentPoint;
        } else {
             drawLine(lastPointRef.current, currentPoint, drawingCtx);
             lastPointRef.current = currentPoint;
        }
      } else {
        // Just stopped drawing
        if (lastPointRef.current) {
           // Use Composite Helper to save white-background version for AI, but keep transparent for UI
           const compositeUrl = getCompositeDataUrl(drawingCanvas);
           onCanvasUpdate(compositeUrl);
           lastPointRef.current = null;
        }
      }

      // 4. OVERLAY Logic (Transient Cursor)
      if (!isResultVisible) { 
          overlayCtx.beginPath();
          const radius = isDrawing ? (strokeWidth / 2) + 2 : 10; 
          overlayCtx.arc(x, y, radius, 0, 2 * Math.PI);
          
          if (isDrawing) {
             overlayCtx.fillStyle = strokeColor;
             overlayCtx.strokeStyle = '#ffffff';
             overlayCtx.lineWidth = 2;
          } else {
             overlayCtx.fillStyle = 'rgba(0, 150, 255, 0.4)'; 
             overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
             overlayCtx.lineWidth = 2;
          }
          overlayCtx.fill();
          overlayCtx.stroke();
      }

      // Visualization for Trigger Holds
      const drawLoadingRing = (cx: number, cy: number, progress: number, color: string) => {
          overlayCtx.beginPath();
          overlayCtx.arc(cx, cy, 30, 0, 2 * Math.PI * progress);
          overlayCtx.strokeStyle = color;
          overlayCtx.lineWidth = 6;
          overlayCtx.lineCap = 'round';
          overlayCtx.stroke();
      };

      if (oneFingerConsistencyRef.current > 5) {
          drawLoadingRing(x, y, oneFingerConsistencyRef.current / 30, 'red');
      }
      if (peaceSignConsistencyRef.current > 5) {
          drawLoadingRing(x, y, peaceSignConsistencyRef.current / 30, 'purple');
      }
      if (threeFingerConsistencyRef.current > 5) {
          drawLoadingRing(x, y, threeFingerConsistencyRef.current / 30, '#10B981'); 
      }
      if (thumbsUpConsistencyRef.current > 2) {
          drawLoadingRing(x, y, thumbsUpConsistencyRef.current / 5, '#2563EB'); // Blue
      }

      // Helper line to show pinch proximity
      if (!isDrawing && canDraw && pinchDistance < STOP_THRESHOLD * 2 && oneFingerConsistencyRef.current < 5 && peaceSignConsistencyRef.current < 5 && threeFingerConsistencyRef.current < 5 && thumbsUpConsistencyRef.current < 2) {
          const tx = thumbTip.x * drawingCanvas.width;
          const ty = thumbTip.y * drawingCanvas.height;
          
          overlayCtx.beginPath();
          overlayCtx.moveTo(x, y);
          overlayCtx.lineTo(tx, ty);
          
          if (pinchConsistencyRef.current > 0) {
             overlayCtx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange = "Hold it..."
             overlayCtx.lineWidth = 3;
          } else {
             overlayCtx.strokeStyle = pinchDistance < START_THRESHOLD * 1.5 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.1)';
             overlayCtx.lineWidth = 2;
          }
          overlayCtx.stroke();
      }

    } else {
        setGestureState('none');
        isDrawingActiveRef.current = false;
        lastPointRef.current = null;
        smoothedPointRef.current = null; // Reset smoothing
        pinchConsistencyRef.current = 0;
        lastWristXRef.current = null;
        oneFingerConsistencyRef.current = 0;
        peaceSignConsistencyRef.current = 0;
        threeFingerConsistencyRef.current = 0;
        thumbsUpConsistencyRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [cameraAllowed, handLandmarker, strokeColor, strokeWidth, onCanvasUpdate, isDrawingEnabled, onVoiceTrigger, onGenerateTrigger, onSaveTrigger, isResultVisible, isWarmup]);

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
      {/* 1. Video Layer (Mirrored) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraAllowed ? 'opacity-50' : 'opacity-0'}`}
      />
      
      {/* 2. Drawing Layer (Persists Ink) - Hidden if result is visible */}
      <canvas
        ref={drawingCanvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${cameraAllowed && !isResultVisible ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* 3. Overlay Layer (Cursor/UI) - Always visible for gestures */}
      <canvas
        ref={overlayCanvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-10 ${cameraAllowed ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 text-white px-6 py-4 rounded-xl text-xl font-bold animate-bounce shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-sm">
            {feedbackMessage.includes('Cleared') && <Trash2 className="w-8 h-8 text-white" />}
            {feedbackMessage.includes('Listening') && <Mic className="w-8 h-8 text-red-400" />}
            {feedbackMessage.includes('Transforming') && <Sparkles className="w-8 h-8 text-purple-400" />}
            {feedbackMessage.includes('Saving') && <Save className="w-8 h-8 text-emerald-400" />}
            {feedbackMessage.includes('Stopped') && <ThumbsUp className="w-8 h-8 text-blue-400" />}
            {feedbackMessage}
        </div>
      )}

      {/* Start / Loading Screen */}
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

      {/* Control Overlay - Hide if result is visible to reduce clutter */}
      {isCameraActive && !isResultVisible && (
        <>
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
              <div className="bg-white/90 border border-gray-400 text-[10px] px-2 py-1 shadow-sm text-black rounded-sm backdrop-blur-sm">
                 <p className="font-bold mb-1 border-b border-gray-300 pb-1">Gestures</p>
                 <div className={`flex items-center gap-2 mb-1 ${gestureState === 'drawing' ? 'text-green-700 font-bold' : 'text-gray-500'}`}>
                    <span>👌 Pinch (Hold): Draw</span>
                 </div>
                 <div className={`flex items-center gap-2 mb-1 ${gestureState === 'thumbsUp' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                    <span>👍 Thumbs Up: Stop</span>
                 </div>
                 <div className={`flex items-center gap-2 mb-1 ${gestureState === 'voice' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    <span>☝️ 1 Finger: Voice</span>
                 </div>
                 <div className={`flex items-center gap-2 mb-1 ${gestureState === 'generating' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
                    <span>✌️ 2 Fingers: Magic</span>
                 </div>
                 <div className={`flex items-center gap-2 mb-1 ${gestureState === 'saving' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}>
                    <span>🤟 3 Fingers: Save</span>
                 </div>
                 <div className={`flex items-center gap-2 ${gestureState === 'clearing' ? 'text-red-700 font-bold' : 'text-gray-500'}`}>
                    <span>👋 Swipe: Erase</span>
                 </div>
              </div>
          </div>

          <div className="absolute bottom-2 right-2 z-20 flex gap-2">
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