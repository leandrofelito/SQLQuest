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
      <div className="text-sm leading-relaxed text-white/75 space-y-3">{children}</div>
    </section>
  )
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        <p className="text-xs text-white/40 mb-6">
          <Link href="/" className="text-[#a78bfa] hover:underline">
            ← Voltar ao início
          </Link>
        </p>

        <h1 className="text-2xl font-bold text-white mb-1">Termos de Uso</h1>
        <p className="text-sm text-white/45 mb-10">Última atualização: abril de 2026</p>

        <div className="space-y-8">
          <Section title="1. Aceitação dos Termos">
            <p>
              Ao criar uma conta ou utilizar a plataforma SQLQuest, disponível em <strong className="text-white">sqlquest.com.br</strong> e no aplicativo mobile, você concorda com estes Termos de Uso. Se não concordar com alguma cláusula, não utilize o serviço.
            </p>
            <p>
              Estes termos constituem um contrato vinculante entre você (usuário) e SQLQuest. Podemos atualizá-los periodicamente; a continuidade do uso após notificação de mudança implica aceitação dos termos revisados.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              SQLQuest é uma plataforma educacional gamificada voltada ao ensino da linguagem SQL. A plataforma oferece:
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/65">
              <li>21+ trilhas de aprendizado progressivas (do básico ao avançado)</li>
              <li>Exercícios práticos de múltipla escolha e código</li>
              <li>Sistema de pontos de experiência (XP), níveis e conquistas</li>
              <li>Ranking global de usuários</li>
              <li>Certificados de conclusão verificáveis por link público</li>
              <li>Aplicativo mobile para Android</li>
            </ul>
            <p>
              O serviço está disponível em um plano gratuito (com acesso limitado às trilhas iniciais e com exibição de anúncios) e em um plano Pro (acesso completo, sem anúncios, mediante pagamento único).
            </p>
          </Section>

          <Section title="3. Elegibilidade e Cadastro">
            <p>
              Para usar o SQLQuest você deve ter no mínimo 13 anos de idade. Menores de 18 anos devem ter consentimento de um responsável legal para criar uma conta.
            </p>
            <p>
              Ao se cadastrar, você se compromete a fornecer informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
            <p>
              É vedado criar múltiplas contas com o objetivo de burlar restrições do plano gratuito ou manipular o sistema de ranking.
            </p>
          </Section>

          <Section title="4. Uso Aceitável">
            <p>Você concorda em utilizar a plataforma exclusivamente para fins educacionais legítimos. É expressamente proibido:</p>
            <ul className="list-disc list-inside space-y-1 text-white/65">
              <li>Usar bots, scripts ou automações para completar lições ou acumular XP artificialmente</li>
              <li>Tentar acessar áreas restritas da plataforma ou dados de outros usuários</li>
              <li>Reproduzir, distribuir ou vender o conteúdo das trilhas sem autorização escrita</li>
              <li>Publicar conteúdo ofensivo, difamatório ou ilegal em qualquer área da plataforma</li>
              <li>Realizar engenharia reversa, descompilar ou extrair o código-fonte da plataforma</li>
              <li>Realizar ataques de negação de serviço (DoS/DDoS) ou qualquer ação que prejudique a disponibilidade do serviço</li>
            </ul>
          </Section>

          <Section title="5. Propriedade Intelectual">
            <p>
              Todo o conteúdo da plataforma — incluindo textos das trilhas, exercícios, explicações, design, logotipo e código — é de propriedade exclusiva do SQLQuest e está protegido pela Lei de Direitos Autorais brasileira (Lei nº 9.610/98).
            </p>
            <p>
              É concedida ao usuário uma licença pessoal, não exclusiva, intransferível e revogável para acessar e utilizar o conteúdo exclusivamente para aprendizado pessoal. Qualquer outro uso requer autorização prévia por escrito.
            </p>
          </Section>

          <Section title="6. Plano Gratuito e Exibição de Anúncios">
            <p>
              No plano gratuito, o SQLQuest exibe anúncios veiculados pelo Google AdSense para sustentar a operação da plataforma. Os anúncios são apresentados em momentos específicos da navegação e nunca interferem diretamente nos exercícios em andamento.
            </p>
            <p>
              Ao utilizar o plano gratuito, você consente com a exibição desses anúncios. Para uma experiência sem anúncios, o plano Pro está disponível mediante pagamento único.
            </p>
          </Section>

          <Section title="7. Plano Pro e Pagamentos">
            <p>
              O plano Pro é oferecido mediante pagamento único, sem mensalidades ou cobranças recorrentes. O acesso é vitalício — enquanto a plataforma estiver operacional, você terá acesso aos benefícios contratados.
            </p>
            <p>
              Os pagamentos são processados de forma segura pelo Stripe. O SQLQuest não armazena dados de cartão de crédito. Em caso de cobrança indevida, entre em contato em <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">suporte@sqlquest.com.br</a> em até 7 dias corridos para solicitação de estorno.
            </p>
            <p>
              O SQLQuest se reserva o direito de alterar o preço do plano Pro para novas compras a qualquer momento, sem afetar usuários que já adquiriram o plano.
            </p>
          </Section>

          <Section title="8. Certificados">
            <p>
              Os certificados emitidos pelo SQLQuest atestam a conclusão das trilhas de aprendizado na plataforma. Eles são gerados automaticamente após a conclusão de todos os módulos de uma trilha e podem ser verificados publicamente pelo link único contido no documento.
            </p>
            <p>
              Os certificados do SQLQuest são documentos de aprendizado informal e não substituem certificações profissionais oficiais de entidades como Oracle, Microsoft ou outras organizações de certificação reconhecidas no mercado.
            </p>
          </Section>

          <Section title="9. Suspensão e Encerramento de Conta">
            <p>
              O SQLQuest pode suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, caso identifique violações destes Termos de Uso. Em caso de encerramento por nosso ato sem justa causa, usuários Pro terão direito a reembolso proporcional.
            </p>
            <p>
              Você pode encerrar sua conta a qualquer momento enviando uma solicitação para <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">suporte@sqlquest.com.br</a>. O encerramento da conta resulta na exclusão permanente de seus dados conforme nossa Política de Privacidade.
            </p>
          </Section>

          <Section title="10. Limitação de Responsabilidade">
            <p>
              O SQLQuest é fornecido "no estado em que se encontra" (<em>as is</em>). Não garantimos disponibilidade ininterrupta, ausência de erros ou que o conteúdo atenda a requisitos específicos de certificações externas.
            </p>
            <p>
              Em nenhuma hipótese o SQLQuest será responsável por danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso da plataforma, incluindo perda de dados de progresso por falhas técnicas.
            </p>
            <p>
              Nossa responsabilidade total perante você, em qualquer circunstância, fica limitada ao valor pago pelo plano Pro nos últimos 12 meses.
            </p>
          </Section>

          <Section title="11. Legislação Aplicável">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste instrumento, ressalvadas as situações em que a legislação brasileira determinar foro diverso em favor do consumidor.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/65">
              <li>E-mail: <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">suporte@sqlquest.com.br</a></li>
              <li>Site: <Link href="/" className="text-[#a78bfa] hover:underline">sqlquest.com.br</Link></li>
            </ul>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
          <Link href="/privacidade" className="hover:text-white/60 transition-colors">Política de Privacidade</Link>
          <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
        </div>
      </div>
    </div>
  )
}
