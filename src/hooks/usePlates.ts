import { useState, useCallback } from 'react';
import { PlateRecord, ActiveStep } from '@/types/plate';

const STORAGE_KEY = 'baty-car-plates';

function loadPlates(): PlateRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load plates:', e);
  }
  return [];
}

function savePlates(plates: PlateRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plates));
  } catch (e) {
    console.error('Failed to save plates:', e);
  }
}

export function usePlates() {
  const [plates, setPlates] = useState<PlateRecord[]>(loadPlates);
  const [activeStep, setActiveStep] = useState<ActiveStep>(null);

  const addPlate = useCallback((plateText: string) => {
    const normalizedPlate = plateText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (normalizedPlate.length < 7) return false;

    // Check if plate already exists to prevent duplicates
    const plateExists = plates.some(p => p.plate === normalizedPlate);
    if (plateExists) {
      console.log(`Placa ${normalizedPlate} já foi registrada`);
      return false;
    }

    const newPlate: PlateRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      plate: normalizedPlate,
      timestamp: new Date(),
      loja: activeStep === 'loja',
      lavaJato: activeStep === 'lavaJato',
    };

    setPlates(prev => {
      const updated = [newPlate, ...prev];
      savePlates(updated);
      return updated;
    });

    return true;
  }, [activeStep, plates]);

  const removePlate = useCallback((id: string) => {
    setPlates(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePlates(updated);
      return updated;
    });
  }, []);

  const updatePlate = useCallback((id: string, updates: Partial<PlateRecord>) => {
    setPlates(prev => {
      const updated = prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      savePlates(updated);
      return updated;
    });
  }, []);

  const clearPlates = useCallback(() => {
    setPlates([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fillStep = useCallback((step: 'loja' | 'lavaJato') => {
    setPlates(prev => {
      const updated = prev.map(p => ({
        ...p,
        [step]: true,
      }));
      savePlates(updated);
      return updated;
    });
  }, []);

  const stats = {
    total: plates.length,
    unique: new Set(plates.map(p => p.plate)).size,
    loja: plates.filter(p => p.loja).length,
    lavaJato: plates.filter(p => p.lavaJato).length,
  };

  return {
    plates,
    activeStep,
    setActiveStep,
    addPlate,
    removePlate,
    updatePlate,
    clearPlates,
    fillStep,
    stats,
  };
}
