import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCertificatePDF } from '@/lib/certificate'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const trilhaId = searchParams.get('trilhaId')
  if (!trilhaId) return NextResponse.json({ error: 'trilhaId obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.isPro) return NextResponse.json({ error: 'Disponível apenas no Pro' }, { status: 403 })

  const cert = await prisma.certificado.findUnique({
    where: { userId_trilhaId: { userId, trilhaId } },
    include: { trilha: true },
  })
  if (!cert) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })

  const pdfBytes = await generateCertificatePDF({
    userName: user.name ?? 'Usuário',
    trilhaTitulo: `SQL — ${cert.trilha.titulo}`,
    hash: cert.hash,
    emitidoEm: cert.emitidoEm,
  })

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-sqlquest-${cert.trilha.slug}.pdf"`,
    },
  })
}
