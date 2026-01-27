export interface ShiftHandover {
  id?: string;
  shift_type: string;
  shift_date: string;
  registered_at?: string;
  registered_by?: string | null;
  
  // Status da Frota
  di_disponivel: number;
  fs_fora_servico: number;
  ne_oficina_externa: number;
  fe_funilaria_externa: number;
  do_retorno_oficina: number;
  
  // Legacy fields (still in DB but not used in UI)
  lm_locacao_mensal?: number;
  le_locacao_diaria?: number;
  tg_triagem_manutencao?: number;
  
  // Outras Informações
  carros_abastecidos: number;
  veiculos_lavados: number;
  veiculos_sujos_gaveta: number;
  qnt_cadeirinhas: number;
  qnt_bebe_conforto: number;
  qnt_assentos_elevacao: number;
  
  // Reservas
  reservas_atendidas: number;
  reservas_pendentes: number;
  
  created_at?: string;
}

export type ShiftType = 'manha' | 'noite' | 'madrugada';

export const SHIFT_LABELS: Record<ShiftType, string> = {
  manha: 'Manhã',
  noite: 'Noite',
  madrugada: 'Madrugada',
};

export const DEFAULT_SHIFT_VALUES: Omit<ShiftHandover, 'id' | 'shift_type' | 'shift_date' | 'registered_at' | 'registered_by' | 'created_at' | 'lm_locacao_mensal' | 'le_locacao_diaria' | 'tg_triagem_manutencao'> = {
  di_disponivel: 0,
  fs_fora_servico: 0,
  ne_oficina_externa: 0,
  fe_funilaria_externa: 0,
  do_retorno_oficina: 0,
  carros_abastecidos: 0,
  veiculos_lavados: 0,
  veiculos_sujos_gaveta: 0,
  qnt_cadeirinhas: 0,
  qnt_bebe_conforto: 0,
  qnt_assentos_elevacao: 0,
  reservas_atendidas: 0,
  reservas_pendentes: 0,
};
