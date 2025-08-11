import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Privacy() {
  const [version, setVersion] = useState<string>("1.0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'LEGAL_PRIVACY_VERSION')
          .maybeSingle();

        if (data && !error) {
          setVersion(data.value);
        }
      } catch (err) {
        console.error('Error fetching privacy version:', err);
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
          <h1 className="text-4xl font-bold text-primary mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground">Versão {version} | Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p>
                Esta Política de Privacidade descreve como o SMS AO coleta, usa, armazena e protege 
                as suas informações pessoais quando você utiliza nossa plataforma de envio de 
                mensagens SMS. Estamos comprometidos em proteger a sua privacidade e garantir a 
                segurança dos seus dados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-medium mb-3">2.1 Informações de Conta</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>Informações de faturação e pagamento</li>
                <li>Palavra-passe (armazenada de forma criptografada)</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Dados de Uso da Plataforma</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Listas de contactos e números de telefone</li>
                <li>Conteúdo das mensagens SMS enviadas</li>
                <li>Estatísticas de entrega e engagement</li>
                <li>Historico de campanhas e transações</li>
                <li>Configurações da conta e preferências</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Informações Técnicas</h3>
              <ul className="list-disc pl-6">
                <li>Endereço IP e localização geográfica</li>
                <li>Tipo de dispositivo e navegador</li>
                <li>Dados de log de acesso e uso</li>
                <li>Cookies e tecnologias de rastreamento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Como Usamos as Suas Informações</h2>
              <p>Utilizamos as suas informações para:</p>
              <ul className="list-disc pl-6 mt-3">
                <li>Fornecer e manter os serviços da plataforma SMS AO</li>
                <li>Processar e entregar mensagens SMS aos destinatários</li>
                <li>Gerenciar a sua conta e autenticação</li>
                <li>Processar pagamentos e faturação</li>
                <li>Fornecer suporte técnico e atendimento ao cliente</li>
                <li>Melhorar a funcionalidade e experiência da plataforma</li>
                <li>Enviar notificações importantes sobre a conta</li>
                <li>Cumprir obrigações legais e regulamentares</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
              <p>
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                exceto nas seguintes circunstâncias:
              </p>
              
              <h3 className="text-xl font-medium mb-3">4.1 Prestadores de Serviços</h3>
              <p>
                Compartilhamos informações com prestadores de serviços terceirizados que nos 
                ajudam a operar a plataforma, incluindo:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Operadoras de telecomunicações para entrega de SMS</li>
                <li>Processadores de pagamento</li>
                <li>Serviços de hospedagem e infraestrutura</li>
                <li>Serviços de análise e monitoramento</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">4.2 Requisitos Legais</h3>
              <p>
                Podemos divulgar informações quando exigido por lei, ordem judicial ou 
                para proteger os direitos, propriedade ou segurança da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger 
                suas informações contra acesso não autorizado, alteração, divulgação ou destruição:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e planos de recuperação</li>
                <li>Auditoria e testes de segurança periódicos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Retenção de Dados</h2>
              <p>
                Mantemos suas informações pessoais pelo tempo necessário para fornecer 
                os serviços e cumprir nossas obrigações legais:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Dados da conta: Mantidos enquanto a conta estiver ativa</li>
                <li>Mensagens SMS: Armazenadas por até 2 anos para fins de auditoria</li>
                <li>Dados de faturação: Mantidos conforme requisitos fiscais locais</li>
                <li>Logs de sistema: Mantidos por até 1 ano para fins de segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Os Seus Direitos</h2>
              <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
              <ul className="list-disc pl-6 mt-3">
                <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
                <li><strong>Retificação:</strong> Corrigir dados imprecisos ou incompletos</li>
                <li><strong>Eliminação:</strong> Solicitar a exclusão dos seus dados</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento dos seus dados</li>
                <li><strong>Limitação:</strong> Restringir o processamento dos seus dados</li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer destes direitos, entre em contacto através dos 
                canais de suporte disponíveis na plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies e tecnologias similares para melhorar a funcionalidade 
                da plataforma e sua experiência de usuário:
              </p>
              <ul className="list-disc pl-6 mt-3">
                <li>Cookies essenciais para funcionamento da plataforma</li>
                <li>Cookies de preferências para lembrar das suas configurações</li>
                <li>Cookies de análise para entender como você usa a plataforma</li>
              </ul>
              <p className="mt-3">
                Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Transferências Internacionais</h2>
              <p>
                Seus dados podem ser transferidos e processados em servidores localizados 
                fora de Angola. Garantimos que qualquer transferência internacional é realizada 
                com salvaguardas adequadas para proteger seus dados pessoais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre mudanças significativas através da plataforma ou por e-mail. O uso 
                continuado da plataforma após tais alterações constitui aceitação da nova política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
              <p>
                Se tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                os seus dados pessoais, entre em contacto connosco através dos canais de 
                suporte disponíveis na plataforma ou envie um e-mail para nosso departamento 
                de privacidade.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}