
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

// --- Type Definitions for Web Speech API ---
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
// --- End Type Definitions ---

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export interface VoiceInputHandle {
  toggle: () => void;
  isListening: boolean;
}

const VoiceInput = forwardRef<VoiceInputHandle, VoiceInputProps>(({ onTranscript, isProcessing = false }, ref) => {
  const [isListening, setIsListening] = useState(false);
  
  // Use Refs to keep the instance stable across renders
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Keep the latest callback accessible without re-running effects
  const onTranscriptRef = useRef(onTranscript);
  
  // Track if we should keep listening (for auto-retry on network errors)
  const shouldBeListeningRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Function to start recognition with retry support
  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    
    try {
      recognition.start();
      setIsListening(true);
      console.log('[VoiceInput] Audio enabled - speech recognition started');
    } catch (e: any) {
      if (e.message?.includes('already started')) {
        setIsListening(true);
      } else {
        console.warn("[VoiceInput] Failed to start recognition:", e);
        setIsListening(false);
        shouldBeListeningRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // Initialize Speech Recognition ONLY ONCE
    if (recognitionRef.current) return;

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = false; // We want short commands/descriptions
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('[VoiceInput] Transcript received:', transcript);
        retryCountRef.current = 0; // Reset retry count on success
        shouldBeListeningRef.current = false; // Stop after getting result
        if (onTranscriptRef.current) {
            onTranscriptRef.current(transcript);
        }
        setIsListening(false);
      };

      recog.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log('[VoiceInput] Speech recognition error:', event.error);
        
        // Handle network errors with retry
        if (event.error === 'network') {
          if (shouldBeListeningRef.current && retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            console.log(`[VoiceInput] Network error - retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
            // Don't set isListening to false, let onend handle restart
            return;
          } else if (retryCountRef.current >= MAX_RETRIES) {
            console.error('[VoiceInput] Max retries reached. Please check your internet connection.');
            shouldBeListeningRef.current = false;
            retryCountRef.current = 0;
          }
        }
        
        // 'no-speech' is common (timeout). 'aborted' is manual stop.
        if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'network') {
          console.error('[VoiceInput] Speech recognition error:', event.error);
          shouldBeListeningRef.current = false;
        }
        
        if (!shouldBeListeningRef.current) {
          setIsListening(false);
        }
      };

      recog.onend = () => {
        console.log('[VoiceInput] Recognition session ended');
        
        // Auto-restart if we should still be listening (for network error retry)
        if (shouldBeListeningRef.current && retryCountRef.current <= MAX_RETRIES) {
          console.log('[VoiceInput] Auto-restarting recognition...');
          setTimeout(() => {
            if (shouldBeListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('[VoiceInput] Recognition restarted');
              } catch (e) {
                console.warn('[VoiceInput] Could not restart:', e);
                setIsListening(false);
                shouldBeListeningRef.current = false;
              }
            }
          }, 500); // Small delay before retry
        } else {
          console.log('[VoiceInput] Audio disabled - recognition fully stopped');
          setIsListening(false);
          shouldBeListeningRef.current = false;
          retryCountRef.current = 0;
        }
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    
    if (!recognition) {
        const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!supported) {
            alert("Speech recognition not supported in this browser.");
        }
        return;
    }

    if (isListening) {
      // Stop listening
      shouldBeListeningRef.current = false;
      retryCountRef.current = 0;
      try {
        recognition.stop();
        console.log('[VoiceInput] Audio disabled - speech recognition stopped by user');
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      // Start listening
      shouldBeListeningRef.current = true;
      retryCountRef.current = 0;
      startRecognition();
    }
  }, [isListening, startRecognition]);

  // Expose method to parent
  useImperativeHandle(ref, () => ({
    toggle: toggleListening,
    isListening: isListening
  }), [toggleListening, isListening]);

  if (typeof window === 'undefined' || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) return null;

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
        isListening 
          ? 'bg-red-500 animate-pulse text-white shadow-lg shadow-red-500/50' 
          : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Add voice instruction"
    >
      {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
    </button>
  );
});

export default VoiceInput;