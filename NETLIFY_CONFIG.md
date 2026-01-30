# Configuração do Netlify - Baty Car

## Problema Identificado

O app não está carregando porque as **variáveis de ambiente não estão configuradas no Netlify**.

## Como Resolver

Siga estes passos no painel do Netlify:

### 1. Acesse as Configurações do Site
- No painel do projeto `batycar`, clique em **"Site settings"** (no menu lateral esquerdo)

### 2. Configure as Variáveis de Ambiente
- Vá em **"Build & deploy"** > **"Environment"** (ou **"Environment variables"**)
- Clique em **"Edit variables"** ou **"Add a variable"**

### 3. Adicione estas 3 variáveis:

**Variável 1:**
```
Key: VITE_SUPABASE_URL
Value: https://gmttgnhhtueurxuwchob.supabase.co
```

**Variável 2:**
```
Key: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHRnbmhodHVldXJ4dXdjaG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTYxMzcsImV4cCI6MjA4NTI5MjEzN30.hZXkiI4VqxGTIiY99JJXFygCtqCcyGT9CdS_If6bt-s
```

**Variável 3:**
```
Key: PLATE_RECOGNIZER_API_KEY
Value: 4b0097b3303c2cd48d998a366d9fd356083d9af6
```

### 4. Faça um Novo Deploy
Após adicionar as variáveis:
- Vá em **"Deploys"** (no menu lateral)
- Clique em **"Trigger deploy"** > **"Deploy site"**

### 5. Aguarde o Build
- O deploy levará cerca de 1-2 minutos
- Quando o status ficar verde (Published), acesse https://batycar.netlify.app/

## Verificar se Funcionou

Após o deploy, abra o site e:
1. Pressione **F12** (ou clique com botão direito > Inspecionar)
2. Vá na aba **Console**
3. Se aparecer erro sobre "variáveis de ambiente do Supabase", as variáveis não foram configuradas corretamente
4. Se o app carregar normalmente (mostrar os botões Loja e Lava Jato), está funcionando!

## Caminho Alternativo no Netlify

Se não encontrar "Environment variables", tente:
1. **Site settings** > **Environment variables** (novo layout do Netlify)
2. Ou **Site settings** > **Build & deploy** > **Environment** (layout antigo)
