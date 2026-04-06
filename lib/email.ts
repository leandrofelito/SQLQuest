import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'SQLQuest <noreply@sqlquest.com.br>'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return // silently skip if not configured

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Bem-vindo ao SQLQuest! 🔍',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao SQLQuest</title>
</head>
<body style="margin:0;padding:0;background:#080a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0f1117;border-radius:16px;border:1px solid #2a2d3a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1e1040,#0f1117);">
              <p style="margin:0 0 8px;font-size:40px;">🔍</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">
                <span style="color:#a78bfa;">SQL</span>Quest
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.4);">Aprenda SQL do básico ao avançado</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Olá, ${name}! 👋</h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">
                Sua conta foi criada com sucesso. Agora você tem acesso às trilhas de aprendizado de SQL mais gamificadas da internet!
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">
                Comece sua jornada agora e acumule XP, mantenha seu streak diário e ganhe certificados ao concluir cada trilha.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/home"
                       style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;margin-bottom:24px;">
                      Começar a aprender →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Stats -->
              <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #2a2d3a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;text-align:center;border-right:1px solid #2a2d3a;">
                    <p style="margin:0 0 4px;font-size:24px;">🔥</p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Streak diário</p>
                  </td>
                  <td style="padding:16px;text-align:center;border-right:1px solid #2a2d3a;">
                    <p style="margin:0 0 4px;font-size:24px;">⚡</p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">XP por etapa</p>
                  </td>
                  <td style="padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:24px;">🏅</p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Certificados</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #1e2028;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
                Você recebeu este email porque criou uma conta no SQLQuest.<br />
                © ${new Date().getFullYear()} SQLQuest. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
