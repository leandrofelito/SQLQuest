import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — SQLQuest',
  description: 'Leia os Termos de Uso da plataforma SQLQuest antes de criar sua conta.',
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

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      <div className="mx-auto max-w-2xl px-6 py-12 pb-24">
        <p className="mb-6 text-xs text-white/40">
          <Link href="/" className="text-[#a78bfa] hover:underline">
            ← Voltar ao início
          </Link>
        </p>

        <h1 className="mb-1 text-2xl font-bold text-white">Termos de Uso</h1>
        <p className="mb-10 text-sm text-white/45">Última atualização: maio de 2026</p>

        <div className="space-y-8">
          <Section title="1. Aceitação dos Termos">
            <p>
              Ao criar uma conta ou utilizar o SQLQuest, disponível em{' '}
              <strong className="text-white">sqlquest.com.br</strong> e no aplicativo mobile, você
              concorda com estes Termos de Uso e com a Política de Privacidade.
            </p>
            <p>
              Se você não concordar com estes termos, não utilize a plataforma. Podemos atualizar os
              termos periodicamente, e alterações relevantes poderão ser comunicadas por aviso na
              plataforma ou por e-mail.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              SQLQuest é uma plataforma educacional gamificada voltada ao ensino de SQL, com trilhas,
              exercícios, XP, ranking, conquistas, certificados e aplicativo mobile.
            </p>
            <p>
              O serviço possui plano gratuito, que pode conter anúncios, e plano Pro, com benefícios
              adicionais conforme a oferta exibida no momento da compra.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>
              Para usar o SQLQuest você deve ter pelo menos 13 anos. Menores de 18 anos devem usar a
              plataforma com autorização de responsável legal.
            </p>
            <p>
              Você se compromete a fornecer informações verdadeiras, manter seus dados atualizados e
              proteger suas credenciais. Você é responsável pelas atividades realizadas em sua conta.
            </p>
            <p>
              É proibido criar múltiplas contas para burlar limitações, manipular ranking, fraudar
              anúncios, obter benefícios indevidos ou prejudicar outros usuários.
            </p>
          </Section>

          <Section title="4. Uso Aceitável">
            <p>Você concorda em utilizar a plataforma para fins educacionais legítimos. É proibido:</p>
            <ul className="list-inside list-disc space-y-1 text-white/65">
              <li>usar bots, scripts ou automações para acumular XP artificialmente;</li>
              <li>tentar acessar áreas restritas ou dados de outros usuários;</li>
              <li>explorar falhas, contornar anúncios ou mecanismos de pagamento;</li>
              <li>copiar, revender, distribuir ou publicar conteúdo da plataforma sem autorização;</li>
              <li>realizar ataques, varreduras abusivas, engenharia reversa indevida ou ações que afetem a disponibilidade;</li>
              <li>publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros.</li>
            </ul>
          </Section>

          <Section title="5. Propriedade Intelectual">
            <p>
              Textos, exercícios, trilhas, marcas, logotipos, interfaces, código e demais conteúdos
              do SQLQuest pertencem ao SQLQuest ou a seus licenciadores e são protegidos pela
              legislação aplicável.
            </p>
            <p>
              Você recebe uma licença pessoal, limitada, não exclusiva, intransferível e revogável
              para acessar o conteúdo apenas para aprendizado pessoal.
            </p>
          </Section>

          <Section title="6. Anúncios e Consentimento">
            <p>
              O plano gratuito pode exibir anúncios por meio de parceiros como Google AdSense e
              Google AdMob. Cookies e identificadores de publicidade personalizada dependem de
              consentimento quando exigido pela legislação aplicável.
            </p>
            <p>
              Se você recusar publicidade personalizada, algumas experiências com anúncios podem ser
              limitadas, substituídas por espera ou ajustadas para preservar sua escolha de
              privacidade.
            </p>
          </Section>

          <Section title="7. Plano Pro e Pagamentos">
            <p>
              O plano Pro é oferecido mediante pagamento único, salvo se a oferta informar
              expressamente outra condição. Pagamentos são processados pelo Stripe. O SQLQuest não
              armazena dados completos de cartão.
            </p>
            <p>
              Em caso de cobrança indevida, arrependimento aplicável ou problema de acesso, entre em
              contato em{' '}
              <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                suporte@sqlquest.com.br
              </a>
              . O atendimento observará o Código de Defesa do Consumidor e demais normas aplicáveis.
            </p>
            <p>
              O acesso Pro pode depender da continuidade da operação da plataforma, dos fornecedores
              de pagamento e da infraestrutura técnica.
            </p>
          </Section>

          <Section title="8. Ranking e Certificados">
            <p>
              O ranking exibe informações públicas de progresso competitivo, como nickname e XP. Não
              use nickname que revele dados pessoais que você não queira tornar públicos.
            </p>
            <p>
              Certificados são documentos de aprendizado informal. Eles não substituem certificações
              oficiais de empresas, instituições de ensino ou entidades certificadoras.
            </p>
            <p>
              Certificados podem ter link público de verificação com nome, trilha, data e código.
              Compartilhe o link apenas quando desejar tornar essas informações acessíveis.
            </p>
          </Section>

          <Section title="9. Privacidade e LGPD">
            <p>
              O tratamento de dados pessoais é descrito na{' '}
              <Link href="/privacidade" className="text-[#a78bfa] hover:underline">
                Política de Privacidade
              </Link>
              . Pelo perfil, você pode baixar seus dados e acessar canais para solicitar correção,
              exclusão ou outras medidas previstas na LGPD.
            </p>
          </Section>

          <Section title="10. Suspensão e Encerramento">
            <p>
              Podemos suspender ou encerrar contas em caso de violação destes Termos, fraude,
              risco de segurança, ordem legal ou uso abusivo da plataforma.
            </p>
            <p>
              Você pode solicitar o encerramento da conta pelo e-mail{' '}
              <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                suporte@sqlquest.com.br
              </a>
              . A exclusão de dados seguirá a Política de Privacidade e as obrigações legais
              aplicáveis.
            </p>
          </Section>

          <Section title="11. Disponibilidade e Responsabilidade">
            <p>
              O SQLQuest é fornecido conforme disponível. Empregamos esforços razoáveis para manter
              a plataforma funcional, mas não garantimos disponibilidade ininterrupta, ausência total
              de erros ou compatibilidade com todos os dispositivos.
            </p>
            <p>
              Na extensão permitida pela lei, nossa responsabilidade por danos diretos relacionados
              ao serviço fica limitada ao valor pago pelo usuário pelo plano Pro nos últimos 12
              meses, sem prejuízo de direitos irrenunciáveis do consumidor.
            </p>
          </Section>

          <Section title="12. Lei Aplicável e Contato">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica preservado
              o foro legalmente aplicável ao consumidor quando a legislação determinar foro diverso.
            </p>
            <p>
              Dúvidas podem ser enviadas para{' '}
              <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                suporte@sqlquest.com.br
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-xs text-white/30">
          <Link href="/privacidade" className="transition-colors hover:text-white/60">
            Política de Privacidade
          </Link>
          <Link href="/" className="transition-colors hover:text-white/60">
            Início
          </Link>
        </div>
      </div>
    </div>
  )
}
