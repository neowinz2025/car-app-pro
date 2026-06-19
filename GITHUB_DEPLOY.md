# Deploy Automático de Edge Functions via GitHub

Este documento explica como configurar o deploy automático das Edge Functions do Supabase via GitHub Actions.

## ✅ Configuração Completa

### 1. Variáveis de Ambiente no GitHub

Acesse: **Repository Settings → Secrets and variables → Actions**

Adicione as seguintes secrets:

```
SUPABASE_ACCESS_TOKEN = <seu-token-aqui>
SUPABASE_URL = https://gmttgnhhtueurxuwchob.supabase.co
```

### 2. Como Obter o Token

1. Vá para https://supabase.com/dashboard
2. Clique no seu projeto
3. Settings → Access Tokens
4. Generate new token (nome: GITHUB_DEPLOY)
5. Copie e cole no GitHub Secrets

### 3. Como Funciona

Quando você faz push de mudanças nas **Edge Functions**, o GitHub Actions:

1. ✅ Detecta mudanças em `supabase/functions/**`
2. ✅ Instala Supabase CLI
3. ✅ Faz deploy automático
4. ✅ Valida o deployment

### 4. Triggerar Deploy Manualmente

Se precisar fazer deploy sem fazer push:

1. GitHub → Actions
2. Workflow: "Deploy Edge Functions"
3. "Run workflow" → Select branch

### 5. Estrutura de Pastas

```
supabase/
├── functions/
│   ├── recognize-plate/
│   │   └── index.ts
│   ├── admin-login/
│   │   └── index.ts
│   └── ... (outras funções)
├── migrations/
│   └── ... (migrações SQL)
└── config.toml (opcional)
```

## 📊 Status do Deployment

Para ver logs do deployment:

1. GitHub → Actions
2. Selecione o workflow "Deploy Edge Functions"
3. Clique no último run
4. Veja os logs detalhados

## 🐛 Troubleshooting

### Erro: "Invalid access token"

- Verifique se o token está correto em GitHub Secrets
- Token pode ter expirado, gere um novo

### Erro: "Project not found"

- Verifique o `project_id` em `supabase.json`
- Deve ser: `gmttgnhhtueurxuwchob`

### Erro: "Function not found"

- Certifique-se que a pasta existe em `supabase/functions/`
- Nome da pasta deve estar em `supabase.json`

## 🔒 Boas Práticas de Segurança

⚠️ **NÃO FAÇA:**
- Não compartilhe o `SUPABASE_ACCESS_TOKEN`
- Não commite secrets no repositório
- Não use token em logs públicos

✅ **FAÇA:**
- Rotine tokens periodicamente
- Use GitHub Secrets para armazenar
- Revogue tokens antigos no Supabase

## 📝 Fluxo Recomendado

1. Desenvolva localmente e teste com Supabase local
2. Faça push para uma branch
3. Crie um Pull Request
4. Quando mesclar para `main`, o deploy ocorre automaticamente
5. Verifique em Actions que tudo passou

## 🚀 Próximos Passos

1. Configure os secrets no GitHub
2. Faça um push de teste para `main`
3. Vá em Actions e veja o deployment acontecendo
4. Verify que as functions foram deployadas em https://supabase.com/dashboard

---

**Criado em:** 2026-06-18
**Última atualização:** Deploy automático ativado
