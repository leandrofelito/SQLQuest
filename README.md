# SQLQuest

Plataforma gamificada de ensino de SQL — micro-lições interativas com execução de queries no browser, sistema de XP/níveis/prestígio, ranking global, conquistas, certificados PDF e plano Pro via Stripe.

---

## Stack completa

### Framework e linguagem

| Tecnologia | Versão | Para que serve |
|---|---|---|
| **Next.js** | 14 (App Router) | Framework full-stack; rotas, SSR, Server Actions e API routes |
| **TypeScript** | 5.6 | Tipagem estática em todo o projeto |
| **React** | 18.3 | UI declarativa com hooks |

### Estilo e animações

| Tecnologia | Versão | Para que serve |
|---|---|---|
| **Tailwind CSS** | 3.4 | Utility-first CSS; toda a estilização da interface |
| **Framer Motion** | 11 | Animações de entrada, transição de telas e feedback visual |
| **clsx + tailwind-merge** | — | Composição condicional e segura de classes Tailwind |
| **Lucide React** | 1.7 | Biblioteca de ícones SVG |

### Banco de dados e ORM

| Tecnologia | Versão | Para que serve |
|---|---|---|
| **Prisma** | 5.22 | ORM tipado; schema, migrations e Prisma Client |
| **Neon PostgreSQL** | — | Banco serverless na nuvem (driver nativo do Prisma) |

### Autenticação

| Tecnologia | Versão | Para que serve |
|---|---|---|
| **NextAuth.js** | 4.24 | Sessões, JWT, provedores de autenticação |
| **@auth/prisma-adapter** | 2.7 | Adapter NextAuth ↔ Prisma para persistir sessões e contas |
| **bcryptjs** | 3.0 | Hash de senha para login com email/senha |
| **Zod** | 3.23 | Validação e parse de input nos formulários e rotas de auth |

### Pagamentos

| Tecnologia | Para que serve |
|---|---|
| **Stripe** (SDK v16) | Checkout, webhook de confirmação de pagamento, upgrade para Pro |

### Motor SQL (exercícios)

| Tecnologia | Para que serve |
|---|---|
| **sql.js** (1.12) | SQLite compilado em WebAssembly; executa as queries do usuário 100% no browser, sem round-trip ao servidor |

### Certificados e PDF

| Tecnologia | Para que serve |
|---|---|
| **pdf-lib** (1.17) | Geração server-side de certificados em PDF com layout personalizado |
| **html2pdf.js** (0.14) | Alternativa client-side para exportação em PDF |
| **sharp** (0.34) | Otimização de imagens no servidor |

### Emails

| Tecnologia | Para que serve |
|---|---|
| **Resend** (6.10) | Envio de e-mail transacional: verificação de conta e boas-vindas com template HTML responsivo |

### Internacionalização

| Tecnologia | Para que serve |
|---|---|
| **next-intl** (3.26) | i18n com suporte a PT-BR, English e Español (arquivos em `messages/`) |

### PWA e Mobile

| Tecnologia | Para que serve |
|---|---|
| **next-pwa** (5.6) | Service Worker e manifesto para instalação como Progressive Web App |
| **@capacitor/core + @capacitor/android** (8.3) | Build nativo Android via Capacitor |
| **@capacitor-community/admob** (8.0) | Anúncios AdMob no app Android nativo |
| **Flutter** | App mobile nativo (iOS e Android) com experiência otimizada para celular |

### Utilitários de desenvolvimento

| Tecnologia | Para que serve |
|---|---|
| **tsx** | Execução de scripts TypeScript (seed, checagem do banco) |
| **dotenv-cli** | Injeção de `.env.local` nos scripts `npm run db:*` |
| **Prisma Studio** | Interface visual de banco durante desenvolvimento |

---

## O que o app faz

### Aprendizado gamificado por trilhas

O conteúdo é organizado em **trilhas sequenciais**, cada uma com várias etapas. O progresso em cada trilha é **bloqueado sequencialmente**: uma etapa só libera após a anterior ser concluída.

As trilhas disponíveis (22 no total, do básico ao elite):

| # | Slug | Tema |
|---|---|---|
| 00 | `fundamentos` | Fundamentos do SQL |
| 01 | `select-basico` | SELECT — Lendo Dados |
| 02 | `filtragem` | WHERE e Filtragem |
| 03 | `orderby` | ORDER BY |
| 04 | `agregacoes` | Funções de Agregação |
| 05 | `groupby-having` | GROUP BY e HAVING |
| 06 | `joins` | JOINs — Unindo Tabelas |
| 07 | `chaves` | Chaves Primárias e Estrangeiras |
| 08 | `subqueries` | Subqueries |
| 09 | `ctes` | CTEs (WITH) |
| 10 | `window-functions` | Window Functions |
| 11 | `dml` | INSERT, UPDATE e DELETE |
| 12 | `views` | Views |
| 13 | `case-when` | CASE WHEN |
| 14 | `create-table` | CREATE TABLE |
| 15 | `alter-drop` | ALTER e DROP |
| 16 | `crud-completo` | CRUD Completo |
| 17 | `indices` | Índices — Performance SQL |
| 18 | `transacoes` | Transações |
| 19 | `constraints` | Constraints |
| 20 | `normalizacao` | Normalização |
| 21 | `elite-tuning-performance` | Desafios de Elite: Tuning e Performance |

### Tipos de etapa

| Tipo | O que aparece |
|---|---|
| `intro` | Tela de boas-vindas da trilha com emoji e título |
| `texto` | Blocos de teoria sequenciais com blocos ricos (`lê-se`) |
| `resumo` | Box colorido com bullet points para revisão |
| `exercicio` | Editor SQL interativo executado no browser (sql.js) com validação e feedback |
| `conclusao` | Tela final com XP ganho e botão de próxima etapa |

### Sistema de XP e Níveis

- Cada etapa do tipo `exercicio` vale **XP variável** conforme estrelas (3 = 100 XP, 2 = 60 XP, 1 = 30 XP).
- Bônus por acertar na **primeira tentativa** (+50 XP) e **sem usar dica** (+30 XP).
- **Fórmula de nível:** `XP_para_nivel(n) = 150 × (n−1) × n` (quadrática).
- **Nível máximo: 100** — ao atingi-lo, o usuário pode acionar o Prestígio.
- **Badges de tier** por faixa de nível:

| Faixa | Nome | Cor |
|---|---|---|
| 1–4 | Aprendiz | Cinza |
| 5–9 | Iniciante | Verde |
| 10–19 | Explorador | Azul |
| 20–29 | Analista | Ciano |
| 30–49 | Especialista | Roxo |
| 50–74 | Mestre | Laranja |
| 75–99 | Expert | Vermelho |
| 100 | Lendário | Dourado |

### Sistema de Prestígio

Ao atingir o **Nível 100**, o usuário pode acionar o Prestígio: o XP é zerado (voltando ao Nível 1) em troca de uma **Estrela de Prestígio** permanente no perfil. O `xpRanking` (usado no ranking global) **não zera**. Cap máximo de **250 estrelas de prestígio** (PRESTIGIO_CONQUISTAS_CAP).

Tiers de prestígio:
- 1–5 estrelas → Bronze
- 6–10 estrelas → Prata
- 11–15 estrelas → Ouro
- 16–20 estrelas → Rubi

### Sistema de Estrelas

Cada exercício é avaliado de 1 a 3 estrelas com base em tentativas e uso de dicas:
- **3 estrelas:** acertou na 1ª tentativa sem dica.
- **2 estrelas:** acertou com até 2 tentativas ou 1 dica.
- **1 estrela:** 3+ tentativas ou 2+ dicas.

### Streak Diário

O campo `streak` no banco é incrementado a cada dia consecutivo de atividade. Conquistas são desbloqueadas nos marcos de 3, 7, 14 e 30 dias.

### Conquistas (50+)

Divididas em categorias:

| Categoria | Exemplos |
|---|---|
| Retenção (fáceis) | Primeiro Passo, Primeiros Brotos, Estudioso de Segunda |
| Habilidade (médias) | Sem Ajuda, Mente Afiada, Certeiro, Detetive SQL |
| Desafio (difíceis) | Zero Erros, Maratonista, Mês Dedicado |
| Lendárias | Perfeccionista, Mestre Certificado, Data God |
| Nível | Marcos do Nível 5 ao Nível 100 |
| Prestígio | Primeiro Prestígio, Veterano do Prestígio |
| Platina | 3 estrelas em todos os exercícios de uma trilha |
| Elite | Concluir e platinar a trilha Elite |
| Ranking | Top 1, Top 10, Top 100, Top 1000 no leaderboard |

### Ranking Global

Leaderboard com todos os usuários ordenados por XP total. Ao entrar em uma faixa (Top 1/10/100/1000), uma conquista de ranking é registrada com a posição exata e data.

### Autenticação Dupla

- **Google OAuth:** login com um clique via conta Google.
- **Email/Senha:** cadastro com nome, sobrenome, nickname único, email verificado e senha com indicador de força em tempo real (5 critérios: comprimento, maiúscula, minúscula, número, caractere especial).
- Após o cadastro com email, um **link de verificação** é enviado via Resend (válido por 24h).
- Usuários que fizeram login pelo Google podem escolher um nickname na tela `/escolher-nickname`.

### Plano Pro (Stripe)

- **Pagamento único** R$19,90 — acesso vitalício.
- Remove anúncios do app.
- Libera a galeria de certificados PDF.
- Webhook Stripe (`/api/webhook`) atualiza o campo `isPro` no banco ao confirmar o pagamento.

### Certificados PDF

- Gerados server-side com **pdf-lib** ao concluir uma trilha (exclusivo Pro).
- Cada certificado tem um **hash único** (CUID) para validação pública.
- Rota `/cert/[hash]` exibe os dados do certificado (usuário, trilha, data) sem exigir login.

### Anúncios

- **Web:** Google AdSense via componente `AdBanner` (configurável por `NEXT_PUBLIC_ADSENSE_ID`).
- **Android:** AdMob via `@capacitor-community/admob` no app nativo.
- Anúncios exibidos entre etapas (campo `temAnuncio` na etapa) — removidos automaticamente para usuários Pro.

### Internacionalização

Arquivos de tradução em `messages/` para:
- `pt.json` — Português (padrão)
- `en.json` — Inglês
- `es.json` — Espanhol

### Painel Admin

Acessível via `/admin` somente para emails listados em `ADMIN_EMAILS`.

- Cards com total de usuários, usuários Pro, receita total e data da última venda.
- Tabela dos últimos 10 pagamentos com status.
- Botão **Sincronizar banco com JSONs**: lê todos os arquivos em `content/trilhas/*.json` e faz upsert de trilhas e etapas no banco sem apagar progresso dos usuários.
- Gerenciamento de questões em `/admin/questoes`.

### Performance e cache instantâneo

O app usa um sistema de cache em memória (module-level) com stale-while-revalidate:

- **AppDataContext** cacheia: trilhas, progresso, ranking, conquistas, prestige e certificados.
- **SessionGuard** pré-carrega todos os dados em background logo após a autenticação — quando o usuário navega, os dados já estão prontos.
- **NavBottom** dispara os fetches relevantes no `onTouchStart`/`onMouseEnter` de cada aba, aproveitando os ~150ms antes da navegação completar.
- Páginas como Perfil e Certificados exibem dados **instantaneamente** na segunda visita (sem skeleton).

---

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page |
| `/login` | Login com Google ou email/senha |
| `/register` | Cadastro com email/senha |
| `/escolher-nickname` | Escolha de nickname pós-login Google |
| `/home` | Mapa de trilhas com progresso |
| `/trilha/[slug]` | Índice da trilha com etapas |
| `/trilha/[slug]/etapa/[id]` | Micro-lição (intro/texto/resumo/exercício/conclusão) |
| `/certificados` | Galeria de certificados (Pro) |
| `/ranking` | Leaderboard global |
| `/perfil` | Perfil do usuário (XP, streak, conquistas, prestígio) |
| `/upgrade` | Página de upgrade para Pro |
| `/cert/[hash]` | Validação pública de certificado |
| `/admin` | Dashboard administrativo |
| `/admin/pagamentos` | Histórico de pagamentos |
| `/admin/questoes` | Gerenciamento de questões |
| `/manutencao` | Página de manutenção |

---

## Variáveis de ambiente

Crie (ou edite) `.env.local` na raiz:

```env
# Neon — runtime: string com POOLER (*.pooler.neon.tech) + ?sslmode=require (recomendado no plano gratuito)
DATABASE_URL=""
# Conexão direta ao Postgres (sem pooler) — usada por `prisma migrate` / `db push`
DIRECT_URL=""
# Incremente ao atualizar trilhas/etapas no banco (invalida cache offline dos clientes)
CONTENT_VERSION="1"

# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Console › APIs & Services › Credentials › OAuth 2.0 Client IDs
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe Dashboard › Developers › API Keys
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Resend (resend.com) — envio de emails transacionais
RESEND_API_KEY=""
EMAIL_FROM="SQLQuest <noreply@sqlquest.com.br>"

# Google AdSense (opcional em desenvolvimento)
NEXT_PUBLIC_ADSENSE_ID=""
NEXT_PUBLIC_ADSENSE_SLOT=""

# URL pública do app
NEXT_PUBLIC_URL="http://localhost:3000"

# Emails separados por vírgula com acesso ao /admin
ADMIN_EMAILS="seu@email.com"

# Chave HMAC para assinar tokens de validação de exercícios
TOKEN_SECRET=""
```

---

## Setup

### 1. Instale as dependências

```bash
npm install
```

### 2. Sincronize o banco e popule as trilhas

```bash
npm run db:push    # cria/atualiza as tabelas no Neon
npm run seed       # importa as 22 trilhas de conteúdo
```

### 3. Rode em desenvolvimento

```bash
npm run dev
```

Acesse **`http://localhost:3000`**

---

## Scripts disponíveis

```bash
npm run dev           # servidor de desenvolvimento (Next.js)
npm run build         # prisma generate + build de produção
npm run start         # servidor de produção
npm run db:push       # sincroniza schema Prisma com o banco
npm run db:generate   # gera o Prisma Client sem aplicar migrations
npm run db:studio     # abre o Prisma Studio (GUI do banco)
npm run db:check      # verifica integridade do seed no banco
npm run seed          # popula/atualiza as trilhas a partir dos JSONs em content/trilhas/
npm run setup         # db:generate + db:check (útil no CI)
npm run cap:add       # adiciona plataforma Android ao Capacitor
npm run cap:sync      # sincroniza build web para o projeto Android
npm run cap:open      # abre o projeto no Android Studio
```

---

## Webhook Stripe (desenvolvimento local)

```bash
npx stripe listen --forward-to localhost:3000/api/webhook
```

Copie o `whsec_...` gerado e cole em `STRIPE_WEBHOOK_SECRET` no `.env.local`.

---

## Adicionar trilhas

1. Crie um arquivo `content/trilhas/XX-nome-da-trilha.json` seguindo o padrão dos existentes.
2. Rode `npm run seed` — ou use o botão **Sincronizar banco com JSONs** no painel admin.

### Estrutura do JSON de trilha

```jsonc
{
  "slug": "nome-da-trilha",
  "titulo": "Título da Trilha",
  "descricao": "Descrição curta",
  "icone": "🔍",
  "ordem": 1,
  "xpTotal": 500,
  "etapas": [
    {
      "ordem": 1,
      "tipo": "intro",         // intro | texto | resumo | exercicio | conclusao
      "titulo": "Introdução",
      "conteudo": { ... },
      "xpReward": 0,
      "temAnuncio": false
    }
  ]
}
```

---

## Deploy (Vercel)

1. Conecte o repositório no [Vercel](https://vercel.com).
2. Cole todas as variáveis de ambiente no painel do projeto.
3. O deploy é automático a cada push na branch `main`.

Para o webhook do Stripe em produção, cadastre `https://seu-dominio.vercel.app/api/webhook` no [painel do Stripe](https://dashboard.stripe.com/webhooks).

---

## Modelos do banco (Prisma)

| Modelo | Descrição |
|---|---|
| `User` | Usuário com XP, streak, prestige, isPro, isAdmin, nickname |
| `Account` | Contas OAuth vinculadas ao usuário (NextAuth) |
| `Session` | Sessões ativas (NextAuth) |
| `VerificationToken` | Tokens de verificação de email |
| `Trilha` | Trilha de conteúdo (slug, ícone, ordem, xpTotal) |
| `Etapa` | Etapa de uma trilha (tipo, conteúdo JSON, xpReward) |
| `Progresso` | Registro de etapa concluída (estrelas, tentativas, usouDica) |
| `Pagamento` | Transação Stripe vinculada ao usuário |
| `Certificado` | Certificado emitido com hash único de validação |
| `ConquistaRanking` | Registro de posição alcançada no ranking (Top 1/10/100/1000) |
| `TrilhaDesbloqueada` | Trilhas desbloqueadas manualmente (conteúdo premium futuro) |
| `RateLimit` | Controle de rate limiting distribuído (INSERT … ON CONFLICT atômico) |
