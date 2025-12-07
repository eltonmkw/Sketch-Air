
import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Ref to store interim text (gray text) in case the engine stops without finalizing
  const interimTranscriptRef = useRef('');

  const startListening = () => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    // Always create a FRESH instance to avoid stale connection bugs
    const recog = new SpeechRecognitionConstructor();
    recog.continuous = false; // Stop after one sentence
    recog.interimResults = true; // Crucial for speed and fallback
    recog.lang = 'en-US';

    interimTranscriptRef.current = ''; // Reset buffer

    recog.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        } else {
          interimChunk += event.results[i][0].transcript;
        }
      }

      if (finalChunk) {
        // We got a solid final result
        onTranscript(finalChunk);
        interimTranscriptRef.current = ''; // Clear fallback buffer since we succeeded
        stopListening(); 
      } else {
        // We only have interim results so far, save them just in case we timeout
        interimTranscriptRef.current = interimChunk;
      }
    };

    recog.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore benign errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
         console.warn("Speech Error:", event.error);
      }
      // If actual error, we might want to stop UI spinning
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
      }
    };

    recog.onend = () => {
      // FALLBACK: If the browser stopped listening (e.g. silence timeout) 
      // but we had some text pending in the buffer that wasn't finalized, use it!
      if (interimTranscriptRef.current && isListening) {
         onTranscript(interimTranscriptRef.current);
      }
      
      setIsListening(false);
      recognitionRef.current = null;
      interimTranscriptRef.current = '';
    };

    try {
      recog.start();
      recognitionRef.current = recog;
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) { /* ignore */ }
    }
    // We do NOT set isListening(false) here immediately; we let onend handle it
    // to ensure the cleanup logic runs consistently.
  };

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Expose method to parent
  useImperativeHandle(ref, () => ({
    toggle,
    isListening
  }));

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null;

  return (
    <button
      onClick={toggle}
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