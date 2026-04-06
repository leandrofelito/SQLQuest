import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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
  const cBg     = rgb(0.055, 0.063, 0.094)
  const cCard   = rgb(0.071, 0.082, 0.118)
  const cPurple = rgb(0.545, 0.361, 0.969)
  const cPurpleL = rgb(0.671, 0.549, 0.984)
  const cGold   = rgb(0.980, 0.761, 0.259)
  const cWhite  = rgb(0.95, 0.95, 0.98)
  const cMuted  = rgb(0.55, 0.55, 0.65)
  const cBorder = rgb(0.14, 0.16, 0.22)

  // ── Fundo
  page.drawRectangle({ x: 0, y: 0, width, height, color: cBg })

  // ── Card central
  const cardX = 40, cardY = 30, cardW = width - 80, cardH = height - 60
  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH,
    color: cCard, borderColor: cBorder, borderWidth: 1 })

  // ── Barra lateral roxa à esquerda
  page.drawRectangle({ x: cardX, y: cardY, width: 8, height: cardH, color: cPurple })

  // ── Logo
  page.drawText('SQL', {
    x: cardX + 28, y: cardY + cardH - 48,
    size: 22, font: fontBold, color: cPurpleL,
  })
  page.drawText('Quest', {
    x: cardX + 28 + fontBold.widthOfTextAtSize('SQL', 22),
    y: cardY + cardH - 48,
    size: 22, font: fontBold, color: cWhite,
  })

  // ── Linha separadora topo
  page.drawLine({
    start: { x: cardX + 24, y: cardY + cardH - 60 },
    end:   { x: cardX + cardW - 24, y: cardY + cardH - 60 },
    thickness: 0.5, color: cBorder,
  })

  // ── Medalha (círculos + estrela)
  const mx = width / 2
  const my = cardY + cardH - 130
  page.drawEllipse({ x: mx, y: my, xScale: 38, yScale: 38,
    color: cGold, opacity: 0.12 })
  page.drawEllipse({ x: mx, y: my, xScale: 38, yScale: 38,
    borderColor: cGold, borderWidth: 1.5, opacity: 0.55 })
  page.drawEllipse({ x: mx, y: my, xScale: 27, yScale: 27,
    color: cPurple, opacity: 0.9 })
  const star = '★'
  const starSize = 25
  const starW = fontBold.widthOfTextAtSize(star, starSize)
  page.drawText(star, {
    x: mx - starW / 2, y: my - starSize * 0.36,
    size: starSize, font: fontBold, color: cGold,
  })

  // ── "CERTIFICADO DE CONCLUSÃO"
  const label = 'CERTIFICADO DE CONCLUSÃO'
  const labelSize = 10
  const labelW = fontBold.widthOfTextAtSize(label, labelSize)
  page.drawText(label, {
    x: width / 2 - labelW / 2, y: cardY + cardH - 178,
    size: labelSize, font: fontBold, color: cPurpleL,  })

  // ── "Certificamos que"
  const sub = 'Certificamos que'
  const subW = fontOblique.widthOfTextAtSize(sub, 12)
  page.drawText(sub, {
    x: width / 2 - subW / 2, y: cardY + cardH - 212,
    size: 12, font: fontOblique, color: cMuted,
  })

  // ── Nome do usuário
  const nameSize = 36
  const nameW = fontBold.widthOfTextAtSize(data.userName, nameSize)
  page.drawText(data.userName, {
    x: width / 2 - nameW / 2, y: cardY + cardH - 260,
    size: nameSize, font: fontBold, color: cWhite,
  })
  // Sublinha decorativa
  const lm = 28
  page.drawLine({
    start: { x: width / 2 - nameW / 2 - lm, y: cardY + cardH - 270 },
    end:   { x: width / 2 + nameW / 2 + lm, y: cardY + cardH - 270 },
    thickness: 1, color: cPurple, opacity: 0.55,
  })

  // ── "concluiu com êxito o curso"
  const conc = 'concluiu com êxito o curso'
  const concW = fontRegular.widthOfTextAtSize(conc, 12)
  page.drawText(conc, {
    x: width / 2 - concW / 2, y: cardY + cardH - 300,
    size: 12, font: fontRegular, color: cMuted,
  })

  // ── Título do curso
  const cursoSize = 20
  const cursoW = fontBold.widthOfTextAtSize(data.trilhaTitulo, cursoSize)
  page.drawText(data.trilhaTitulo, {
    x: width / 2 - cursoW / 2, y: cardY + cardH - 332,
    size: cursoSize, font: fontBold, color: cPurpleL,
  })

  // ── Divisória
  page.drawLine({
    start: { x: cardX + 60, y: cardY + cardH - 362 },
    end:   { x: cardX + cardW - 60, y: cardY + cardH - 362 },
    thickness: 0.5, color: cBorder,
  })

  // ── Info: Data | Código | URL
  const infoY = cardY + cardH - 392
  const dataFormatada = data.emitidoEm.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Data (esquerda)
  page.drawText('DATA DE EMISSÃO', {
    x: cardX + 60, y: infoY + 18,
    size: 7, font: fontBold, color: cMuted,  })
  page.drawText(dataFormatada, {
    x: cardX + 60, y: infoY,
    size: 11, font: fontBold, color: cWhite,
  })

  // Código (centro)
  const hashShort = data.hash.substring(0, 20).toUpperCase()
  const hashW = fontBold.widthOfTextAtSize(hashShort, 9)
  page.drawText('CÓDIGO DE VALIDAÇÃO', {
    x: width / 2 - fontBold.widthOfTextAtSize('CÓDIGO DE VALIDAÇÃO', 7) / 2,
    y: infoY + 18, size: 7, font: fontBold, color: cMuted,  })
  page.drawText(hashShort, {
    x: width / 2 - hashW / 2, y: infoY,
    size: 9, font: fontBold, color: cPurpleL,
  })

  // URL (direita)
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://sqlquest.com.br'
  const urlText = `${baseUrl}/cert/${data.hash.substring(0, 12)}`
  const urlW = fontOblique.widthOfTextAtSize(urlText, 8)
  page.drawText('VERIFICAR CERTIFICADO', {
    x: cardX + cardW - 60 - fontBold.widthOfTextAtSize('VERIFICAR CERTIFICADO', 7),
    y: infoY + 18, size: 7, font: fontBold, color: cMuted,  })
  page.drawText(urlText, {
    x: cardX + cardW - 60 - urlW, y: infoY,
    size: 8, font: fontOblique, color: cMuted,
  })

  // ── Rodapé
  const footer = 'SQLQuest — Plataforma de aprendizado SQL gamificada  •  sqlquest.com.br'
  const footerW = fontRegular.widthOfTextAtSize(footer, 7.5)
  page.drawText(footer, {
    x: width / 2 - footerW / 2, y: cardY + 13,
    size: 7.5, font: fontRegular, color: rgb(0.28, 0.28, 0.38),
  })

  return await pdfDoc.save()
}
