import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShiftHandover, ShiftType, DEFAULT_SHIFT_VALUES } from '@/types/shift';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useShiftHandover() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ShiftHandover[]>([]);
  const [currentShift, setCurrentShift] = useState<ShiftHandover>({
    shift_type: 'manha',
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    ...DEFAULT_SHIFT_VALUES,
  });

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shift_handovers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error('Error fetching shift history:', err);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const updateField = useCallback(<K extends keyof ShiftHandover>(
    field: K,
    value: ShiftHandover[K]
  ) => {
    setCurrentShift(prev => ({ ...prev, [field]: value }));
  }, []);

  const incrementField = useCallback((field: keyof ShiftHandover) => {
    setCurrentShift(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? (prev[field] as number) + 1 : prev[field],
    }));
  }, []);

  const decrementField = useCallback((field: keyof ShiftHandover) => {
    setCurrentShift(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Math.max(0, (prev[field] as number) - 1) : prev[field],
    }));
  }, []);

  const saveShift = useCallback(async (registeredBy?: string) => {
    setIsSaving(true);
    try {
      const payload = {
        ...currentShift,
        registered_by: registeredBy || null,
        registered_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('shift_handovers')
        .insert(payload);

      if (error) throw error;

      toast.success('Passagem de turno salva!');
      
      // Reset form
      setCurrentShift({
        shift_type: currentShift.shift_type,
        shift_date: format(new Date(), 'yyyy-MM-dd'),
        ...DEFAULT_SHIFT_VALUES,
      });
      
      // Refresh history
      await fetchHistory();
      
      return true;
    } catch (err: any) {
      console.error('Error saving shift:', err);
      toast.error('Erro ao salvar passagem de turno');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentShift, fetchHistory]);

  const setShiftType = useCallback((type: ShiftType) => {
    setCurrentShift(prev => ({ ...prev, shift_type: type }));
  }, []);

  return {
    currentShift,
    history,
    isLoading,
    isSaving,
    updateField,
    incrementField,
    decrementField,
    saveShift,
    setShiftType,
    fetchHistory,
  };
}
