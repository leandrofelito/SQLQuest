import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Restrição de acesso: só emails autorizados podem usar o site
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) ?? []
    if (allowedEmails.length > 0 && token?.email && !allowedEmails.includes(token.email as string)) {
      return NextResponse.redirect(new URL('/acesso-restrito', req.url))
    }

    if (pathname.startsWith('/admin')) {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? []
      if (!token?.email || !adminEmails.includes(token.email as string)) {
        return NextResponse.redirect(new URL('/home', req.url))
      }
    }
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    '/home/:path*',
    '/trilha/:path*',
    '/certificados/:path*',
    '/ranking/:path*',
    '/perfil/:path*',
    '/admin/:path*',
  ],
}
