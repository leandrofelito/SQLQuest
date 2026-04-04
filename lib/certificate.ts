import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface CertData {
  userName: string
  trilhaTitulo: string
  hash: string
  emitidoEm: Date
}

export async function generateCertificatePDF(data: CertData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.05, 0.06, 0.09) })

  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.54, 0.36, 0.97), borderWidth: 1.5,
  })

  page.drawRectangle({
    x: 28, y: 28, width: width - 56, height: height - 56,
    borderColor: rgb(0.54, 0.36, 0.97), borderWidth: 0.5,
  })

  page.drawText('SQLQuest', {
    x: 60, y: height - 80,
    size: 18, font: fontBold, color: rgb(0.67, 0.55, 0.98),
  })

  page.drawLine({
    start: { x: 60, y: height - 90 },
    end: { x: width - 60, y: height - 90 },
    thickness: 0.5, color: rgb(0.54, 0.36, 0.97),
  })

  ;(page as any).drawText('CERTIFICADO DE CONCLUSÃO', {
    x: width / 2 - 140, y: height - 140,
    size: 14, font: fontBold,
    color: rgb(0.54, 0.36, 0.97),
    characterSpacing: 3,
  })

  page.drawText('Certificamos que', {
    x: width / 2 - 55, y: height - 185,
    size: 13, font: fontRegular, color: rgb(0.6, 0.6, 0.72),
  })

  const nameWidth = fontBold.widthOfTextAtSize(data.userName, 34)
  page.drawText(data.userName, {
    x: width / 2 - nameWidth / 2, y: height - 235,
    size: 34, font: fontBold, color: rgb(0.94, 0.94, 0.98),
  })

  page.drawLine({
    start: { x: width / 2 - nameWidth / 2 - 10, y: height - 244 },
    end: { x: width / 2 + nameWidth / 2 + 10, y: height - 244 },
    thickness: 0.5, color: rgb(0.54, 0.36, 0.97),
  })

  page.drawText('concluiu com sucesso o curso', {
    x: width / 2 - 100, y: height - 278,
    size: 13, font: fontRegular, color: rgb(0.6, 0.6, 0.72),
  })

  const cursoWidth = fontBold.widthOfTextAtSize(data.trilhaTitulo, 20)
  page.drawText(data.trilhaTitulo, {
    x: width / 2 - cursoWidth / 2, y: height - 315,
    size: 20, font: fontBold, color: rgb(0.67, 0.55, 0.98),
  })

  page.drawLine({
    start: { x: 60, y: height - 360 },
    end: { x: width - 60, y: height - 360 },
    thickness: 0.5, color: rgb(0.54, 0.36, 0.97),
  })

  const dataFormatada = data.emitidoEm.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  page.drawText('Data de emissão', {
    x: 80, y: height - 400, size: 10, font: fontRegular, color: rgb(0.45, 0.45, 0.56),
  })
  page.drawText(dataFormatada, {
    x: 80, y: height - 418, size: 13, font: fontBold, color: rgb(0.75, 0.75, 0.88),
  })

  page.drawText('Código de validação', {
    x: width / 2 - 60, y: height - 400, size: 10, font: fontRegular, color: rgb(0.45, 0.45, 0.56),
  })
  page.drawText(data.hash.substring(0, 16).toUpperCase(), {
    x: width / 2 - 60, y: height - 418, size: 13, font: fontBold, color: rgb(0.75, 0.75, 0.88),
  })

  page.drawText(`Validar em: ${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/cert/${data.hash}`, {
    x: width / 2 - 140, y: 45, size: 9, font: fontRegular, color: rgb(0.35, 0.35, 0.45),
  })

  return await pdfDoc.save()
}
