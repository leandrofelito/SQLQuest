import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? []

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f1117] border-r border-[#1e2028] flex flex-col">
        <div className="p-4 border-b border-[#1e2028]">
          <div className="text-[#a78bfa] font-bold text-sm">SQLQuest</div>
          <div className="text-white/30 text-xs">Admin Panel</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: '/admin', label: 'Dashboard', emoji: '📊' },
            { href: '/admin/questoes', label: 'Questões', emoji: '📝' },
            { href: '/admin/pagamentos', label: 'Pagamentos', emoji: '💳' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-[#1e2028] transition-colors"
            >
              <span>{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e2028]">
          <Link href="/home" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ← Voltar ao app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
