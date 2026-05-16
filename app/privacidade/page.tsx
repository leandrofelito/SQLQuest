import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — SQLQuest',
  description: 'Como o SQLQuest coleta, usa e protege seus dados pessoais.',
  robots: { index: true, follow: true },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  )
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      <div className="mx-auto max-w-2xl px-6 py-12 pb-24">
        <p className="mb-6 text-xs text-white/40">
          <Link href="/login" className="text-[#a78bfa] hover:underline">
            ← Voltar ao login
          </Link>
        </p>

        <h1 className="mb-1 text-2xl font-bold text-white">Política de Privacidade</h1>
        <p className="mb-10 text-sm text-white/45">Última atualização: maio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-white/75">
          <Section title="1. Controlador e contato">
            <p>
              O SQLQuest é o controlador dos dados pessoais tratados na plataforma, nos termos da Lei
              nº 13.709/2018, a Lei Geral de Proteção de Dados Pessoais (LGPD).
            </p>
            <p>
              Para dúvidas ou solicitações relacionadas a dados pessoais, fale com o canal de
              privacidade pelo e-mail{' '}
              <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                suporte@sqlquest.com.br
              </a>
              .
            </p>
          </Section>

          <Section title="2. Dados pessoais tratados">
            <p>Podemos tratar os seguintes dados para operar o SQLQuest:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>nome, sobrenome, nickname, e-mail e imagem de perfil quando fornecida pelo login social;</li>
              <li>dados de autenticação, sessões e identificadores de provedores como Google;</li>
              <li>senha em formato criptografado quando o cadastro for por e-mail e senha;</li>
              <li>progresso nas trilhas, XP, ranking, streak, conquistas, certificados e preferências;</li>
              <li>dados de pagamento necessários ao plano Pro, como identificador da sessão Stripe, valor e status;</li>
              <li>dados técnicos como IP, navegador, sistema operacional, logs de acesso e registros de segurança;</li>
              <li>cookies, armazenamento local e identificadores de publicidade quando houver consentimento aplicável.</li>
            </ul>
            <p>
              Não solicitamos dados pessoais sensíveis, como saúde, biometria, religião, opinião
              política, origem racial ou étnica.
            </p>
          </Section>

          <Section title="3. Finalidades e bases legais">
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>
                <strong className="text-white/90">Execução de contrato:</strong> criar conta,
                autenticar usuários, registrar progresso, emitir certificados e entregar o plano Pro.
              </li>
              <li>
                <strong className="text-white/90">Cumprimento de obrigação legal:</strong> manter
                registros fiscais, contábeis, solicitações de titulares e informações necessárias à
                defesa de direitos.
              </li>
              <li>
                <strong className="text-white/90">Legítimo interesse:</strong> segurança,
                prevenção de fraude, rate limit, melhoria da plataforma e suporte ao usuário.
              </li>
              <li>
                <strong className="text-white/90">Consentimento:</strong> cookies e identificadores
                usados para publicidade personalizada e mensuração de anúncios.
              </li>
            </ul>
          </Section>

          <Section title="4. Cookies e publicidade">
            <p>
              Cookies essenciais e armazenamento local são usados para login, idioma, preferências,
              segurança e funcionamento da plataforma. Esses recursos são necessários para prestar o
              serviço.
            </p>
            <p>
              Cookies e identificadores de publicidade do Google AdSense, Google AdMob ou serviços
              equivalentes só devem ser ativados após o seu consentimento. Você pode recusar a
              publicidade personalizada e continuar usando a conta com os cookies essenciais.
            </p>
            <p>
              O Google pode tratar dados de publicidade conforme suas próprias políticas. Saiba mais
              em{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-[#a78bfa] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Políticas de publicidade do Google
              </a>
              .
            </p>
          </Section>

          <Section title="5. Compartilhamento com fornecedores">
            <p>Não vendemos seus dados pessoais. Podemos compartilhar dados apenas quando necessário com:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Google, para login social, AdSense/AdMob e serviços relacionados;</li>
              <li>Stripe, para processamento de pagamentos do plano Pro;</li>
              <li>Resend, para envio de e-mails transacionais, como verificação de conta;</li>
              <li>Cloudflare, para DNS, túnel, segurança e entrega do site;</li>
              <li>provedores de hospedagem, banco de dados, backups e infraestrutura técnica;</li>
              <li>autoridades públicas, quando houver obrigação legal, ordem judicial ou defesa de direitos.</li>
            </ul>
          </Section>

          <Section title="6. Ranking e certificados públicos">
            <p>
              O ranking global exibe nickname, XP e informações de progresso competitivo. O e-mail
              não é exibido no ranking público.
            </p>
            <p>
              Certificados possuem link público de verificação. Ao gerar ou compartilhar um
              certificado, o nome associado à conta, a trilha concluída, a data e o código de
              validação podem ficar visíveis para quem tiver o link.
            </p>
          </Section>

          <Section title="7. Retenção, backups e exclusão">
            <p>
              Mantemos os dados enquanto a conta estiver ativa ou pelo período necessário para
              cumprir as finalidades desta política, obrigações legais, prevenção de fraude, suporte
              e defesa de direitos.
            </p>
            <p>
              Pagamentos e registros associados podem ser mantidos pelo prazo legal aplicável.
              Backups podem reter dados por período limitado até sua substituição ou expiração
              operacional.
            </p>
            <p>
              Após solicitação válida de exclusão, dados de conta e progresso serão removidos ou
              anonimizados, salvo quando a retenção for necessária por obrigação legal ou exercício
              regular de direitos.
            </p>
          </Section>

          <Section title="8. Segurança">
            <p>
              Adotamos medidas técnicas e administrativas para proteger dados pessoais contra acesso
              não autorizado, perda, alteração ou divulgação indevida, incluindo HTTPS, controle de
              acesso, senhas criptografadas, rate limit e restrição de acesso ao banco de dados.
            </p>
            <p>
              Nenhuma operação digital é livre de risco. Em caso de incidente de segurança que possa
              causar risco ou dano relevante, avaliaremos o caso e comunicaremos a ANPD e os
              titulares afetados conforme a legislação aplicável.
            </p>
          </Section>

          <Section title="9. Direitos do titular">
            <p>Você pode solicitar, nos termos da LGPD:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>confirmação da existência de tratamento;</li>
              <li>acesso aos dados pessoais;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>portabilidade, quando aplicável;</li>
              <li>informações sobre compartilhamento de dados;</li>
              <li>revogação do consentimento e oposição a tratamentos cabíveis.</li>
            </ul>
            <p>
              Acesse a área de Privacidade no perfil para baixar seus dados ou envie uma solicitação
              para{' '}
              <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                suporte@sqlquest.com.br
              </a>
              . Solicitações de acesso e confirmação serão respondidas nos prazos previstos pela
              LGPD.
            </p>
          </Section>

          <Section title="10. Alterações">
            <p>
              Esta política pode ser atualizada para refletir mudanças no produto, nos fornecedores,
              na legislação ou nas práticas de segurança. Alterações relevantes poderão ser
              comunicadas por aviso na plataforma ou e-mail cadastrado.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
