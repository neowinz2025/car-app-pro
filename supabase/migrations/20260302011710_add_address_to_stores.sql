/*
  # Adicionar campo de endereço às lojas

  1. Alterações
    - Adiciona coluna `address` à tabela `stores`
    - Campo opcional (text)
    - Permite que cada loja tenha um endereço registrado
  
  2. Notas
    - Campo utilizado no cabeçalho dos PDFs de avaria
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'address'
  ) THEN
    ALTER TABLE stores ADD COLUMN address text;
  END IF;
END $$;
