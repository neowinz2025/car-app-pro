/*
  # Adicionar Índice Faltante para plate_sessions

  ## Descrição
  Adiciona índice na coluna session_date da tabela plate_sessions
  para otimizar queries por data.

  ## Novo Índice
  - `idx_plate_sessions_session_date` - Índice na coluna session_date
    - Otimiza queries de busca por data
    - Melhora performance de relatórios por período
    - Ordenação descendente para retornar datas mais recentes primeiro

  ## Notas Importantes
  - Usa IF NOT EXISTS para evitar erros se já existir
  - O índice do share_token já existe via constraint UNIQUE
*/

-- Create index on session_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_plate_sessions_session_date 
  ON public.plate_sessions(session_date DESC);
