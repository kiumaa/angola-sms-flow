import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Terms() {
  const [version, setVersion] = useState<string>("1.0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'LEGAL_TERMS_VERSION')
          .maybeSingle();

        if (data && !error) {
          setVersion(data.value);
        }
      } catch (err) {
        console.error('Error fetching terms version:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Termos de Uso</h1>
          <p className="text-muted-foreground">Versão {version} | Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar a plataforma SMS AO, você concorda em estar vinculado a estes 
                Termos de Uso e todas as leis e regulamentações aplicáveis. Se você não concordar 
                com algum destes termos, está proibido de usar ou acessar este site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p>
                O SMS AO é uma plataforma de envio de mensagens SMS em massa que permite aos usuários:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Enviar mensagens SMS para contactos individuais ou grupos</li>
                <li>Gerenciar listas de contactos</li>
                <li>Criar e executar campanhas de marketing via SMS</li>
                <li>Monitorar estatísticas de entrega e engagement</li>
                <li>Configurar Sender IDs personalizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Registro e Conta do Usuário</h2>
              <p>
                Para utilizar determinadas funcionalidades da plataforma, você deve registrar uma conta. 
                Você é responsável por:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Fornecer informações precisas e atualizadas durante o registro</li>
                <li>Manter a confidencialidade das suas credenciais de acesso</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
              <p>Você concorda em NÃO usar a plataforma para:</p>
              <ul className="list-disc pl-6 mt-3">
                <li>Enviar mensagens não solicitadas (SPAM)</li>
                <li>Distribuir conteúdo illegal, ofensivo, difamatório ou prejudicial</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Realizar atividades que possam danificar ou interferir na plataforma</li>
                <li>Usar a plataforma para fins fraudulentos ou enganosos</li>
                <li>Enviar mensagens que violem regulamentações locais de telecomunicações</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Política de Créditos</h2>
              <p>
                O sistema funciona com base em créditos pré-pagos. Cada mensagem SMS enviada 
                consome 1 crédito. Os créditos:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Não possuem prazo de validade</li>
                <li>Não são reembolsáveis após a compra</li>
                <li>Podem ser adquiridos através dos pacotes disponíveis na plataforma</li>
                <li>São debitados apenas para mensagens efetivamente entregues às operadoras</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Privacidade e Proteção de Dados</h2>
              <p>
                Respeitamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais. 
                Para informações detalhadas sobre como coletamos, usamos e protegemos suas informações, 
                consulte nossa <a href="/legal/privacy" className="text-primary hover:underline">Política de Privacidade</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p>
                O SMS AO não será responsável por qualquer dano direto, indireto, incidental, 
                especial ou consequencial resultante do uso ou incapacidade de usar a plataforma, 
                incluindo mas não limitado a:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Falhas na entrega de mensagens devido a problemas das operadoras</li>
                <li>Interrupções temporárias do serviço</li>
                <li>Perda de dados ou informações</li>
                <li>Danos resultantes de ações de terceiros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação na plataforma. O uso continuado 
                da plataforma após tais modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Rescisão</h2>
              <p>
                Podemos suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, 
                caso você viole estes termos de uso. Você também pode encerrar sua conta a 
                qualquer momento através das configurações da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis da República de Angola. Qualquer disputa 
                relacionada a estes termos será resolvida nos tribunais competentes de Angola.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
              <p>
                Se tiver dúvidas sobre estes Termos de Uso, entre em contacto connosco através dos 
                canais de suporte disponíveis na plataforma.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}