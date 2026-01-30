# Guia de Acesso - Painel Administrativo

## Credenciais de Acesso

Um usuário admin foi criado com sucesso no sistema:

**Usuário:** `hugo200`
**Senha:** `Hug@9615`

---

## Como Acessar o Painel Admin

### 1. Acessar a Página de Login

Navegue para a rota de login administrativo:

```
/admin/login
```

Ou acesse diretamente no navegador:
```
http://localhost:5173/admin/login
```

### 2. Fazer Login

1. Digite o usuário: `hugo200`
2. Digite a senha: `Hug@9615`
3. Clique em "Entrar"

### 3. Acessar o Dashboard

Após o login bem-sucedido, você será redirecionado automaticamente para:

```
/admin/dashboard
```

---

## Funcionalidades do Painel Admin

O painel administrativo oferece:

- **Visualização de Todos os Registros** - Veja todas as placas escaneadas
- **Relatórios Físicos** - Geração e gerenciamento de relatórios de contagem física
- **Passagens de Turno** - Histórico completo de todas as passagens de turno
- **Exportação** - Exporte dados em diversos formatos
- **Estatísticas** - Dashboard com métricas do sistema

---

## Estrutura de Rotas

| Rota | Descrição | Requer Autenticação |
|------|-----------|---------------------|
| `/` | Aplicativo principal | Não |
| `/admin/login` | Página de login | Não |
| `/admin/dashboard` | Painel administrativo | Sim |
| `/relatorio/:token` | Visualização de relatório compartilhado | Não |

---

## Duração da Sessão

- **Tempo de expiração:** 24 horas
- **Armazenamento:** LocalStorage (cliente)
- **Token:** SHA-256 gerado no servidor

Após 24 horas, será necessário fazer login novamente.

---

## Segurança Implementada

✅ Senhas criptografadas com bcrypt (10 rounds)
✅ Autenticação server-side via Edge Functions
✅ Tokens SHA-256 únicos por sessão
✅ Row Level Security (RLS) no banco
✅ Validação de inputs no cliente e servidor
✅ Timeout automático de sessão

---

## Troubleshooting

### Problema: "Usuário ou senha incorretos"

**Possíveis causas:**
1. Credenciais digitadas incorretamente
2. Sessão do admin expirou
3. Problema de conexão com o banco de dados

**Solução:**
- Verifique se está usando exatamente: `hugo200` / `Hug@9615`
- A senha é case-sensitive (maiúsculas e minúsculas importam)
- Limpe o cache do navegador e tente novamente

---

### Problema: Página em branco após login

**Possíveis causas:**
1. JavaScript desabilitado
2. Erro no console do navegador
3. Problema com as variáveis de ambiente

**Solução:**
1. Abra o DevTools (F12) e verifique o Console
2. Verifique se o arquivo `.env` está configurado corretamente
3. Recarregue a página (Ctrl+R ou Cmd+R)

---

### Problema: "Não está aparecendo nada"

**Verificações:**

1. **Certifique-se de que o servidor está rodando**
   ```bash
   npm run dev
   ```

2. **Verifique a URL**
   - Aplicativo principal: `http://localhost:5173/`
   - Login admin: `http://localhost:5173/admin/login`

3. **Limpe o cache do navegador**
   - Chrome: Ctrl+Shift+Delete (ou Cmd+Shift+Delete no Mac)
   - Ou abra em modo anônimo/privado

4. **Verifique o console do navegador (F12)**
   - Procure por erros em vermelho
   - Verifique a aba "Network" para ver se as requisições estão falhando

5. **Reconstrua o projeto**
   ```bash
   npm run build
   npm run preview
   ```

---

## Criar Novos Admins

Para criar novos usuários administrativos, use a Edge Function `create-admin`:

```bash
curl -X POST https://gmttgnhhtueurxuwchob.supabase.co/functions/v1/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "username": "novo_usuario",
    "password": "SenhaForte123",
    "masterKey": "secure_master_key_change_this"
  }'
```

**Requisitos para senha:**
- Mínimo 8 caracteres
- Use combinação de letras, números e caracteres especiais

**Requisitos para username:**
- Entre 3 e 50 caracteres
- Deve ser único

---

## Suporte

Se você continuar tendo problemas:

1. Verifique se todas as variáveis de ambiente estão configuradas no arquivo `.env`
2. Confirme que o Supabase está configurado corretamente
3. Verifique os logs do servidor (terminal onde rodou `npm run dev`)
4. Consulte o arquivo `SECURITY_FIXES.md` para detalhes técnicos da implementação

---

## Credenciais Padrão

**⚠️ IMPORTANTE:** Altere a master key em produção!

A master key padrão é: `secure_master_key_change_this`

Configure uma nova em produção:
```bash
# No Supabase Dashboard > Settings > Edge Functions > Environment Variables
ADMIN_MASTER_KEY=sua_chave_super_secreta_aqui
```
