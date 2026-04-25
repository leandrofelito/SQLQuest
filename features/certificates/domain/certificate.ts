import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

interface CertData {
  userName: string
  trilhaTitulo: string
  hash: string
  emitidoEm: Date
}

export async function generateCertificatePDF(data: CertData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // A4 landscape
  const page = pdfDoc.addPage([841.89, 595.28])
  const { width, height } = page.getSize()

  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Cores
  const cBg      = rgb(0.055, 0.063, 0.094)
  const cPurple  = rgb(0.545, 0.361, 0.969)
  const cPurpleL = rgb(0.671, 0.549, 0.984)
  const cWhite   = rgb(0.95, 0.95, 0.98)
  const cMuted   = rgb(0.55, 0.55, 0.65)
  const cBorder  = rgb(0.14, 0.16, 0.22)

  // ── Fundo full-page (elimina bordas claras em qualquer visualizador)
  page.drawRectangle({ x: 0, y: 0, width, height, color: cBg })

  // ── Barra lateral roxa à esquerda (full height)
  page.drawRectangle({ x: 0, y: 0, width: 8, height, color: cPurple })

  // Área de conteúdo com padding interno
  const padX = 48, padY = 30
  const contentW = width - padX * 2
  const contentH = height - padY * 2

  // ── Linha separadora topo
  page.drawLine({
    start: { x: padX, y: padY + contentH - 52 },
    end:   { x: padX + contentW, y: padY + contentH - 52 },
    thickness: 0.5, color: cBorder,
  })

  // ── Logo oficial (ícone PNG)
  const logoPath = path.join(process.cwd(), 'public', 'icons', 'sqlquest-logo-cert.png')
  const logoPng  = fs.readFileSync(logoPath)
  const logoImg  = await pdfDoc.embedPng(logoPng)
  const logoSize = 180
  const logoX    = width / 2 - logoSize / 2
  const logoY    = padY + contentH - 225
  page.drawImage(logoImg, { x: logoX, y: logoY, width: logoSize, height: logoSize })

  // ── "CERTIFICADO DE CONCLUSÃO"
  const label  = 'CERTIFICADO DE CONCLUSÃO'
  const labelW = fontBold.widthOfTextAtSize(label, 10)
  page.drawText(label, {
    x: width / 2 - labelW / 2, y: padY + contentH - 222,
    size: 10, font: fontBold, color: cPurpleL,
  })

  // ── "Certificamos que"
  const sub  = 'Certificamos que'
  const subW = fontOblique.widthOfTextAtSize(sub, 12)
  page.drawText(sub, {
    x: width / 2 - subW / 2, y: padY + contentH - 256,
    size: 12, font: fontOblique, color: cMuted,
  })

  // ── Nome do usuário
  const nameSize = 36
  const nameW    = fontBold.widthOfTextAtSize(data.userName, nameSize)
  page.drawText(data.userName, {
    x: width / 2 - nameW / 2, y: padY + contentH - 304,
    size: nameSize, font: fontBold, color: cWhite,
  })
  // Sublinha decorativa
  const lm = 28
  page.drawLine({
    start: { x: width / 2 - nameW / 2 - lm, y: padY + contentH - 314 },
    end:   { x: width / 2 + nameW / 2 + lm, y: padY + contentH - 314 },
    thickness: 1, color: cPurple, opacity: 0.55,
  })

  // ── "concluiu com exito o curso"
  const conc  = 'concluiu com \xEAxito o curso'
  const concW = fontRegular.widthOfTextAtSize(conc, 12)
  page.drawText(conc, {
    x: width / 2 - concW / 2, y: padY + contentH - 344,
    size: 12, font: fontRegular, color: cMuted,
  })

  // ── Título do curso
  const cursoSize = 20
  const cursoW    = fontBold.widthOfTextAtSize(data.trilhaTitulo, cursoSize)
  page.drawText(data.trilhaTitulo, {
    x: width / 2 - cursoW / 2, y: padY + contentH - 376,
    size: cursoSize, font: fontBold, color: cPurpleL,
  })

  // ── Divisória
  page.drawLine({
    start: { x: padX + 20, y: padY + contentH - 406 },
    end:   { x: padX + contentW - 20, y: padY + contentH - 406 },
    thickness: 0.5, color: cBorder,
  })

  // ── Info: Data | Código | URL
  const infoY = padY + contentH - 436
  let dataFormatada: string
  try {
    dataFormatada = data.emitidoEm.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    const d = data.emitidoEm
    dataFormatada = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  // Data (esquerda)
  page.drawText('DATA DE EMISSÃO', {
    x: padX + 20, y: infoY + 18,
    size: 7, font: fontBold, color: cMuted,
  })
  page.drawText(dataFormatada, {
    x: padX + 20, y: infoY,
    size: 11, font: fontBold, color: cWhite,
  })

  // Código (centro)
  const hashShort = data.hash.substring(0, 20).toUpperCase()
  const hashW     = fontBold.widthOfTextAtSize(hashShort, 9)
  page.drawText('CODIGO DE VALIDACAO', {
    x: width / 2 - fontBold.widthOfTextAtSize('CODIGO DE VALIDACAO', 7) / 2,
    y: infoY + 18, size: 7, font: fontBold, color: cMuted,
  })
  page.drawText(hashShort, {
    x: width / 2 - hashW / 2, y: infoY,
    size: 9, font: fontBold, color: cPurpleL,
  })

  // URL (direita)
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://sqlquest.com.br'
  const urlText = `${baseUrl}/cert/${data.hash.substring(0, 12)}`
  const urlW    = fontOblique.widthOfTextAtSize(urlText, 8)
  page.drawText('VERIFICAR CERTIFICADO', {
    x: padX + contentW - 20 - fontBold.widthOfTextAtSize('VERIFICAR CERTIFICADO', 7),
    y: infoY + 18, size: 7, font: fontBold, color: cMuted,
  })
  page.drawText(urlText, {
    x: padX + contentW - 20 - urlW, y: infoY,
    size: 8, font: fontOblique, color: cMuted,
  })

  // ── Rodapé
  const footer  = 'SQLQuest - Plataforma de aprendizado SQL gamificada  |  sqlquest.com.br'
  const footerW = fontRegular.widthOfTextAtSize(footer, 7.5)
  page.drawText(footer, {
    x: width / 2 - footerW / 2, y: padY - 16,
    size: 7.5, font: fontRegular, color: rgb(0.28, 0.28, 0.38),
  })

  return await pdfDoc.save()
}
