# Arquitetura do SQLQuest

## Visão Geral

SQLQuest é uma plataforma gamificada de aprendizado SQL construída com Next.js 14 (App Router), Prisma e PostgreSQL (Neon). O projeto usa uma arquitetura baseada em **features por domínio**, separando infraestrutura genérica (`lib/`) de regras de negócio (`features/`).

---

## Estrutura de Pastas

```
sqlquest/
├── app/                    # Rotas Next.js (apenas orquestração — sem regra de negócio)
│   ├── (app)/              # Páginas autenticadas
│   ├── (auth)/             # Páginas de autenticação
│   ├── admin/              # Painel administrativo
│   │   └── _components/    # Componentes exclusivos do admin (colocação Next.js)
│   └── api/                # API Routes (GET de dados; POSTs de terceiros via webhook)
├── components/             # Componentes globais reutilizáveis (UI, layout, shared)
├── content/                # Conteúdo estático do currículo (JSONs)
│   └── trilhas/
│       ├── core/           # Trilhas principais (fundamentos ao avançado)
│       └── advanced/       # Trilhas de conteúdo avançado / especialização
├── features/               # Domínios de negócio — cada pasta é autocontida
├── i18n/                   # Arquivos de tradução (pt.json, en.json, es.json)
├── lib/                    # Infraestrutura e adaptadores externos
├── prisma/                 # Schema do banco e migrações
├── public/                 # Assets estáticos
└── __tests__/              # Testes Jest por domínio
```

---

## `lib/` vs `features/` — Qual usar?

| Critério | `lib/` | `features/` |
|----------|--------|-------------|
| **O quê** | Infraestrutura e adaptadores | Regras de negócio e UI |
| **Exemplos** | `db.ts`, `auth.ts`, `stripe.ts`, `rate-limit.ts` | XP, conquistas, progresso, certificados |
| **Depende de** | Libs externas (Prisma, Stripe, NextAuth) | Pode importar `lib/`, nunca o contrário |
| **Testabilidade** | Mockado nos testes de feature | Testado diretamente |
| **Quem usa** | Features, API routes, Server Actions | Páginas, componentes, API routes |

**Regra prática:** Se o código pode ser reaproveitado em qualquer outro projeto Next.js sem saber o que é SQLQuest → `lib/`. Se ele conhece conceitos como "trilha", "estrelas" ou "conquista" → `features/`.

---

## Features — Domínios de Negócio

Cada feature segue esta estrutura interna:

```
features/<domínio>/
├── index.ts          # Barrel export — API pública da feature
├── actions/          # Server Actions ('use server') — ponto de entrada do servidor
├── components/       # Componentes React específicos do domínio
└── domain/           # Lógica pura (funções, tipos, constantes) — sem efeitos colaterais
```

### Domínios disponíveis

| Feature | Responsabilidade |
|---------|-----------------|
| `learning` | Progresso do aluno, etapas, salvamento de XP |
| `gamification` | XP, níveis, streaks, conquistas, prestígio |
| `sql-engine` | Motor SQLite (WASM) no cliente, validação de respostas |
| `certificates` | Geração de PDF e componentes de certificado |
| `ranking` | Cálculo de posição e conquistas de ranking |
| `trails` | Componentes de listagem e mapa de trilhas |
| `auth` | Validação de token HMAC, filtro de nicknames |
| `ads` | Anúncios de vídeo e banners Pro |

### Importando de uma feature

Prefira sempre o barrel (`index.ts`) em vez do caminho direto:

```typescript
// ✅ Correto — usa a API pública da feature
import { salvarProgressoAction } from '@/features/learning'
import { getLevel, XpBar } from '@/features/gamification'

// ⚠️ Evitar fora da feature — expõe detalhes internos
import { getLevel } from '@/features/gamification/domain/xp'
```

Arquivos dentro de `domain/` **não** re-exportados pelo `index.ts` são considerados **internos** à feature e não devem ser importados de fora.

---

## Fluxo de uma Funcionalidade

O fluxo padrão para qualquer operação que modifica estado:

```
Componente (Client)
    └── chama Server Action  →  features/<domínio>/actions/*.actions.ts
            ├── valida sessão (getServerSession)
            ├── valida input (Zod schema)
            ├── chama domain/  →  funções puras de negócio
            └── persiste via   →  lib/db.ts (Prisma)
                    └── retorna resultado tipado (discriminated union)
Componente (Client)
    └── lê result.success / result.jaFeito e atualiza UI
```

### Exemplo: salvar progresso de exercício

```
TelaExercicio (Client Component)
    └── salvarProgressoAction({ trilhaId, etapaId, token })
            ├── verificarToken(token)           ← features/auth/domain/validation-token.ts
            ├── calcularEstrelas(tentativas, dicasUsadas)  ← features/gamification/domain/xp.ts
            ├── computeNovoStreak(...)           ← features/gamification/domain/streak.ts
            ├── prisma.progresso.create(...)     ← lib/db.ts
            ├── aplicarPrestigioSeElegivelTx(tx) ← features/gamification/domain/apply-prestige.ts
            └── verificarConquistasRanking(...)  ← features/ranking/domain/ranking-conquistas.ts
```

---

## Onde Adicionar Novos Conteúdos

### Trilhas e etapas (JSONs)

Todo conteúdo do currículo fica em `content/trilhas/`:

- **Trilha nova** → `content/trilhas/core/<slug>.json`
- **Conteúdo avançado/especialização** → `content/trilhas/advanced/<slug>.json`
- **Template de estrutura** → copiar de `content/templates/`

O script `scripts/seed.ts` lê essa pasta e popula o banco. Após adicionar um JSON, rodar:

```bash
npx ts-node scripts/seed.ts
```

### Nova conquista

1. Adicionar a definição em `features/gamification/domain/conquistas-definitions.ts`
2. Adicionar as traduções em `i18n/pt.json`, `en.json`, `es.json` (chave = `id` da conquista)
3. Exportar pelo barrel em `features/gamification/index.ts` se necessário

### Nova trilha com conquista especial

1. Adicionar o slug em `TRILHA_CONQUISTA_SLUGS` e `TRILHA_CONQUISTAS` em `conquistas-definitions.ts`
2. Criar o JSON em `content/trilhas/core/<slug>.json`
3. Rodar o seed

---

## API Routes — O que ainda é Route Handler

A maioria das mutações migrou para Server Actions. As API Routes restantes servem a casos específicos:

| Motivo | Exemplos |
|--------|---------|
| **GET para cache offline (IDB)** | `/api/progresso`, `/api/trilhas`, `/api/etapa` |
| **Webhooks externos** | `/api/webhook` (Stripe), `/api/auth/[...nextauth]` |
| **Integrações de terceiros** | `/api/checkout`, `/api/validar-query` |
| **Endpoints PWA / health** | `/api/ping`, `/api/conteudo-version` |

**Regra:** Novas operações iniciadas pelo usuário → Server Action. Callbacks externos ou dados para cache offline → API Route.

---

## i18n

As traduções vivem em `i18n/` (pt, en, es). O sistema usa `next-intl`.

- Arquivos: `i18n/pt.json`, `i18n/en.json`, `i18n/es.json`
- Chaves de conquistas: o `id` da conquista é diretamente a chave i18n (ver `CONQUISTAS_I18N` em `conquistas-definitions.ts`)
- Locale do usuário: lido via cookie (`COOKIE_NAME` em `lib/locale.ts`) em Server Actions e API Routes

---

## Convenções de Código

- **Server Actions** → arquivo `*.actions.ts` com `'use server'` no topo; retornam discriminated union `{ success: true, ... } | { success: false, error: string }`
- **Domain** → funções puras sem efeitos colaterais; podem importar `lib/` mas não `app/`
- **Componentes** → named exports (não `export default`); Props tipadas com interface local
- **Testes** → `__tests__/features/<domínio>/` espelhando a estrutura de `features/`; Server Actions são testadas diretamente (sem `Request` object)
- **Admin** → componentes exclusivos do painel ficam em `app/admin/_components/` (colocação Next.js); não poluir `components/`
