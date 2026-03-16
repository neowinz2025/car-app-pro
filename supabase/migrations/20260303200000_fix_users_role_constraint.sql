/*
  # Corrigir constraint de roles da tabela users

  1. Problema
    - A migration multi-loja (20260302010303) tentou adicionar uma nova constraint
      com roles em MAIÚSCULO (SUPER_ADMIN, ADMIN, OPERADOR)
    - O frontend e edge functions usam roles em minúsculo (admin, user)
    - Isso causa erro de INSERT (check_violation) ao cadastrar usuários

  2. Correção
    - Dropar a constraint conflitante
    - Normalizar registros existentes para minúsculo
    - Recriar constraint com valores corretos: admin, user
*/

-- Drop constraint(s) existente(s) com nome 'valid_role'
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role;

-- Normalizar registros existentes (caso algum tenha sido inserido com uppercase)
UPDATE users SET role = 'admin' WHERE role IN ('SUPER_ADMIN', 'ADMIN');
UPDATE users SET role = 'user' WHERE role IN ('OPERADOR', 'USER');

-- Recriar constraint com valores corretos (lowercase)
ALTER TABLE users ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'user'));
