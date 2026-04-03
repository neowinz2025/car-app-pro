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

export function usePlates(storeId?: string) {
  const [plates, setPlates] = useState<PlateRecord[]>(loadPlates);
  const [activeStep, setActiveStep] = useState<ActiveStep>(null);

  useEffect(() => {
    // Only load current session plates from localStorage on mount
    // Don't load from database to avoid confusion with historical data
    const currentPlates = loadPlates();
    setPlates(currentPlates);
  }, []);

  const addPlate = useCallback(async (plateText: string): Promise<PlateRecord | null> => {
    const normalizedPlate = plateText.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (normalizedPlate.length < 7) return null;

    const timestamp = new Date();
    let newPlateObj: PlateRecord | null = null;
    let isDuplicate = false;

    // Use a temporary state check to determine if it's a duplicate or exists
    setPlates(prev => {
      // Check if plate already exists in the CURRENT SESSION and CURRENT STEP
      const existsInCurrentStep = prev.some(p => {
        if (p.plate !== normalizedPlate) return false;
        if (activeStep === 'loja') return p.loja;
        if (activeStep === 'lavaJato') return p.lavaJato;
        return false;
      });

      if (existsInCurrentStep) {
        console.log(`Placa ${normalizedPlate} já foi registrada em ${activeStep} na sessão atual`);
        isDuplicate = true;
        return prev;
      }

      // Check if plate exists in current session but in different step - update it
      const existingPlate = prev.find(p => p.plate === normalizedPlate);

      if (existingPlate) {
        // Update existing plate in current session with new step
        const updates: Partial<PlateRecord> = {
          timestamp,
          ...(activeStep === 'loja' ? { loja: true } : {}),
          ...(activeStep === 'lavaJato' ? { lavaJato: true } : {}),
        };
        const updated = prev.map(p =>
          p.plate === normalizedPlate ? { ...p, ...updates } : p
        );
        savePlates(updated);
        newPlateObj = { ...existingPlate, ...updates };
        return updated;
      } else {
        // Add new plate to current session
        newPlateObj = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          plate: normalizedPlate,
          timestamp,
          loja: activeStep === 'loja',
          lavaJato: activeStep === 'lavaJato',
        };
        const updated = [newPlateObj, ...prev];
        savePlates(updated);
        return updated;
      }
    });

    // If it was a duplicate, we return null after the setPlates call
    if (isDuplicate) return null;
    
    // We need to wait a tiny bit or just use the local newPlateObj
    // Since we are in a Promise, we can proceed with DB save
    if (newPlateObj) {
      const finalPlate = newPlateObj as PlateRecord;
      try {
        const { data, error } = await (supabase
          .from('plate_records' as any) as any)
          .insert({
            plate: normalizedPlate,
            timestamp: timestamp.toISOString(),
            loja: activeStep === 'loja',
            lava_jato: activeStep === 'lavaJato',
            session_date: timestamp.toISOString().split('T')[0],
            store_id: storeId,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error saving plate to database:', error);
        } else if (data) {
          // Update the plate with the DB ID in the next tick
          setPlates(prev => {
            const updated = prev.map(p => p.id === finalPlate.id ? { ...p, dbId: data.id } : p);
            savePlates(updated);
            return updated;
          });
          finalPlate.dbId = data.id;
        }
      } catch (error) {
        console.error('Error saving plate to database:', error);
      }
      return finalPlate;
    }

    return null;
  }, [activeStep, storeId]); // Removed 'plates' from dependency array!

  const removePlate = useCallback((id: string) => {
    setPlates(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePlates(updated);
      return updated;
    });
  }, []);

  const removePlateFromDB = useCallback(async (dbId: string) => {
    try {
      const { error } = await (supabase
        .from('plate_records' as any) as any)
        .delete()
        .eq('id', dbId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing plate from database:', error);
      return false;
    }
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
    removePlateFromDB,
    updatePlate,
    clearPlates,
    fillStep,
    stats,
  };
}
