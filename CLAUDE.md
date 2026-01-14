# CLAUDE.md — Contexto do Projeto KitFreela

## Visão Geral

KitFreela é uma plataforma de gestão profissional para freelancers, focada em:
- documentos comerciais
- organização básica
- controle financeiro simples
- follow-up

Não é um ERP, não é um CRM completo e não deve evoluir para algo complexo.
O foco é o **profissional solo**, com uso simples, direto e rápido.

O objetivo do KitFreela é eliminar:
- uso excessivo de planilhas
- múltiplas pastas no computador ou nuvem
- documentos despadronizados
- perda de clientes por falta de follow-up

---

## Problemas Reais que o KitFreela Resolve

- Criar propostas profissionais rapidamente
- Acompanhar status das propostas
- Gerar contratos a partir de propostas aceitas
- Manter histórico organizado
- Evitar perder clientes por falta de acompanhamento
- Padronizar assinatura, dados e layout
- Ter um perfil público simples
- Controle financeiro básico (manual)

---

## O que a Plataforma FAZ (Escopo Permitido)

### Núcleo (Core)
- Cadastro automático do freelancer ao criar conta
- Criação de propostas comerciais
- Preview da proposta antes de salvar ou gerar documento
- Armazenamento de documentos
- Alteração de status:
  - rascunho
  - enviada
  - aceita
  - encerrada
  - expirada
- Geração de contrato a partir de proposta aceita
- Assinatura padrão automática nos documentos
- Controle manual de contas a receber
- Histórico rastreável de documentos

### Organização
- Página “Meus Documentos” como centro do sistema
- Filtros por:
  - tipo de documento
  - status
  - cliente
  - data
- Edição posterior de propostas
- Controle financeiro básico (valores, recebíveis)


## Diretrizes de Design e UI

- Fundo claro (white / off-white)
- Design minimalista e limpo
- Poucas cores, bem controladas
- A cor principal da logo deve ser usada em:
  - botões primários
  - estados ativos
  - destaques sutis
- Evitar:
  - gradientes pesados
  - cores muito saturadas
  - excesso de sombras
- Tipografia simples, legível e moderna
- O sistema deve parecer leve, profissional e discreto


## Frontend

- Framework: React 18 com TypeScript
- Ferramenta de build: Vite (com compilação rápida via SWC)
- Roteamento: React Router v6
- Componentes de UI: shadcn/ui (baseado em Radix UI)
- Estilização: Tailwind CSS (design limpo, claro e minimalista)

# Backend
- Backend as a Service: Supabase
- Banco de dados: PostgreSQL
- Autenticação: Supabase Auth
- Segurança: Row Level Security (RLS)

# Estado e Dados

- Gerenciamento de estado assíncrono: React Query (@tanstack/- react-query)
- Estado global simples: Context API
- Formulários: React Hook Form
- Validação de dados: Zod

---

## O que a Plataforma NÃO FAZ (Limites Claros)

⚠️ **Esses pontos NÃO devem ser implementados nem sugeridos**

- Não é CRM completo
- Não é sistema fiscal
- Não emite nota fiscal
- Não automatiza cobrança
- Não automatiza envio de mensagens
- Não integra pagamento (por enquanto)
- Não faz split de pagamento
- Não executa assinatura digital avançada

---

## Diretrizes Importantes para Implementação

- Priorizar simplicidade e clareza
- Evitar fluxos longos ou complexos
- Sempre reutilizar dados do freelancer (assinatura, dados pessoais)
- Tudo deve funcionar bem mesmo com poucos dados
- Controle financeiro é **manual**, apenas para organização
- O sistema deve parecer completo, mesmo sendo simples

---

## Observação Importante

Quando houver dúvida entre:
- adicionar mais funcionalidades
- manter simplicidade
- Usar MCP para supabase, github, vercel

**Sempre escolher a simplicidade**



