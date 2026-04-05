import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Report {
  id: string;
  created_at: string;
  created_by: string;
  share_token: string;
  total_plates: number;
  loja_count: number;
  lava_jato_count: number;
  both_count: number;
  neither_count: number;
  month_year: string;
  notes: string | null;
}

export function useReports() {
  const queryClient = useQueryClient();

  const fetchReports = async (): Promise<Report[]> => {
    const { data, error } = await supabase
      .from('physical_count_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: reports, isLoading, isError, error } = useQuery({
    queryKey: ['admin_reports'],
    queryFn: fetchReports,
  });

  const deleteReportMutation = useMutation({
    mutationFn: async ({ reportId, adminUsername }: { reportId: string, adminUsername: string }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/delete-report`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ reportId, adminUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete report' }));
        throw new Error(errorData.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
    },
  });

  return {
    reports: reports || [],
    isLoading,
    isError,
    error,
    deleteReport: deleteReportMutation.mutateAsync,
    isDeleting: deleteReportMutation.isPending,
  };
}
