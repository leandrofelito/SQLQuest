import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return 'Não informado'
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function yesNo(value: boolean) {
  return value ? 'Sim' : 'Não'
}

function renderRows(rows: Array<[string, unknown]>) {
  return rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      nickname: true,
      image: true,
      isPro: true,
      isAdmin: true,
      proAt: true,
      totalXp: true,
      xpRanking: true,
      streak: true,
      prestige: true,
      language_preference: true,
      lastActiveAt: true,
      deletionRequestedAt: true,
      deletionScheduledAt: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
          type: true,
        },
      },
      progressos: {
        select: {
          trilhaId: true,
          etapaId: true,
          xpGanho: true,
          tentativas: true,
          usouDica: true,
          estrelas: true,
          concluidaEm: true,
          trilha: { select: { slug: true, titulo: true } },
          etapa: { select: { ordem: true, tipo: true, titulo: true } },
        },
        orderBy: { concluidaEm: 'desc' },
      },
      pagamentos: {
        select: {
          id: true,
          stripeSessionId: true,
          valor: true,
          status: true,
          criadoEm: true,
        },
        orderBy: { criadoEm: 'desc' },
      },
      certificados: {
        select: {
          hash: true,
          emitidoEm: true,
          trilha: { select: { slug: true, titulo: true } },
        },
        orderBy: { emitidoEm: 'desc' },
      },
      conquistasRanking: {
        select: {
          tipo: true,
          posicao: true,
          alcancadaEm: true,
        },
        orderBy: { alcancadaEm: 'desc' },
      },
      trilhasDesbloqueadas: {
        select: {
          criadaEm: true,
          trilha: { select: { slug: true, titulo: true } },
        },
        orderBy: { criadaEm: 'desc' },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meus dados - SQLQuest</title>
  <style>
    body { margin: 0; background: #080a0f; color: #f8fafc; font-family: Arial, sans-serif; line-height: 1.5; }
    main { max-width: 920px; margin: 0 auto; padding: 32px 18px; }
    h1 { color: #a78bfa; margin-bottom: 4px; }
    h2 { margin-top: 32px; border-bottom: 1px solid #2a2d3a; padding-bottom: 8px; }
    p, li { color: rgba(255,255,255,.72); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; background: #0f1117; border: 1px solid #242736; border-radius: 12px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #242736; text-align: left; vertical-align: top; }
    th { width: 260px; color: rgba(255,255,255,.55); font-weight: 600; }
    td { color: rgba(255,255,255,.86); }
    .muted { color: rgba(255,255,255,.48); font-size: 14px; }
    .card { background: #0f1117; border: 1px solid #242736; border-radius: 14px; padding: 14px; margin-top: 12px; }
  </style>
</head>
<body>
  <main>
    <h1>Relatório dos meus dados</h1>
    <p class="muted">Gerado em ${escapeHtml(formatDate(new Date()))} pelo SQLQuest.</p>
    <p>Este arquivo reúne os principais dados associados à sua conta. Por segurança, senha, tokens de sessão e tokens OAuth não são incluídos.</p>

    <h2>Conta</h2>
    <table><tbody>${renderRows([
      ['Nome', user.name ?? 'Não informado'],
      ['Email', user.email],
      ['Email verificado', user.emailVerified ? formatDate(user.emailVerified) : 'Não'],
      ['Nickname', user.nickname ?? 'Não informado'],
      ['Plano Pro', yesNo(user.isPro)],
      ['Pro desde', formatDate(user.proAt)],
      ['Administrador', yesNo(user.isAdmin)],
      ['Idioma', user.language_preference],
      ['Criada em', formatDate(user.createdAt)],
      ['Última atualização', formatDate(user.updatedAt)],
      ['Última atividade', formatDate(user.lastActiveAt)],
      ['Exclusão solicitada', formatDate(user.deletionRequestedAt)],
      ['Exclusão programada', formatDate(user.deletionScheduledAt)],
    ])}</tbody></table>

    <h2>Progresso</h2>
    <table><tbody>${renderRows([
      ['XP atual', user.totalXp],
      ['XP no ranking', user.xpRanking],
      ['Streak', `${user.streak} dia(s)`],
      ['Prestígio', user.prestige],
      ['Etapas concluídas', user.progressos.length],
      ['Certificados emitidos', user.certificados.length],
      ['Trilhas desbloqueadas', user.trilhasDesbloqueadas.length],
    ])}</tbody></table>

    <h2>Certificados</h2>
    ${
      user.certificados.length
        ? user.certificados.map(c => `<div class="card"><strong>${escapeHtml(c.trilha.titulo)}</strong><br><span class="muted">Emitido em ${escapeHtml(formatDate(c.emitidoEm))} - Código: ${escapeHtml(c.hash)}</span></div>`).join('')
        : '<p>Nenhum certificado emitido.</p>'
    }

    <h2>Pagamentos</h2>
    ${
      user.pagamentos.length
        ? user.pagamentos.map(p => `<div class="card"><strong>${escapeHtml(p.status)}</strong><br><span class="muted">Valor: R$ ${(p.valor / 100).toFixed(2).replace('.', ',')} - Criado em ${escapeHtml(formatDate(p.criadoEm))}</span></div>`).join('')
        : '<p>Nenhum pagamento registrado.</p>'
    }

    <h2>Últimos progressos</h2>
    ${
      user.progressos.length
        ? user.progressos.slice(0, 80).map(p => `<div class="card"><strong>${escapeHtml(p.trilha.titulo)} - ${escapeHtml(p.etapa.titulo)}</strong><br><span class="muted">${escapeHtml(p.estrelas)} estrela(s), ${escapeHtml(p.xpGanho)} XP, concluído em ${escapeHtml(formatDate(p.concluidaEm))}</span></div>`).join('')
        : '<p>Nenhum progresso registrado.</p>'
    }
  </main>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sqlquest-meus-dados.html"',
      'Cache-Control': 'no-store',
    },
  })
}
