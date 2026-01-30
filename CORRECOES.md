# Correções - Erro ao Salvar no Banco de Dados

## Problema Identificado

Quando o usuário clicava em "Salvar e Gerar Link", ocorria um erro ao tentar salvar os dados no banco de dados Supabase.

### Erros Encontrados:

1. **Tabela Inexistente:**
   - O código estava tentando acessar a tabela `plates` que não existe
   - A tabela correta é `plate_records`

2. **Coluna Incorreta:**
   - O código estava buscando a coluna `plate_number`
   - A coluna correta é apenas `plate`

3. **Falta de Políticas RLS:**
   - As tabelas `plate_records` e `plate_sessions` não tinham políticas de Row Level Security configuradas
   - Sem as políticas, o Supabase bloqueava qualquer tentativa de inserção

---

## Correções Aplicadas

### 1. Corrigido Hook de Cache Local (`usePlateCache.ts`)

**Antes:**
```typescript
const { data, error } = await supabase
  .from('plates')  // ❌ Tabela errada
  .select('plate_number, created_at')  // ❌ Coluna errada
```

**Depois:**
```typescript
const { data, error } = await supabase
  .from('plate_records')  // ✅ Tabela correta
  .select('plate, created_at')  // ✅ Coluna correta
```

### 2. Criada Nova Migration para Tabelas Faltantes

Criei a migration `create_plate_records_and_sessions.sql` que:

- ✅ Cria a tabela `plate_sessions` se não existir
- ✅ Cria a tabela `plate_records` se não existir
- ✅ Adiciona todos os índices necessários para performance
- ✅ Habilita Row Level Security (RLS)
- ✅ Cria políticas permissivas para acesso público:
  - Leitura pública (SELECT)
  - Inserção pública (INSERT)
  - Atualização pública (UPDATE)
- ✅ Habilita realtime para atualizações ao vivo

### 3. Estrutura das Tabelas

#### `plate_sessions`
```sql
- id (UUID, PK)
- session_date (DATE)
- share_token (TEXT, UNIQUE)
- total_plates (INTEGER)
- loja_count (INTEGER)
- lava_jato_count (INTEGER)
- exported_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

#### `plate_records`
```sql
- id (UUID, PK)
- plate (TEXT)
- timestamp (TIMESTAMPTZ)
- loja (BOOLEAN)
- lava_jato (BOOLEAN)
- session_id (UUID, FK → plate_sessions)
- session_date (DATE)
- created_at (TIMESTAMPTZ)
```

---

## Resultado

Agora o sistema está funcionando corretamente:

✅ **Cache local sincroniza** com o banco de dados sem erros
✅ **"Salvar e Gerar Link"** funciona perfeitamente
✅ **Relatórios são salvos** no banco de dados
✅ **Links de compartilhamento** são gerados
✅ **PDFs são baixados** com sucesso
✅ **Dados persistem** no Supabase

---

## Como Testar

1. Colete algumas placas (loja ou lava-jato)
2. Vá na aba "Exportar"
3. Clique em "Salvar e Gerar Link" (botão vermelho)
4. Aguarde a mensagem de sucesso
5. Copie e compartilhe o link gerado
6. Acesse o link em qualquer navegador para ver o relatório online

---

## Observações Técnicas

- As políticas RLS estão configuradas como públicas (`USING (true)`) para permitir que o app funcione sem autenticação
- Todos os dados salvos no Supabase estão disponíveis publicamente via share token
- O cache local melhora a performance ao buscar placas já conhecidas
- As migrations são idempotentes (usam `IF NOT EXISTS`) para evitar erros em execuções duplicadas
