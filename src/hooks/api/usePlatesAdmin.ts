import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlateRecord {
  id: string;
  plate: string;
  timestamp: string;
  loja: boolean;
  lava_jato: boolean;
  session_id: string | null;
}

export function usePlatesAdmin() {
  const queryClient = useQueryClient();

  const fetchPlates = async (): Promise<PlateRecord[]> => {
    const { data, error } = await (supabase as any)
      .from('plate_records')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) throw error;
    return (data as PlateRecord[]) || [];
  };

  const { data: plates, isLoading, isError, error } = useQuery({
    queryKey: ['admin_plates'],
    queryFn: fetchPlates,
  });

  const deletePlateMutation = useMutation({
    mutationFn: async (plateId: string) => {
      const { error } = await (supabase as any)
        .from('plate_records')
        .delete()
        .eq('id', plateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_plates'] });
    },
  });

  return {
    plates: plates || [],
    isLoading,
    isError,
    error,
    deletePlate: deletePlateMutation.mutateAsync,
    isDeleting: deletePlateMutation.isPending,
  };
}
