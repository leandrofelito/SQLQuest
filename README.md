# SQLQuest

Plataforma gamificada de ensino de SQL, com microlições interativas, execução de queries no browser, XP, níveis, ranking global, conquistas, certificados PDF, plano Pro via Stripe, PWA e app mobile em Flutter.

O projeto hoje roda com **PostgreSQL local**, **Next.js local em produção** e publicação externa por **Cloudflare Tunnel** no domínio `https://sqlquest.com.br`.

---

## Arquitetura atual

```text
Usuário web/app
  -> https://sqlquest.com.br
  -> Cloudflare Tunnel
  -> Next.js local em 127.0.0.1:3000
  -> PostgreSQL local
```

- O banco principal é um PostgreSQL instalado no computador/servidor local.
- O Next.js de produção escuta apenas em `127.0.0.1:3000`.
- O Cloudflare Tunnel publica o site com HTTPS sem expor diretamente a porta local.

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 App Router | Site, rotas autenticadas, API routes e server-side rendering |
| React 18 + TypeScript | Interface e tipagem |
| Tailwind CSS + Framer Motion | Estilo e animações |
| Prisma 5 | ORM, schema e Prisma Client |
| PostgreSQL local | Banco principal da aplicação |
| NextAuth.js | Login com Google e email/senha |
| Stripe | Checkout, webhook e liberação do plano Pro |
| Resend | Emails transacionais |
| sql.js | Execução dos exercícios SQL no browser |
| pdf-lib | Geração de certificados PDF |
| next-pwa | Service Worker e instalação como PWA |
| Flutter | App mobile nativo Android/iOS |

---

## Funcionalidades principais

- Trilhas sequenciais de SQL, do básico ao avançado.
- Exercícios interativos executados no navegador com `sql.js`.
- Dicas progressivas por exercício.
- XP, níveis, streak, prestígio, conquistas e ranking global.
- Login com Google OAuth e email/senha.
- Cadastro com verificação de email.
- Plano Pro via Stripe, com remoção de anúncios e galeria de certificados.
- Certificados PDF com validação pública por hash.
- Painel admin para acompanhar usuários, pagamentos e sincronizar conteúdo.
- Consentimento de privacidade/LGPD antes de carregar anúncios e serviços opcionais.
- Exportação de dados do usuário em `/api/user/export`.
- Páginas públicas de privacidade, termos, roadmap e status.

---

## Rotas principais

| Rota | Descrição |
|---|---|
| `/` | Landing page |
| `/login` | Login com Google ou email/senha |
| `/register` | Cadastro |
| `/escolher-nickname` | Nickname após login Google |
| `/home` | Mapa de trilhas |
| `/trilha/[slug]` | Página de uma trilha |
| `/trilha/[slug]/etapa/[id]` | Microlição ou exercício |
| `/certificados` | Certificados do usuário Pro |
| `/cert/[hash]` | Validação pública de certificado |
| `/ranking` | Ranking global |
| `/perfil` | Perfil, privacidade, XP e conquistas |
| `/upgrade` | Página do plano Pro |
| `/admin` | Painel administrativo |
| `/admin/pagamentos` | Histórico de pagamentos |
| `/admin/questoes` | Gerenciamento de questões |
| `/blog` | Conteúdo público |
| `/roadmap` | Roadmap público |
| `/status` | Status público |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |
| `/manutencao` | Tela de manutenção |

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz. Nunca commite esse arquivo.

```env
# PostgreSQL local
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"
DIRECT_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"

# Incremente quando publicar novo conteúdo de trilhas/etapas
CONTENT_VERSION="1"

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# URL pública do app
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

# Validação de exercícios
TOKEN_SECRET=""

# Manutenção
MAINTENANCE_MODE=false
```

Em produção local, use:

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

1. Instale as dependências:

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

## Produção local

Build:

```bash
npm run build
```

Iniciar o servidor local de produção:

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

Verificar saúde:

```powershell
.\scripts\production-health.ps1
```

O servidor de produção deve responder em `http://127.0.0.1:3000`, e o acesso público deve passar por `https://sqlquest.com.br`.

---

## Cloudflare Tunnel

Scripts auxiliares:

```powershell
.\scripts\cloudflare-tunnel-login.ps1
.\scripts\cloudflare-tunnel-create.ps1
.\scripts\cloudflare-tunnel-run.ps1
```

Configuração esperada da rota pública:

```text
Hostname: sqlquest.com.br
Service: http://127.0.0.1:3000
```

Também pode existir uma rota para `www.sqlquest.com.br`, apontando para o mesmo serviço.

Se o computador/servidor desligar, o site público fica indisponível até que o PostgreSQL, o servidor Next.js e o Cloudflare Tunnel estejam ativos novamente.

---

## Banco de dados

Modelos principais no Prisma:

| Modelo | Descrição |
|---|---|
| `User` | Usuário, XP, streak, prestígio, Pro e admin |
| `Account` | Contas OAuth vinculadas |
| `Session` | Sessões do NextAuth |
| `VerificationToken` | Tokens de verificação de email |
| `Trilha` | Trilha de conteúdo |
| `Etapa` | Etapa de uma trilha |
| `Progresso` | Progresso do usuário nas etapas |
| `Pagamento` | Pagamentos Stripe |
| `Certificado` | Certificados emitidos |
| `ConquistaRanking` | Conquistas de ranking |
| `TrilhaDesbloqueada` | Desbloqueios manuais/futuros |
| `RateLimit` | Rate limiting persistido |

Comandos úteis:

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

## Conteúdo das trilhas

O conteúdo fica em `content/trilhas/`.

Para adicionar ou alterar uma trilha:

1. Edite ou crie um JSON seguindo o padrão existente.
2. Rode:

```bash
npm run seed
```

3. Se o conteúdo já estiver em produção/PWA, incremente `CONTENT_VERSION` para invalidar cache offline dos clientes.

O painel admin também possui a ação **Sincronizar banco com JSONs**, que faz upsert das trilhas e etapas sem apagar progresso dos usuários.

---

## Pagamentos Stripe

Webhook local:

```bash
npx stripe listen --forward-to localhost:3000/api/webhook
```

Webhook em produção:

```text
https://sqlquest.com.br/api/webhook
```

O webhook confirma o pagamento e atualiza o campo `isPro` do usuário.

---

## Privacidade e LGPD

- Ads e serviços opcionais dependem de consentimento.
- A política de privacidade fica em `/privacidade`.
- Os termos ficam em `/termos`.
- O usuário pode exportar dados pela área de perfil ou endpoint `/api/user/export`.
- Dados sensíveis devem ficar somente em `.env.local` ou no ambiente de produção, nunca no Git.

---

## Scripts disponíveis

```bash
npm run dev           # servidor de desenvolvimento
npm run build         # prisma generate + build Next.js
npm run start         # servidor Next.js de produção
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

O app mobile atual usa Flutter. Para que o app funcione em produção, a base URL/API deve apontar para:

```text
https://sqlquest.com.br
```

Depois de alterações que afetam frontend, PWA, URLs públicas, autenticação ou API, gere nova build do app mobile antes de publicar uma nova versão.

---

## Arquivos importantes

| Arquivo/pasta | Uso |
|---|---|
| `app/` | Rotas, páginas e API routes do Next.js |
| `components/` | Componentes reutilizáveis |
| `features/` | Regras de negócio por domínio |
| `lib/` | Infraestrutura, auth, banco, Stripe, helpers |
| `prisma/schema.prisma` | Modelagem do banco |
| `content/trilhas/` | Conteúdo das trilhas |
| `i18n/` | Traduções pt/en/es |
| `public/og-image.png` | Imagem social padrão |
| `scripts/production-start.ps1` | Início local em produção |
| `scripts/production-stop.ps1` | Parada local |
| `scripts/production-health.ps1` | Health check local/público |
