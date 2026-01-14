# KitFreela

Plataforma de gestão profissional para freelancers.

## Stack

- React 18 + TypeScript
- Vite (com SWC)
- Tailwind CSS
- shadcn/ui
- React Router v6
- React Query

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Estrutura de Pastas

```
src/
├── components/       # Componentes reutilizáveis
│   └── layout/      # Componentes de layout (Layout, Sidebar)
├── pages/           # Páginas da aplicação
├── lib/             # Utilitários e helpers
├── App.tsx          # Componente principal com rotas
├── main.tsx         # Ponto de entrada
└── index.css        # Estilos globais
```

## Rotas

- `/` - Dashboard
- `/documentos` - Meus Documentos
- `/propostas` - Propostas
- `/contratos` - Contratos
- `/clientes` - Clientes
- `/financeiro` - Financeiro
- `/perfil` - Meu Perfil
- `/configuracoes` - Configurações
