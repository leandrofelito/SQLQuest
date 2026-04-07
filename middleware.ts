import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const MANUTENCAO = process.env.MAINTENANCE_MODE === 'true'

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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (MANUTENCAO) return true // deixa passar pro redirect acima
        return !!token
      },
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api/auth).*)',
  ],
}
