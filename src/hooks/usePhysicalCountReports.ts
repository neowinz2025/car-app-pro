import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';

export interface PhysicalCountReport {
  id: string;
  report_date: string;
  month_year: string;
  share_token: string;
  plates_data: PlateRecord[];
  total_plates: number;
  loja_count: number;
  lava_jato_count: number;
  both_count: number;
  neither_count: number;
  created_by: string;
  notes?: string;
  created_at: string;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export function usePhysicalCountReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveReport = useCallback(async (
    plates: PlateRecord[],
    createdBy: string = 'Sistema'
  ): Promise<{ success: boolean; shareToken?: string; reportId?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const loja = plates.filter(p => p.loja && !p.lavaJato);
      const lavaJato = plates.filter(p => p.lavaJato && !p.loja);
      const both = plates.filter(p => p.loja && p.lavaJato);
      const neither = plates.filter(p => !p.loja && !p.lavaJato);

      const shareToken = generateShareToken();
      const reportDate = new Date();
      const monthYear = format(reportDate, 'yyyy-MM');

      const { data, error: insertError } = await supabase
        .from('physical_count_reports')
        .insert({
          report_date: reportDate.toISOString(),
          month_year: monthYear,
          share_token: shareToken,
          plates_data: plates,
          total_plates: plates.length,
          loja_count: loja.length,
          lava_jato_count: lavaJato.length,
          both_count: both.length,
          neither_count: neither.length,
          created_by: createdBy,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error saving report:', insertError);
        setError(insertError.message);
        return { success: false };
      }

      setLoading(false);
      return {
        success: true,
        shareToken: data?.share_token,
        reportId: data?.id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar relatório';
      setError(errorMessage);
      setLoading(false);
      return { success: false };
    }
  }, []);

  const getReportByToken = useCallback(async (token: string): Promise<PhysicalCountReport | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('physical_count_reports')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching report:', fetchError);
        setError(fetchError.message);
        return null;
      }

      setLoading(false);
      return data as PhysicalCountReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar relatório';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  const getMonthlyReports = useCallback(async (monthYear: string): Promise<PhysicalCountReport[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('physical_count_reports')
        .select('*')
        .eq('month_year', monthYear)
        .order('report_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching monthly reports:', fetchError);
        setError(fetchError.message);
        return [];
      }

      setLoading(false);
      return data as PhysicalCountReport[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar relatórios';
      setError(errorMessage);
      setLoading(false);
      return [];
    }
  }, []);

  const getAllReports = useCallback(async (): Promise<PhysicalCountReport[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('physical_count_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching all reports:', fetchError);
        setError(fetchError.message);
        return [];
      }

      setLoading(false);
      return data as PhysicalCountReport[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar relatórios';
      setError(errorMessage);
      setLoading(false);
      return [];
    }
  }, []);

  const addNotes = useCallback(async (reportId: string, notes: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('physical_count_reports')
        .update({ notes })
        .eq('id', reportId);

      if (updateError) {
        console.error('Error updating notes:', updateError);
        setError(updateError.message);
        return false;
      }

      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar observações';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    saveReport,
    getReportByToken,
    getMonthlyReports,
    getAllReports,
    addNotes,
  };
}
