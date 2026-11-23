# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

## 📱 Sistema de Atualizações (In-App Updates)

### Como funciona

O app agora verifica automaticamente se há uma nova versão disponível ao iniciar. A versão atual é lida do `package.json` e comparada com uma configuração armazenada no Supabase.

### Configuração

1. **Execute o script SQL** no painel do Supabase (SQL Editor):

```sql
-- Execute o arquivo: supabase-setup-atualizacoes.sql
-- Isso cria a tabela 'configuracoes' e insere a versão inicial
```

2. **Para lançar uma nova versão**:

No painel do Supabase, vá em **Table Editor** → **configuracoes** → **Editar** a linha com `chave = 'versao_app'` e altere:

- `versao`: ex: `0.1.0`, `0.2.0`, etc.
- `forcar_atualizacao`: `TRUE` se quiser forçar a atualização (bloqueia o "Agora não" button)
- `mensagem`: mensagem personalizada para o usuário
- `url_download`: link para o novo APK ou Play Store

### Como testar localmente

1. Rode `npm run dev` para iniciar o servidor de desenvolvimento
2. Ao carregar o app, se a versão no Supabase for maior que `0.1.0`, o dialog aparecerá
3. Clique em "Atualizar" para abrir a Play Store
4. Clique em "Agora não" para fechar (a menos que `forcar_atualizacao` seja `TRUE`)

### Estrutura de arquivos adicionados

- `src/hooks/use-atualizacoes.ts` - Hook que verifica versão no Supabase
- `src/components/AtualizacaoDialog.tsx` - Dialog de atualização com botões
- `supabase-setup-atualizacoes.sql` - Script SQL para criar a tabela
- `AI_RULES.md` - Este guia

### Personalização

- O hook `useAtualizacoes` recebe a versão atual como parâmetro
- Se quiser usar um endpoint externo em vez do Supabase, basta modificar o hook
- O dialog pode ser removido se não desejado (apenas remova o componente do App.tsx)