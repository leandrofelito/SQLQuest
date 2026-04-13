import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { computeNovoStreak } from './streak'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        if (!user.password) {
          throw new Error('GoogleAccount')
        }

        if (!user.emailVerified) {
          throw new Error('EmailNotVerified')
        }

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        return true
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) token.sub = user.id

      // Atualiza nickname no token quando o usuário salva via session.update()
      if (trigger === 'update' && session?.nickname !== undefined) {
        token.nickname = session.nickname
        return token
      }

      // Primeira vez que o token não tem nickname: busca no DB e persiste no cookie
      if (token.nickname === undefined && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { nickname: true },
        })
        token.nickname = dbUser?.nickname ?? null
      }

      return token
    },
    async session({ session, token }) {
      const userId = token.sub as string
      if (session.user && userId) {
        // Garante que o id esteja disponível mesmo se o bloco abaixo falhar
        ;(session.user as any).id = userId
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: userId } })
          ;(session.user as any).isPro = dbUser?.isPro ?? false
          ;(session.user as any).isAdmin = dbUser?.isAdmin ?? false
          ;(session.user as any).totalXp = dbUser?.totalXp ?? 0
          ;(session.user as any).streak = dbUser?.streak ?? 0
          ;(session.user as any).nickname = (token.nickname as string | null) ?? dbUser?.nickname ?? null

          // Só atualiza streak/lastActiveAt se o usuário existir no banco
          if (dbUser) {
            const hoje = new Date()
            const novoStreak = computeNovoStreak({
              streakAtual: dbUser.streak ?? 0,
              lastActiveAt: dbUser.lastActiveAt,
              agora: hoje,
            })

            await prisma.user.update({
              where: { id: userId },
              data: { lastActiveAt: hoje, streak: novoStreak },
            })
            ;(session.user as any).streak = novoStreak
          }
        } catch (err) {
          // Falha no DB não derruba a sessão — o cliente continua autenticado
          console.error('[auth] session callback error:', err)
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl + '/home'
    },
  },
  pages: { signIn: '/login' },
  debug: process.env.NODE_ENV === 'development',
}
