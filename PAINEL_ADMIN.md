# 🛡️ Painel Administrativo

## Acesso ao Painel

Para acessar o painel administrativo, acesse a URL:

```
/admin/login
```

### Credenciais de Acesso

**Usuário:** hugo200
**Senha:** 96156643

## Funcionalidades

### 📊 Aba "Relatórios"

Nesta aba você pode:

- **Visualizar todos os relatórios** gerados no sistema
- **Ver detalhes** de cada relatório:
  - Data e hora de criação
  - Nome do responsável pela contagem
  - Total de placas
  - Quantidade em cada categoria (Loja, Lava Jato)
- **Abrir relatório online** clicando no botão de visualização (👁️)
- **Excluir relatórios** clicando no botão vermelho (🗑️)
  - Sistema solicita confirmação antes de excluir
  - Ação irreversível

### 🗂️ Aba "Placas"

Nesta aba você pode:

- **Visualizar todas as placas coletadas** no banco de dados
- **Ver informações detalhadas**:
  - Placa formatada (ABC-1234)
  - Data e hora da coleta
  - Status Loja (✅ ou —)
  - Status Lava Jato (✅ ou —)
  - ID da sessão
- Mostra as últimas **500 placas** coletadas
- Lista ordenada da mais recente para a mais antiga

## Segurança

- **Sessão expira em 24 horas** após o login
- Logout disponível no canto superior direito
- Páginas administrativas protegidas por autenticação
- Redirecionamento automático para login se não autenticado

## Navegação

- **Sair do painel**: Botão "Sair" no canto superior direito
- **Voltar ao app**: Link "Voltar para o App" na tela de login
- **Alternar entre abas**: Clique em "Relatórios" ou "Placas" no topo

## Observações Importantes

⚠️ **Exclusão de relatórios é permanente** - não há como recuperar após excluir

✅ **Dados sincronizados em tempo real** - as informações são carregadas diretamente do banco de dados Supabase

�� **Área administrativa segura** - apenas usuários autenticados têm acesso
