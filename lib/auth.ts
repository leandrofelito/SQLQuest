import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
    async session({ session, token }) {
      const userId = token.sub as string
      if (session.user && userId) {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } })
        ;(session.user as any).id = userId
        ;(session.user as any).isPro = dbUser?.isPro ?? false
        ;(session.user as any).isAdmin = dbUser?.isAdmin ?? false
        ;(session.user as any).totalXp = dbUser?.totalXp ?? 0
        ;(session.user as any).streak = dbUser?.streak ?? 0

        const hoje = new Date()
        const ultimaAtividade = dbUser?.lastActiveAt
        let novoStreak = dbUser?.streak ?? 0
        if (ultimaAtividade) {
          const diffDias = Math.floor((hoje.getTime() - ultimaAtividade.getTime()) / 86400000)
          if (diffDias === 1) novoStreak += 1
          else if (diffDias > 1) novoStreak = 1
        } else {
          novoStreak = 1
        }

        await prisma.user.update({
          where: { id: userId },
          data: { lastActiveAt: hoje, streak: novoStreak },
        })
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
