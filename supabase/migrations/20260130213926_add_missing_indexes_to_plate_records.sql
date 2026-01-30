/*
  # Adicionar Índices Faltantes para Otimização de Performance

  ## Descrição
  Adiciona índices críticos que estavam faltando na tabela plate_records,
  incluindo o índice na foreign key session_id para melhorar performance
  de queries que fazem JOIN com plate_sessions.

  ## Novos Índices
  1. `idx_plate_records_session_id` - Índice na foreign key session_id
     - Melhora performance de JOINs entre plate_records e plate_sessions
     - Resolve aviso de foreign key sem índice
  
  2. `idx_plate_records_plate` - Índice na coluna plate
     - Acelera buscas por placa específica
     - Útil para verificar duplicatas
  
  3. `idx_plate_records_session_date` - Índice na coluna session_date
     - Otimiza queries por data
     - Melhora performance de relatórios diários/mensais

  ## Notas Importantes
  - Todos os índices usam IF NOT EXISTS para evitar erros se já existirem
  - Os índices melhoram significativamente a performance de queries
  - O índice em session_id é crítico para evitar table scans em JOINs
*/

-- Create index on foreign key session_id (critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_plate_records_session_id 
  ON public.plate_records(session_id);

-- Create index on plate column (for plate lookups and duplicate checking)
CREATE INDEX IF NOT EXISTS idx_plate_records_plate 
  ON public.plate_records(plate);

-- Create index on session_date (for date-based queries)
CREATE INDEX IF NOT EXISTS idx_plate_records_session_date 
  ON public.plate_records(session_date DESC);
