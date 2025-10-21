# Regras de Desenvolvimento e Stack Tecnológica (AI Guidelines)

Este documento descreve a stack tecnológica e as regras de codificação para manter a consistência e a qualidade do projeto Leccor Music.

## Stack Tecnológica

*   **Framework:** React com TypeScript.
*   **Build Tool:** Vite.
*   **Estilização:** Tailwind CSS para todos os estilos e responsividade.
*   **Componentes UI:** shadcn/ui (baseado em Radix UI) para componentes de interface.
*   **Roteamento:** React Router DOM.
*   **Gerenciamento de Estado de Servidor:** React Query (`@tanstack/react-query`).
*   **Backend & Banco de Dados:** Supabase (Autenticação, PostgreSQL e Edge Functions em Deno).
*   **Ícones:** Lucide React.
*   **Notificações:** Sonner (para toasts).

## Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Tecnologia | Regras de Uso |
| :--- | :--- | :--- |
| **UI/Componentes** | shadcn/ui & Radix UI | Utilize os componentes preexistentes em `src/components/ui/`. Se precisar de uma variação específica, crie um novo componente em `src/components/` que utilize os componentes base do shadcn/ui. |
| **Estilização** | Tailwind CSS | **Obrigatório** o uso de classes Tailwind para todo o design e layout. O design deve ser responsivo por padrão. |
| **Roteamento** | React Router DOM | Mantenha a definição de rotas centralizada em `src/App.tsx`. |
| **Autenticação/DB** | Supabase | Use o cliente Supabase (`@/integrations/supabase/client`) para todas as interações com o banco de dados e autenticação. |
| **Busca de Dados** | React Query | Use `useQuery` e `useMutation` do React Query para gerenciar o estado assíncrono e o cache de dados do Supabase. |
| **Estado Global** | React Context | Use Contextos (ex: `AuthContext`, `MusicPlayerContext`) para gerenciar estados globais de cliente. |
| **Notificações** | Sonner | Use a biblioteca `sonner` para exibir mensagens de sucesso, erro e carregamento. |
| **Estrutura de Arquivos** | Padrão | Componentes em `src/components/`, Páginas em `src/pages/`, Hooks em `src/hooks/`. |