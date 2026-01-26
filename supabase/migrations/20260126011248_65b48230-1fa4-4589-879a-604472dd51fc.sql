-- Create table for shift handover (passagem de turno)
CREATE TABLE public.shift_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('manha', 'noite', 'madrugada')),
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  registered_by TEXT,
  
  -- Status da Frota
  di_disponivel INTEGER NOT NULL DEFAULT 0,
  lm_locacao_mensal INTEGER NOT NULL DEFAULT 0,
  le_locacao_diaria INTEGER NOT NULL DEFAULT 0,
  fs_fora_servico INTEGER NOT NULL DEFAULT 0,
  ne_oficina_externa INTEGER NOT NULL DEFAULT 0,
  fe_funilaria_externa INTEGER NOT NULL DEFAULT 0,
  tg_triagem_manutencao INTEGER NOT NULL DEFAULT 0,
  
  -- Outras Informações
  carros_abastecidos INTEGER NOT NULL DEFAULT 0,
  veiculos_lavados INTEGER NOT NULL DEFAULT 0,
  veiculos_sujos_gaveta INTEGER NOT NULL DEFAULT 0,
  qnt_cadeirinhas INTEGER NOT NULL DEFAULT 0,
  qnt_bebe_conforto INTEGER NOT NULL DEFAULT 0,
  qnt_assentos_elevacao INTEGER NOT NULL DEFAULT 0,
  
  -- Reservas
  reservas_atendidas INTEGER NOT NULL DEFAULT 0,
  reservas_pendentes INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (no auth required)
CREATE POLICY "Allow public read access"
ON public.shift_handovers
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON public.shift_handovers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON public.shift_handovers
FOR UPDATE
USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_handovers;