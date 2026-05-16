# SQLQuest

Plataforma gamificada de ensino de SQL, com microlicoes interativas, execucao de queries no browser, XP, niveis, ranking global, conquistas, certificados PDF, plano Pro via Stripe, PWA e app mobile em Flutter.

O projeto hoje roda com **PostgreSQL local**, **Next.js local em producao** e publicacao externa por **Cloudflare Tunnel** no dominio `https://sqlquest.com.br`.

---

## Arquitetura atual

```text
Usuario web/app
  -> https://sqlquest.com.br
  -> Cloudflare Tunnel
  -> Next.js local em 127.0.0.1:3000
  -> PostgreSQL local
```

- O banco principal e um PostgreSQL instalado no computador/servidor local.
- O Next.js de producao escuta apenas em `127.0.0.1:3000`.
- O Cloudflare Tunnel publica o site com HTTPS sem expor diretamente a porta local.

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 App Router | Site, rotas autenticadas, API routes e server-side rendering |
| React 18 + TypeScript | Interface e tipagem |
| Tailwind CSS + Framer Motion | Estilo e animacoes |
| Prisma 5 | ORM, schema e Prisma Client |
| PostgreSQL local | Banco principal da aplicacao |
| NextAuth.js | Login com Google e email/senha |
| Stripe | Checkout, webhook e liberacao do plano Pro |
| Resend | Emails transacionais |
| sql.js | Execucao dos exercicios SQL no browser |
| pdf-lib | Geracao de certificados PDF |
| next-pwa | Service Worker e instalacao como PWA |
| Flutter | App mobile nativo Android/iOS |

---

## Funcionalidades principais

- Trilhas sequenciais de SQL, do basico ao avancado.
- Exercicios interativos executados no navegador com `sql.js`.
- Dicas progressivas por exercicio.
- XP, niveis, streak, prestigio, conquistas e ranking global.
- Login com Google OAuth e email/senha.
- Cadastro com verificacao de email.
- Plano Pro via Stripe, com remocao de anuncios e galeria de certificados.
- Certificados PDF com validacao publica por hash.
- Painel admin para acompanhar usuarios, pagamentos e sincronizar conteudo.
- Consentimento de privacidade/LGPD antes de carregar anuncios e servicos opcionais.
- Exportacao de dados do usuario em `/api/user/export`.
- Paginas publicas de privacidade, termos, roadmap e status.

---

## Rotas principais

| Rota | Descricao |
|---|---|
| `/` | Landing page |
| `/login` | Login com Google ou email/senha |
| `/register` | Cadastro |
| `/escolher-nickname` | Nickname apos login Google |
| `/home` | Mapa de trilhas |
| `/trilha/[slug]` | Pagina de uma trilha |
| `/trilha/[slug]/etapa/[id]` | Microlicao ou exercicio |
| `/certificados` | Certificados do usuario Pro |
| `/cert/[hash]` | Validacao publica de certificado |
| `/ranking` | Ranking global |
| `/perfil` | Perfil, privacidade, XP e conquistas |
| `/upgrade` | Pagina do plano Pro |
| `/admin` | Painel administrativo |
| `/admin/pagamentos` | Historico de pagamentos |
| `/admin/questoes` | Gerenciamento de questoes |
| `/blog` | Conteudo publico |
| `/roadmap` | Roadmap publico |
| `/status` | Status publico |
| `/privacidade` | Politica de privacidade |
| `/termos` | Termos de uso |
| `/manutencao` | Tela de manutencao |

---

## Variaveis de ambiente

Crie um arquivo `.env.local` na raiz. Nunca commite esse arquivo.

```env
# PostgreSQL local
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"
DIRECT_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"

# Incremente quando publicar novo conteudo de trilhas/etapas
CONTENT_VERSION="1"

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# URL publica do app
NEXT_PUBLIC_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Resend
RESEND_API_KEY=""
EMAIL_FROM="SQLQuest <noreply@sqlquest.com.br>"

# AdSense
NEXT_PUBLIC_ADSENSE_ID=""
NEXT_PUBLIC_ADSENSE_SLOT=""
NEXT_PUBLIC_ADSENSE_SLOT_BANNER_ESTRELAS=""
NEXT_PUBLIC_ADSENSE_SLOT_TRILHA_MODAL=""

# Admin
ADMIN_EMAILS="seu@email.com"

# Validacao de exercicios
TOKEN_SECRET=""

# Manutencao
MAINTENANCE_MODE=false
```

Em producao local, use:

```env
NEXTAUTH_URL="https://sqlquest.com.br"
NEXT_PUBLIC_URL="https://sqlquest.com.br"
```

No Google Cloud Console, mantenha estes redirects autorizados:

```text
https://sqlquest.com.br/api/auth/callback/google
https://www.sqlquest.com.br/api/auth/callback/google
```

---

## Setup local

1. Instale as dependencias:

```bash
npm install
```

2. Configure o `.env.local` com o PostgreSQL local.

3. Gere/sincronize o banco:

```bash
npm run db:generate
npm run db:push
npm run seed
```

4. Rode em desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Producao local

Build:

```bash
npm run build
```

Iniciar o servidor local de producao:

```powershell
Start-Process powershell.exe -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  (Join-Path (Get-Location) 'scripts\production-start.ps1')
) -WindowStyle Hidden
```

Parar:

```powershell
.\scripts\production-stop.ps1
```

Verificar saude:

```powershell
.\scripts\production-health.ps1
```

O servidor de producao deve responder em `http://127.0.0.1:3000`, e o acesso publico deve passar por `https://sqlquest.com.br`.

---

## Cloudflare Tunnel

Scripts auxiliares:

```powershell
.\scripts\cloudflare-tunnel-login.ps1
.\scripts\cloudflare-tunnel-create.ps1
.\scripts\cloudflare-tunnel-run.ps1
```

Configuracao esperada da rota publica:

```text
Hostname: sqlquest.com.br
Service: http://127.0.0.1:3000
```

Tambem pode existir uma rota para `www.sqlquest.com.br`, apontando para o mesmo servico.

Se o computador/servidor desligar, o site publico fica indisponivel ate que o PostgreSQL, o servidor Next.js e o Cloudflare Tunnel estejam ativos novamente.

---

## Banco de dados

Modelos principais no Prisma:

| Modelo | Descricao |
|---|---|
| `User` | Usuario, XP, streak, prestigio, Pro e admin |
| `Account` | Contas OAuth vinculadas |
| `Session` | Sessoes do NextAuth |
| `VerificationToken` | Tokens de verificacao de email |
| `Trilha` | Trilha de conteudo |
| `Etapa` | Etapa de uma trilha |
| `Progresso` | Progresso do usuario nas etapas |
| `Pagamento` | Pagamentos Stripe |
| `Certificado` | Certificados emitidos |
| `ConquistaRanking` | Conquistas de ranking |
| `TrilhaDesbloqueada` | Desbloqueios manuais/futuros |
| `RateLimit` | Rate limiting persistido |

Comandos uteis:

```bash
npm run db:push
npm run db:studio
npm run db:check
npm run seed
```

Backup local:

```powershell
.\scripts\backup-local-db.ps1
```

---

## Conteudo das trilhas

O conteudo fica em `content/trilhas/`.

Para adicionar ou alterar uma trilha:

1. Edite ou crie um JSON seguindo o padrao existente.
2. Rode:

```bash
npm run seed
```

3. Se o conteudo ja estiver em producao/PWA, incremente `CONTENT_VERSION` para invalidar cache offline dos clientes.

O painel admin tambem possui a acao **Sincronizar banco com JSONs**, que faz upsert das trilhas e etapas sem apagar progresso dos usuarios.

---

## Pagamentos Stripe

Webhook local:

```bash
npx stripe listen --forward-to localhost:3000/api/webhook
```

Webhook em producao:

```text
https://sqlquest.com.br/api/webhook
```

O webhook confirma o pagamento e atualiza o campo `isPro` do usuario.

---

## Privacidade e LGPD

- Ads e servicos opcionais dependem de consentimento.
- A politica de privacidade fica em `/privacidade`.
- Os termos ficam em `/termos`.
- O usuario pode exportar dados pela area de perfil ou endpoint `/api/user/export`.
- Dados sensiveis devem ficar somente em `.env.local` ou no ambiente de producao, nunca no Git.

---

## Scripts disponiveis

```bash
npm run dev           # servidor de desenvolvimento
npm run build         # prisma generate + build Next.js
npm run start         # servidor Next.js de producao
npm run db:push       # sincroniza schema Prisma
npm run db:generate   # gera Prisma Client
npm run db:studio     # abre Prisma Studio
npm run db:check      # verifica integridade do seed
npm run seed          # importa/atualiza trilhas do content/trilhas
npm run test          # testes Jest
npm run test:e2e      # testes Playwright
npm run cap:sync      # sincroniza build web com Android/Capacitor
npm run cap:open      # abre Android Studio
```

---

## Mobile

O app mobile atual usa Flutter. Para que o app funcione em producao, a base URL/API deve apontar para:

```text
https://sqlquest.com.br
```

Depois de alteracoes que afetam frontend, PWA, URLs publicas, autenticacao ou API, gere nova build do app mobile antes de publicar uma nova versao.

---

## Arquivos importantes

| Arquivo/pasta | Uso |
|---|---|
| `app/` | Rotas, paginas e API routes do Next.js |
| `components/` | Componentes reutilizaveis |
| `features/` | Regras de negocio por dominio |
| `lib/` | Infraestrutura, auth, banco, Stripe, helpers |
| `prisma/schema.prisma` | Modelagem do banco |
| `content/trilhas/` | Conteudo das trilhas |
| `i18n/` | Traducoes pt/en/es |
| `public/og-image.png` | Imagem social padrao |
| `scripts/production-start.ps1` | Inicio local em producao |
| `scripts/production-stop.ps1` | Parada local |
| `scripts/production-health.ps1` | Health check local/publico |
