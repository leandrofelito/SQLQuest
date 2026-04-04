import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        ;(session.user as any).id = user.id
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
          where: { id: user.id },
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
  session: { strategy: 'database' },
}
