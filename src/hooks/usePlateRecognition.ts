import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlateCache } from './usePlateCache';

// Create audio context for success beep sound
const playSuccessBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Two-tone success beep (high-low)
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);

    // Second tone
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 900;
      oscillator2.type = 'sine';

      gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.15);
    }, 150);
  } catch (e) {
    console.warn('Could not play beep sound:', e);
  }
};

// Vibrate device
const vibrate = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Pattern: vibrate-pause-vibrate
    }
  } catch (e) {
    console.warn('Could not vibrate device:', e);
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
  const [usedCache, setUsedCache] = useState(false);
  const lastProcessedPlateRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  const { hasPlate, addPlate: addToCache, getPlate } = usePlateCache();

  const recognizePlate = useCallback(async (imageBase64: string): Promise<RecognizedPlate[]> => {
    if (processingRef.current) {
      return [];
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setUsedCache(false);

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
        const upperPlate = bestPlate.plate.toUpperCase();

        // Check if plate is in cache - instant recognition
        const cachedPlate = getPlate(upperPlate);
        if (cachedPlate) {
          setUsedCache(true);
          console.log('Placa encontrada no cache local:', upperPlate);
        } else {
          // Add new plate to cache
          addToCache(upperPlate, bestPlate.region, bestPlate.confidence);
        }

        // Only trigger callback if it's a new plate
        if (upperPlate !== lastProcessedPlateRef.current) {
          lastProcessedPlateRef.current = upperPlate;
          setLastDetectedPlate(upperPlate);
          playSuccessBeep(); // Play enhanced sound on detection
          vibrate(); // Vibrate device
          onPlateDetected?.(upperPlate);
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
  }, [onPlateDetected, confidenceThreshold, hasPlate, getPlate, addToCache]);

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
    usedCache,
  };
}
