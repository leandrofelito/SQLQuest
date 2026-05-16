# Setup do SQLQuest

Este guia descreve o setup atual do projeto: PostgreSQL local, Next.js local e, em producao, publicacao por Cloudflare Tunnel.

## Passo 1 - Instalar o PostgreSQL local

1. Instale o PostgreSQL no computador/servidor.
2. Crie um banco para o projeto, por exemplo `sqlquest_local`.
3. Crie um usuario proprio para a aplicacao.
4. Guarde a senha somente no `.env.local`.

Exemplo de conexao esperada:

```text
postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local
```

## Passo 2 - Configurar variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores reais:

```env
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"
DIRECT_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/sqlquest_local"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_URL="http://localhost:3000"
ADMIN_EMAILS="seu@email.com"
CONTENT_VERSION="1"
```

Em producao local, use:

```env
NEXTAUTH_URL="https://sqlquest.com.br"
NEXT_PUBLIC_URL="https://sqlquest.com.br"
```

As demais variaveis de Google, Stripe, Resend e AdSense podem ficar vazias em desenvolvimento, mas devem ser configuradas em producao se esses recursos estiverem ativos.

## Passo 3 - Instalar dependencias

```bash
npm install
```

## Passo 4 - Configurar o banco

```bash
npm run db:generate
npm run db:push
npm run seed
```

## Passo 5 - Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

---

## Producao local

1. Garanta que o PostgreSQL esta ligado.
2. Gere o build:

```bash
npm run build
```

3. Inicie o servidor Next.js local:

```powershell
Start-Process powershell.exe -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  (Join-Path (Get-Location) 'scripts\production-start.ps1')
) -WindowStyle Hidden
```

4. Inicie/valide o Cloudflare Tunnel:

```powershell
.\scripts\cloudflare-tunnel-run.ps1
```

5. Verifique:

```powershell
.\scripts\production-health.ps1
```

O site publico deve responder em:

```text
https://sqlquest.com.br
```

## Parar producao local

```powershell
.\scripts\production-stop.ps1
```

## Google OAuth

No Google Cloud Console, configure:

```text
Origem JavaScript:
https://sqlquest.com.br
https://www.sqlquest.com.br

Redirect URI:
https://sqlquest.com.br/api/auth/callback/google
https://www.sqlquest.com.br/api/auth/callback/google
```

Para desenvolvimento local, tambem pode cadastrar:

```text
http://localhost:3000/api/auth/callback/google
```

## Stripe

Webhook local:

```bash
npx stripe listen --forward-to localhost:3000/api/webhook
```

Webhook em producao:

```text
https://sqlquest.com.br/api/webhook
```

## Dicas importantes

- Nunca commite `.env.local`.
- Nao coloque senhas reais em README, SETUP ou commits.
- Rode `npm run seed` sempre que atualizar os JSONs de `content/trilhas/`.
- Rode `npm run db:check` para validar se o banco esta coerente.
- Se o computador/servidor desligar, sera necessario religar PostgreSQL, Next.js de producao e Cloudflare Tunnel.
