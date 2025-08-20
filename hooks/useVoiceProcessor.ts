import { useState, useRef, useEffect, useCallback } from 'react';

// --- START: Web Speech API Type Declarations ---
// These types are not always included in default TS DOM libraries.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}
// --- END: Web Speech API Type Declarations ---

// Handle browser prefixes for SpeechRecognition
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useVoiceProcessor = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    setFrequencyData(new Uint8Array(0));
  }, []);

  const processAudio = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setFrequencyData(new Uint8Array(dataArrayRef.current));
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    setTranscript('');
    setFinalTranscript('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      processAudio();

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setFinalTranscript(prev => prev + final);
          setTranscript(finalTranscript + final + interim);
        };
        
        recognition.onend = () => {
            setIsListening(false);
            cleanup();
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } else {
        console.error("Speech Recognition not supported in this browser.");
        // Consider setting an error state here
      }
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Handle permission denied or other errors
    }
  }, [isListening, processAudio, cleanup, finalTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        cleanup();
        speechSynthesis.cancel();
    };
  }, [cleanup]);

  const speak = useCallback((text: string, onEnd: () => void) => {
    speechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.onend = onEnd;
    utterance.onerror = (e) => {
        console.error("SpeechSynthesis Error", e);
        onEnd(); // Ensure state machine continues
    }
    speechSynthesis.speak(utterance);
    return utterance;
  }, []);

  return { isListening, transcript, frequencyData, startListening, stopListening, speak, setTranscript };
};
