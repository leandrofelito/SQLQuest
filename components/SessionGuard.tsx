'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const AUTH_PAGES = ['/login', '/register', '/verify', '/acesso-restrito']

export function SessionGuard() {
  const { status } = useSession()
  const pathname = usePathname()
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    if (status === 'loading') return
    if (AUTH_PAGES.some(p => pathname.startsWith(p))) return
    if (status !== 'authenticated') return

    // Só marca como verificado após confirmar autenticação real
    checked.current = true

    const v2 = localStorage.getItem('sqlquest_auth_v2')
    if (!v2) {
      // Primeira vez com o novo sistema (inclui retorno de OAuth sem flags): mantém logado
      localStorage.setItem('sqlquest_keep_logged_in', '1')
      localStorage.setItem('sqlquest_auth_v2', '1')
      sessionStorage.setItem('sqlquest_session_active', '1')
      return
    }

    const keepLoggedIn = localStorage.getItem('sqlquest_keep_logged_in')
    const sessionActive = sessionStorage.getItem('sqlquest_session_active')

    if (!keepLoggedIn && !sessionActive) {
      // Sessão existe mas usuário não marcou "manter logado" e fechou o app
      signOut({ redirect: true, callbackUrl: '/login' })
    } else {
      // Garante que a sessão atual seja marcada como ativa (para refreshes de página)
      sessionStorage.setItem('sqlquest_session_active', '1')
    }
  }, [status, pathname])

  return null
}
