/*
  # Tabela de Senhas de Usuários

  1. Nova Tabela
    - `user_passwords`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência para users)
      - `password_hash` (text, senha criptografada)
      - `created_at` (timestamptz, data de criação)
      - `updated_at` (timestamptz, data de atualização)

  2. Segurança
    - Habilitar RLS na tabela `user_passwords`
    - Política para impedir acesso direto (apenas via edge functions)
    - Foreign key para garantir integridade referencial

  3. Índices
    - Índice único no user_id para garantir um password por usuário
    - Índice para performance de buscas

  4. Notas Importantes
    - Senhas são armazenadas usando bcrypt
    - Acesso direto bloqueado por RLS
    - Apenas edge functions podem manipular senhas
*/

-- Criar tabela de senhas
CREATE TABLE IF NOT EXISTS user_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice único no user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_passwords_user_id_unique_idx ON user_passwords(user_id);

-- Habilitar RLS
ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;

-- Política: Ninguém tem acesso direto (apenas via edge functions com service role)
CREATE POLICY "No direct access to passwords"
  ON user_passwords FOR ALL
  USING (false)
  WITH CHECK (false);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_password_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS user_passwords_updated_at_trigger ON user_passwords;
CREATE TRIGGER user_passwords_updated_at_trigger
  BEFORE UPDATE ON user_passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_user_password_updated_at();
