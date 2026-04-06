'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export default function AcessoRestritoPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-5xl">🔒</div>
        <div>
          <h1 className="text-xl font-bold text-white">Acesso Restrito</h1>
          <p className="text-white/40 text-sm mt-2">
            O SQLQuest está em fase de testes e ainda não está aberto ao público.
          </p>
        </div>
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          variant="ghost"
          fullWidth
        >
          Sair
        </Button>
      </div>
    </div>
  )
}
