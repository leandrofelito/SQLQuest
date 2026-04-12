import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const MANUTENCAO = process.env.MAINTENANCE_MODE === 'true'

// Rotas públicas — não exigem autenticação
const PUBLIC_PATHS = ['/login', '/register', '/manutencao', '/cert']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    if (MANUTENCAO && pathname !== '/manutencao') {
      return NextResponse.redirect(new URL('/manutencao', req.url))
    }

    const token = req.nextauth.token

    if (pathname.startsWith('/admin')) {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? []
      if (!token?.email || !adminEmails.includes(token.email as string)) {
        return NextResponse.redirect(new URL('/home', req.url))
      }
    }

    // Usuário autenticado sem nickname → obrigar a escolher antes de continuar
    if (token && !token.nickname && pathname !== '/escolher-nickname') {
      return NextResponse.redirect(new URL('/escolher-nickname', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Rotas públicas passam sem token para evitar loop de redirecionamento
        if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return true
        if (pathname.startsWith('/api/conteudo-version')) return true
        if (MANUTENCAO) return true // deixa passar pro redirect acima
        return !!token
      },
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    // Exclui assets estáticos e api/auth do middleware
    '/((?!_next/static|_next/image|favicon\\.ico|icons|images|api/auth|manutencao).*)',
  ],
}
