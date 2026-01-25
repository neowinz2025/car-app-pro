import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Create audio context for beep sound
const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000; // 1000Hz beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('Could not play beep sound:', e);
  }
};

interface RecognizedPlate {
  plate: string;
  confidence: number;
  region: string;
}

interface UsePlateRecognitionOptions {
  onPlateDetected?: (plate: string) => void;
  confidenceThreshold?: number;
  scanIntervalMs?: number;
}

export function usePlateRecognition(options: UsePlateRecognitionOptions = {}) {
  const { 
    onPlateDetected, 
    confidenceThreshold = 0.7,
    scanIntervalMs = 2000 
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetectedPlate, setLastDetectedPlate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedPlateRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  const recognizePlate = useCallback(async (imageBase64: string): Promise<RecognizedPlate[]> => {
    if (processingRef.current) {
      return [];
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('recognize-plate', {
        body: { image: imageBase64 },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        setError('Erro ao processar imagem');
        return [];
      }

      if (data.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return [];
      }

      const plates: RecognizedPlate[] = data.plates || [];
      
      // Filter by confidence threshold
      const validPlates = plates.filter(p => p.confidence >= confidenceThreshold);
      
      if (validPlates.length > 0) {
        const bestPlate = validPlates[0];
        
        // Only trigger callback if it's a new plate
        if (bestPlate.plate !== lastProcessedPlateRef.current) {
          lastProcessedPlateRef.current = bestPlate.plate;
          setLastDetectedPlate(bestPlate.plate);
          playBeep(); // Play sound on detection
          onPlateDetected?.(bestPlate.plate);
        }
      }

      return validPlates;
    } catch (err: any) {
      console.error('Recognition error:', err);
      setError(err.message || 'Erro de reconhecimento');
      return [];
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [onPlateDetected, confidenceThreshold]);

  const resetLastPlate = useCallback(() => {
    lastProcessedPlateRef.current = null;
    setLastDetectedPlate(null);
  }, []);

  return {
    recognizePlate,
    isProcessing,
    lastDetectedPlate,
    error,
    resetLastPlate,
  };
}
