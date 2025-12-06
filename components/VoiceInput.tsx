import React, { useState, useEffect } from 'react';
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

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recog.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
        // If recognition is not initialized, try to check support again or alert.
        const supported = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!supported) {
            alert("Speech recognition not supported in this browser.");
        }
        return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!recognition) return null;

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
};

export default VoiceInput;