import { useState, useCallback, useEffect } from 'react';
import { PlateRecord, ActiveStep } from '@/types/plate';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'baty-car-plates';

function loadPlates(): PlateRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const plates = parsed.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      }));

      // Check if plates are from a previous day - if so, clear them
      if (plates.length > 0) {
        const now = new Date();
        const oldestPlate = plates[plates.length - 1];
        const plateDate = new Date(oldestPlate.timestamp);

        // If the session is from a different day, clear it
        const isSameDay =
          plateDate.getDate() === now.getDate() &&
          plateDate.getMonth() === now.getMonth() &&
          plateDate.getFullYear() === now.getFullYear();

        if (!isSameDay) {
          console.log('Clearing old session from different day');
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
      }

      return plates;
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

  useEffect(() => {
    // Only load current session plates from localStorage on mount
    // Don't load from database to avoid confusion with historical data
    const currentPlates = loadPlates();
    setPlates(currentPlates);
  }, []);

  const addPlate = useCallback(async (plateText: string) => {
    const normalizedPlate = plateText.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (normalizedPlate.length < 7) return false;

    // Check if plate already exists in the CURRENT SESSION and CURRENT STEP
    const existsInCurrentStep = plates.some(p => {
      if (p.plate !== normalizedPlate) return false;
      if (activeStep === 'loja') return p.loja;
      if (activeStep === 'lavaJato') return p.lavaJato;
      return false;
    });

    if (existsInCurrentStep) {
      console.log(`Placa ${normalizedPlate} já foi registrada em ${activeStep} na sessão atual`);
      return false;
    }

    const timestamp = new Date();

    // Check if plate exists in current session but in different step - update it
    const existingPlate = plates.find(p => p.plate === normalizedPlate);

    if (existingPlate) {
      // Update existing plate in current session with new step
      const updates: Partial<PlateRecord> = {
        timestamp,
        ...(activeStep === 'loja' ? { loja: true } : {}),
        ...(activeStep === 'lavaJato' ? { lavaJato: true } : {}),
      };

      setPlates(prev => {
        const updated = prev.map(p =>
          p.plate === normalizedPlate ? { ...p, ...updates } : p
        );
        savePlates(updated);
        return updated;
      });
    } else {
      // Add new plate to current session
      const newPlate: PlateRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        plate: normalizedPlate,
        timestamp,
        loja: activeStep === 'loja',
        lavaJato: activeStep === 'lavaJato',
      };

      setPlates(prev => {
        const updated = [newPlate, ...prev];
        savePlates(updated);
        return updated;
      });
    }

    // Always save to database (allows same plate multiple times across different sessions)
    try {
      const { error } = await supabase
        .from('plate_records')
        .insert({
          plate: normalizedPlate,
          timestamp: timestamp.toISOString(),
          loja: activeStep === 'loja',
          lava_jato: activeStep === 'lavaJato',
          session_date: timestamp.toISOString().split('T')[0],
        });

      if (error) {
        console.error('Error saving plate to database:', error);
      }
    } catch (error) {
      console.error('Error saving plate to database:', error);
    }

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
