/*
  # Tabela de Relatórios de Bate Físico

  ## Descrição
  Armazena todos os relatórios de contagem física de placas gerados pelo sistema,
  permitindo histórico completo, compartilhamento via link único e geração de
  relatórios mensais consolidados.

  ## Novas Tabelas
  
  ### `physical_count_reports`
  Armazena cada relatório de bate físico gerado
  - `id` (uuid, PK) - Identificador único do relatório
  - `report_date` (timestamptz) - Data e hora de criação do relatório
  - `month_year` (text) - Período no formato 'YYYY-MM' para facilitar queries mensais
  - `share_token` (text, unique) - Token único para compartilhamento público
  - `plates_data` (jsonb) - Dados completos das placas em formato JSON
  - `total_plates` (integer) - Total de placas no relatório
  - `loja_count` (integer) - Quantidade de placas na loja
  - `lava_jato_count` (integer) - Quantidade de placas no lava-jato
  - `both_count` (integer) - Quantidade de placas em ambos
  - `neither_count` (integer) - Quantidade de placas sem categoria
  - `created_by` (text) - Nome do usuário que criou o relatório
  - `notes` (text) - Observações adicionais sobre o relatório
  - `created_at` (timestamptz) - Timestamp de criação
  
  ## Segurança
  - RLS habilitado na tabela
  - Política para leitura pública (qualquer pessoa pode ler via share_token)
  - Política para inserção pública (permite criar relatórios sem autenticação)
  - Política para atualização pública (permite adicionar notas)
  
  ## Índices
  - Índice em `share_token` para buscas rápidas por link
  - Índice em `month_year` para queries de relatórios mensais
  - Índice em `report_date` para ordenação cronológica
*/

-- Create the physical_count_reports table
CREATE TABLE IF NOT EXISTS public.physical_count_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  month_year TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  plates_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_plates INTEGER NOT NULL DEFAULT 0,
  loja_count INTEGER NOT NULL DEFAULT 0,
  lava_jato_count INTEGER NOT NULL DEFAULT 0,
  both_count INTEGER NOT NULL DEFAULT 0,
  neither_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT DEFAULT 'Sistema',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_physical_count_reports_share_token 
  ON public.physical_count_reports(share_token);

CREATE INDEX IF NOT EXISTS idx_physical_count_reports_month_year 
  ON public.physical_count_reports(month_year);

CREATE INDEX IF NOT EXISTS idx_physical_count_reports_report_date 
  ON public.physical_count_reports(report_date DESC);

-- Enable Row Level Security
ALTER TABLE public.physical_count_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reports (for public sharing)
CREATE POLICY "Allow public read access to reports"
  ON public.physical_count_reports
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert reports
CREATE POLICY "Allow public insert access to reports"
  ON public.physical_count_reports
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update reports (for adding notes)
CREATE POLICY "Allow public update access to reports"
  ON public.physical_count_reports
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.physical_count_reports;