/*
  # Corrigir Política de Segurança RLS para DELETE

  ## Descrição
  Remove a política de DELETE insegura que permite acesso público não restrito
  à tabela physical_count_reports. Esta política usava USING (true), o que
  efetivamente bypassa a segurança de row-level security.

  ## Alterações de Segurança
  1. Remove política de DELETE pública e insegura
  2. Bloqueia completamente operações de DELETE via API pública
  3. DELETE só pode ser feito diretamente no banco por administradores com acesso ao Supabase

  ## Notas Importantes
  - A remoção desta política bloqueia DELETE para todos os usuários via API
  - Para deletar registros, é necessário acesso direto ao banco de dados
  - Isso está alinhado com as melhores práticas de segurança do Supabase
  - Outras operações (SELECT, INSERT, UPDATE) continuam funcionando normalmente
*/

-- Drop the insecure public delete policy
DROP POLICY IF EXISTS "Allow public delete access to reports" ON public.physical_count_reports;
