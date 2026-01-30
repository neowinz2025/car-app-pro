/*
  # Criar Tabelas de Registros de Placas e Sessões

  ## Descrição
  Cria as tabelas principais para armazenar registros de placas e sessões de coleta,
  permitindo rastreamento histórico e compartilhamento de dados.

  ## Novas Tabelas
  
  ### `plate_sessions`
  Armazena sessões de coleta de placas
  - `id` (uuid, PK) - Identificador único da sessão
  - `session_date` (date) - Data da sessão
  - `share_token` (text, unique) - Token único para compartilhamento
  - `total_plates` (integer) - Total de placas na sessão
  - `loja_count` (integer) - Quantidade de placas da loja
  - `lava_jato_count` (integer) - Quantidade de placas do lava-jato
  - `exported_at` (timestamptz) - Data de exportação
  - `created_at` (timestamptz) - Data de criação

  ### `plate_records`
  Armazena cada registro individual de placa
  - `id` (uuid, PK) - Identificador único do registro
  - `plate` (text) - Placa do veículo
  - `timestamp` (timestamptz) - Timestamp do registro
  - `loja` (boolean) - Se passou pela loja
  - `lava_jato` (boolean) - Se passou pelo lava-jato
  - `session_id` (uuid, FK) - Referência à sessão
  - `session_date` (date) - Data da sessão
  - `created_at` (timestamptz) - Data de criação
  
  ## Segurança
  - RLS habilitado em ambas tabelas
  - Políticas permitem acesso público para leitura e escrita
  
  ## Índices
  - Índice em `share_token` para buscas rápidas
  - Índice em `session_date` para queries por data
  - Índice em `plate` para buscas por placa
*/

-- Create plate_sessions table
CREATE TABLE IF NOT EXISTS public.plate_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  share_token TEXT UNIQUE NOT NULL,
  total_plates INTEGER DEFAULT 0,
  loja_count INTEGER DEFAULT 0,
  lava_jato_count INTEGER DEFAULT 0,
  exported_at TIMESTAMP WITH TIME ZONE
);

-- Create plate_records table
CREATE TABLE IF NOT EXISTS public.plate_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  loja BOOLEAN DEFAULT false,
  lava_jato BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id UUID REFERENCES public.plate_sessions(id),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plate_sessions_share_token 
  ON public.plate_sessions(share_token);

CREATE INDEX IF NOT EXISTS idx_plate_sessions_session_date 
  ON public.plate_sessions(session_date DESC);

CREATE INDEX IF NOT EXISTS idx_plate_records_plate 
  ON public.plate_records(plate);

CREATE INDEX IF NOT EXISTS idx_plate_records_session_id 
  ON public.plate_records(session_id);

CREATE INDEX IF NOT EXISTS idx_plate_records_session_date 
  ON public.plate_records(session_date DESC);

CREATE INDEX IF NOT EXISTS idx_plate_records_created_at 
  ON public.plate_records(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.plate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_records ENABLE ROW LEVEL SECURITY;

-- Policies for plate_sessions
CREATE POLICY "Allow public read access to sessions"
  ON public.plate_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to sessions"
  ON public.plate_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to sessions"
  ON public.plate_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policies for plate_records
CREATE POLICY "Allow public read access to records"
  ON public.plate_records
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to records"
  ON public.plate_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to records"
  ON public.plate_records
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.plate_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plate_records;
