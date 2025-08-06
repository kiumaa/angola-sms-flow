import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, MessageSquare, TrendingUp, Bell, Settings } from 'lucide-react';

interface LivePreviewProps {
  settings: any;
}

export const LivePreview = ({ settings }: LivePreviewProps) => {
  const customStyles = {
    '--preview-primary': settings.primary_color,
    '--preview-secondary': settings.secondary_color,
    '--preview-background': settings.background_color,
    '--preview-text': settings.text_color,
    '--preview-font-family': settings.font_family,
    '--preview-font-weight': settings.font_weight,
    '--preview-h1-size': settings.font_sizes?.h1,
    '--preview-h2-size': settings.font_sizes?.h2,
    '--preview-h3-size': settings.font_sizes?.h3,
    '--preview-body-size': settings.font_sizes?.body,
    '--preview-line-height': settings.line_height,
    '--preview-letter-spacing': settings.letter_spacing,
  } as React.CSSProperties;

  return (
    <div 
      className="p-6 rounded-lg border bg-background min-h-screen"
      style={customStyles}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .preview-container * {
            font-family: var(--preview-font-family), sans-serif !important;
            font-weight: var(--preview-font-weight) !important;
            line-height: var(--preview-line-height) !important;
            letter-spacing: var(--preview-letter-spacing) !important;
          }
          .preview-container {
            background: var(--preview-background) !important;
            color: var(--preview-text) !important;
          }
          .preview-h1 { font-size: var(--preview-h1-size) !important; }
          .preview-h2 { font-size: var(--preview-h2-size) !important; }
          .preview-h3 { font-size: var(--preview-h3-size) !important; }
          .preview-body { font-size: var(--preview-body-size) !important; }
          .preview-primary-bg { background: var(--preview-primary) !important; }
          .preview-secondary-bg { background: var(--preview-secondary) !important; }
          .preview-primary-text { color: var(--preview-primary) !important; }
          .preview-border { border-color: var(--preview-text) !important; opacity: 0.2; }
        `
      }} />
      
      <div className="preview-container space-y-6">
        {/* Header Simulation */}
        <header className="flex items-center justify-between pb-4 border-b preview-border">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-auto" />
            ) : (
              <Mail className="h-8 w-8 preview-primary-text" />
            )}
            <div>
              <h1 className="preview-h2 font-bold">{settings.site_title || 'SMS AO'}</h1>
              <p className="text-xs text-muted-foreground">{settings.site_subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="preview-primary-bg text-white">
              Dashboard
            </Button>
            <Button size="sm" variant="outline" className="preview-border">
              Configurações
            </Button>
          </div>
        </header>

        {/* Dashboard Simulation */}
        <div className="space-y-6">
          <div>
            <h2 className="preview-h1 font-bold mb-2">Dashboard Principal</h2>
            <p className="preview-body text-muted-foreground">
              Visão geral das suas campanhas de SMS marketing
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="preview-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SMS Enviados</p>
                    <p className="preview-h2 font-bold preview-primary-text">1,234</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="preview-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contatos</p>
                    <p className="preview-h2 font-bold preview-primary-text">5,678</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="preview-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                    <p className="preview-h2 font-bold preview-primary-text">98.5%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="preview-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                    <p className="preview-h2 font-bold preview-primary-text">12</p>
                  </div>
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="preview-border">
                <CardHeader>
                  <CardTitle className="preview-h3">Campanhas Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded preview-secondary-bg bg-opacity-10">
                    <div>
                      <h4 className="preview-h3 font-medium">Promoção Black Friday</h4>
                      <p className="text-sm text-muted-foreground">Enviado para 2,500 contatos</p>
                    </div>
                    <Badge variant="secondary">Enviado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border preview-border">
                    <div>
                      <h4 className="preview-h3 font-medium">Newsletter Semanal</h4>
                      <p className="text-sm text-muted-foreground">Agendado para amanhã</p>
                    </div>
                    <Badge variant="outline">Agendado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border preview-border">
                    <div>
                      <h4 className="preview-h3 font-medium">Lembrete de Pagamento</h4>
                      <p className="text-sm text-muted-foreground">Em rascunho</p>
                    </div>
                    <Badge variant="secondary">Rascunho</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="preview-border">
                <CardHeader>
                  <CardTitle className="preview-h3">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start preview-primary-bg text-white">
                    <Mail className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                  <Button variant="outline" className="w-full justify-start preview-border">
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Contatos
                  </Button>
                  <Button variant="outline" className="w-full justify-start preview-border">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Relatórios
                  </Button>
                  <Button variant="outline" className="w-full justify-start preview-border">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </CardContent>
              </Card>

              <Card className="preview-border mt-4">
                <CardHeader>
                  <CardTitle className="preview-h3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded preview-secondary-bg bg-opacity-10">
                    <p className="text-sm font-medium">Campanha concluída</p>
                    <p className="text-xs text-muted-foreground">
                      "Promoção Black Friday" foi enviada com sucesso
                    </p>
                  </div>
                  <div className="p-3 rounded border preview-border">
                    <p className="text-sm font-medium">Créditos baixos</p>
                    <p className="text-xs text-muted-foreground">
                      Você tem apenas 50 créditos restantes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Custom CSS Preview */}
        {settings.custom_css && (
          <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
        )}
      </div>
    </div>
  );
};