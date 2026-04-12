import { NextResponse } from 'next/server'

/** Versão do catálogo (trilhas/etapas). Incremente CONTENT_VERSION no deploy ao alterar conteúdo. */
export async function GET() {
  const version = process.env.CONTENT_VERSION?.trim() || '1'
  return NextResponse.json({ version })
}
