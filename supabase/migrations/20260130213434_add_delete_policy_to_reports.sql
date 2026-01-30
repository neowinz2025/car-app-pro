/*
  # Adicionar Política de Exclusão para Relatórios

  ## Descrição
  Adiciona política de DELETE para permitir exclusão pública de relatórios.
  Esta política permite que qualquer pessoa possa excluir relatórios,
  incluindo administradores autenticados.

  ## Alterações de Segurança
  - Adiciona política de DELETE com acesso público

  ## Notas Importantes
  1. A política permite exclusão pública para manter consistência com outras operações
  2. Em produção, considere restringir DELETE apenas para usuários autenticados
*/

-- Policy: Allow public delete access to reports
CREATE POLICY "Allow public delete access to reports"
  ON public.physical_count_reports
  FOR DELETE
  USING (true);