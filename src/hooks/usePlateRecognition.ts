import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
