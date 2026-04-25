'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface EtapaFormProps {
  trilhas: { id: string; titulo: string; slug: string }[]
  onSaved?: () => void
}

export function EtapaForm({ trilhas, onSaved }: EtapaFormProps) {
  const [trilhaId, setTrilhaId] = useState('')
  const [ordem, setOrdem] = useState(1)
  const [tipo, setTipo] = useState('texto')
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('{}')
  const [xpReward, setXpReward] = useState(50)
  const [temAnuncio, setTemAnuncio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    setErro('')
    try { JSON.parse(conteudo) } catch { setErro('JSON inválido no campo conteúdo'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/etapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trilhaId, ordem, tipo, titulo, conteudo: JSON.parse(conteudo), xpReward, temAnuncio }),
      })
      if (!res.ok) throw new Error(await res.text())
      setTitulo(''); setConteudo('{}'); setOrdem(1)
      onSaved?.()
    } catch (e: any) {
      setErro(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#0f1117] rounded-2xl border border-[#2a2d3a] p-5 space-y-4">
      <h3 className="text-white font-bold">Nova Etapa</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-white/50 text-xs mb-1 block">Trilha</label>
          <select
            value={trilhaId}
            onChange={e => setTrilhaId(e.target.value)}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-white text-sm outline-none"
          >
            <option value="">Selecione...</option>
            {trilhas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Ordem</label>
          <input
            type="number"
            value={ordem}
            onChange={e => setOrdem(Number(e.target.value))}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-white text-sm outline-none"
          />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-white text-sm outline-none"
          >
            {['intro', 'texto', 'resumo', 'exercicio', 'conclusao'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-white/50 text-xs mb-1 block">Título</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-white text-sm outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="text-white/50 text-xs mb-1 block">Conteúdo (JSON)</label>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={5}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-emerald-400 font-mono text-xs outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">XP Reward</label>
          <input
            type="number"
            value={xpReward}
            onChange={e => setXpReward(Number(e.target.value))}
            className="w-full bg-[#1e2028] border border-[#2a2d3a] rounded-xl p-2.5 text-white text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            id="temAnuncio"
            checked={temAnuncio}
            onChange={e => setTemAnuncio(e.target.checked)}
            className="accent-purple-500"
          />
          <label htmlFor="temAnuncio" className="text-white/60 text-sm">Tem anúncio</label>
        </div>
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      <Button onClick={salvar} loading={loading} fullWidth>
        Salvar Etapa
      </Button>
    </div>
  )
}
