import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShiftHandover {
  id: string;
  shift_type: string;
  shift_date: string;
  registered_at: string;
  registered_by: string | null;
  di_disponivel: number;
  lm_locacao_mensal: number;
  le_locacao_diaria: number;
  fs_fora_servico: number;
  ne_oficina_externa: number;
  fe_funilaria_externa: number;
  tg_triagem_manutencao: number;
  do_retorno_oficina: number;
  carros_abastecidos: number;
  veiculos_lavados: number;
  veiculos_sujos_gaveta: number;
  qnt_cadeirinhas: number;
  qnt_bebe_conforto: number;
  qnt_assentos_elevacao: number;
  reservas_atendidas: number;
  reservas_pendentes: number;
}

export function useShifts() {
  const fetchShifts = async (): Promise<ShiftHandover[]> => {
    const { data, error } = await supabase
      .from('shift_handovers')
      .select('*')
      .order('registered_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    // @ts-ignore
    return data || [];
  };

  const { data: shifts, isLoading, isError, error } = useQuery({
    queryKey: ['admin_shifts'],
    queryFn: fetchShifts,
  });

  return {
    shifts: shifts || [],
    isLoading,
    isError,
    error,
  };
}
