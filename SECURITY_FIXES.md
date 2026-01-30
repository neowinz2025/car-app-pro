# Correções de Segurança Implementadas

Este documento detalha todas as vulnerabilidades corrigidas no sistema de autenticação administrativa.

## Vulnerabilidades Corrigidas

### 1. Senhas em Texto Plano ✅ CORRIGIDO

**Antes:**
- Senhas armazenadas sem criptografia no banco de dados
- Comparação direta de strings na autenticação

**Depois:**
- Senhas criptografadas com bcrypt (10 rounds)
- Comparação segura usando bcrypt.compare()
- Coluna renomeada de `password` para `password_hash`

---

### 2. Credenciais Hardcoded ✅ CORRIGIDO

**Antes:**
- Usuário e senha visíveis no código: `hugo200 / 96156643`
- Credenciais commitadas no repositório

**Depois:**
- Credenciais padrão removidas do banco
- Sistema de criação segura via Edge Function
- Nenhuma senha no código-fonte

---

### 3. Row Level Security Permissivo ✅ CORRIGIDO

**Antes:**
```sql
CREATE POLICY "Admins can read all admin data"
  ON admins FOR SELECT
  USING (true);  -- ⚠️ Acesso público!
```

**Depois:**
```sql
CREATE POLICY "Service role only can manage admins"
  ON admins FOR ALL
  USING (false);  -- ✅ Apenas service role via Edge Function
```

---

### 4. Autenticação Fraca ✅ CORRIGIDO

**Antes:**
- Autenticação apenas via localStorage
- Sem validação server-side
- Tokens manipuláveis pelo usuário

**Depois:**
- Autenticação via Edge Function segura
- Token SHA-256 gerado no servidor
- Validação de credenciais server-side
- Timeout de sessão (24h)

---

### 5. Falta de Validação ✅ CORRIGIDO

**Antes:**
- Parsing JSON sem try-catch
- Sem validação de entrada

**Depois:**
- Try-catch em todas as operações JSON
- Validação de comprimento de username (3-50 chars)
- Validação de comprimento de senha (6-100 chars para login, 8+ para criação)
- Sanitização de inputs

---

### 6. Logs Sensíveis ✅ CORRIGIDO

**Antes:**
```typescript
console.error('VITE_SUPABASE_URL:', SUPABASE_URL);
console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY);
```

**Depois:**
- Logs removidos em produção
- Apenas mensagem genérica de erro

---

## Arquitetura de Segurança Atual

### Edge Functions Implementadas

#### 1. `admin-login` (Autenticação)
- Valida credenciais com bcrypt
- Retorna token SHA-256 único
- Atualiza last_login timestamp
- CORS configurado corretamente

#### 2. `create-admin` (Criação de Admins)
- Requer master key para execução
- Hash de senha com bcrypt (10 rounds)
- Valida unicidade de username
- Valida força da senha

### Fluxo de Autenticação

```
1. Usuário envia username + password
   ↓
2. Edge Function valida credenciais
   ↓
3. Bcrypt compara hash armazenado
   ↓
4. Gera token SHA-256 único
   ↓
5. Retorna token + dados do admin
   ↓
6. Frontend armazena token no localStorage
   ↓
7. Token expira após 24 horas
```

### Banco de Dados

**Tabela `admins`:**
- `id` (UUID)
- `username` (TEXT, UNIQUE)
- `password_hash` (TEXT) - Bcrypt hash
- `created_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)

**RLS Policies:**
- Tabela bloqueada para acesso direto
- Apenas service role (Edge Functions) pode acessar

---

## Como Criar um Novo Admin

Para criar um novo usuário admin de forma segura:

```bash
# Usando curl (substitua os valores)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "username": "novo_admin",
    "password": "senha_forte_123",
    "masterKey": "secure_master_key_change_this"
  }'
```

**⚠️ IMPORTANTE:** A master key padrão é "secure_master_key_change_this". Em produção, configure a variável de ambiente `ADMIN_MASTER_KEY` com um valor seguro.

---

## Checklist de Segurança

✅ Senhas criptografadas com bcrypt
✅ RLS restritivo (service role only)
✅ Autenticação server-side
✅ Validação de inputs
✅ Tokens seguros (SHA-256)
✅ Timeout de sessão
✅ Logs seguros
✅ Sem credenciais hardcoded
✅ CORS configurado
✅ Tratamento de erros robusto

---

## Próximos Passos Recomendados

1. **Configurar Master Key em Produção**
   - Definir `ADMIN_MASTER_KEY` nas variáveis de ambiente
   - Usar valor criptograficamente seguro (32+ caracteres)

2. **Rate Limiting**
   - Implementar limite de tentativas de login
   - Bloqueio temporário após múltiplas falhas

3. **Auditoria**
   - Log de todas as tentativas de login
   - Tabela de auditoria para ações administrativas

4. **2FA (Opcional)**
   - Autenticação de dois fatores
   - TOTP ou SMS

5. **Refresh Tokens**
   - Implementar refresh tokens para sessões longas
   - Reduzir tempo de expiração do access token

---

## Testes de Segurança

Para validar as correções:

1. **Teste de Acesso Direto ao Banco:**
   ```sql
   SELECT * FROM admins;
   -- Deve retornar erro: "new row violates row-level security policy"
   ```

2. **Teste de Login com Senha Errada:**
   - Deve retornar 401 Unauthorized
   - Não deve revelar se username existe

3. **Teste de Manipulação de Token:**
   - Modificar token no localStorage
   - Deve falhar na próxima requisição autenticada

4. **Teste de Expiração de Sessão:**
   - Aguardar 24h ou modificar timestamp
   - Deve exigir novo login

---

## Contato

Para questões sobre segurança, reporte vulnerabilidades de forma responsável.
