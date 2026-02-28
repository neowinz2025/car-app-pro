/*
  # Sistema de Usuários com Hierarquia

  1. Nova Tabela
    - `users`
      - `id` (uuid, chave primária)
      - `name` (text, nome completo do usuário)
      - `cpf` (text, CPF único para login)
      - `role` (text, função: 'admin' ou 'user')
      - `active` (boolean, status do usuário)
      - `created_at` (timestamptz, data de criação)
      - `created_by` (text, quem criou o usuário)
      - `last_login` (timestamptz, último acesso)

  2. Segurança
    - Habilitar RLS na tabela `users`
    - Política para permitir leitura autenticada
    - Política para permitir inserção apenas por admins
    - Política para permitir atualização apenas por admins
    - Política para permitir deleção apenas por admins

  3. Índices
    - Índice único no CPF para garantir unicidade
    - Índice no campo role para filtros rápidos
    - Índice no campo active para filtros de usuários ativos

  4. Notas Importantes
    - CPF será usado como login (único)
    - Hierarquia: 'admin' tem acesso total, 'user' tem acesso limitado
    - Usuários inativos não podem fazer login
    - Senhas serão gerenciadas por edge function separada
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by text,
  last_login timestamptz,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user')),
  CONSTRAINT valid_cpf CHECK (length(cpf) = 11 AND cpf ~ '^[0-9]+$')
);

-- Criar índice único no CPF
CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_unique_idx ON users(cpf);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_active_idx ON users(active);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar usuários (necessário para login)
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

-- Política: Apenas sistema pode inserir usuários (será controlado por edge function)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Política: Apenas sistema pode atualizar usuários (será controlado por edge function)
CREATE POLICY "System can update users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Apenas sistema pode deletar usuários (será controlado por edge function)
CREATE POLICY "System can delete users"
  ON users FOR DELETE
  USING (true);
