# Setup do SQLQuest

## Passo 1 — Criar o banco de dados (gratuito)

1. Acesse https://neon.tech e crie uma conta gratuita
2. Clique em "New Project"
3. Dê um nome (ex: sqlquest)
4. Copie a "Connection string" que aparece — começa com `postgresql://...`

## Passo 2 — Configurar as variáveis de ambiente

Abra o arquivo `.env.local` e preencha:

```
DATABASE_URL="cole-aqui-a-connection-string-do-neon"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAILS="seu@email.com"
```

> `NEXTAUTH_SECRET` já está preenchido automaticamente.
> As outras variáveis (Google, Stripe, AdSense) podem ficar vazias por enquanto — o app roda sem elas em desenvolvimento.

## Passo 3 — Configurar o banco

```bash
npx prisma db push
npm run seed
```

## Passo 4 — Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Opcional — Autenticação Google

1. Acesse https://console.cloud.google.com
2. Crie um projeto
3. APIs & Services > Credentials > OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copie Client ID e Client Secret para o `.env.local`

## Opcional — Stripe (pagamentos)

1. Acesse https://dashboard.stripe.com
2. Developers > API Keys > copie a Secret Key
3. Para webhook local: `npx stripe listen --forward-to localhost:3000/api/webhook`

---

## Verificação: ordem correta dos comandos

```bash
npm install
npx prisma generate
npx prisma db push        # só após configurar DATABASE_URL
npm run seed              # só após o db push funcionar
npm run dev
```

## Dicas importantes

- Não commite o `.env.local` no git (já está no `.gitignore`)
- O banco Neon tem plano gratuito generoso: 512MB — suficiente para desenvolvimento
- O seed pode ser rodado múltiplas vezes sem duplicar dados (usa upsert)
- Para verificar se o banco está configurado antes do seed: `npm run db:check`
