import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet, Eye, ExternalLink } from 'lucide-react';

interface LivePreviewProps {
  settings: any;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ settings }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getPreviewStyles = () => ({
    backgroundColor: settings.light_bg || '#F5F6F8',
    color: settings.light_text || '#1A1A1A',
    fontFamily: settings.font_family || 'Inter, sans-serif'
  });

  const getPreviewSize = () => {
    switch (viewMode) {
      case 'desktop':
        return 'w-full h-96';
      case 'tablet':
        return 'w-80 h-60 mx-auto';
      case 'mobile':
        return 'w-64 h-80 mx-auto';
      default:
        return 'w-full h-96';
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview em Tempo Real
          </CardTitle>
          <CardDescription>
            Visualize como sua plataforma ficará nos diferentes dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tablet')}
                className="flex items-center gap-2"
              >
                <Tablet className="h-4 w-4" />
                Tablet
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
            </div>
            <Badge variant="secondary">
              {viewMode === 'desktop' ? '1200px+' : 
               viewMode === 'tablet' ? '768px' : '320px'}
            </Badge>
          </div>

          {/* Preview Window */}
          <div className="flex justify-center">
            <div 
              className={`border-2 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${getPreviewSize()}`}
              style={getPreviewStyles()}
            >
              {/* Header Preview */}
              <div 
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ 
                  backgroundColor: settings.light_primary || '#1A1A1A',
                  borderColor: settings.light_secondary || '#666666'
                }}
              >
                {settings.logo_light_url ? (
                  <img
                    src={settings.logo_light_url}
                    alt={settings.site_title || 'Logo'}
                    className="h-6 w-auto"
                  />
                ) : (
                  <div className="text-white font-semibold text-sm">
                    {settings.site_title || 'SMS AO'}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                </div>
              </div>

              {/* Main Content Preview */}
              <div className="p-4 space-y-3">
                {/* Hero Section */}
                <div className="text-center space-y-2">
                  <h1 
                    className="text-lg font-bold"
                    style={{ color: settings.light_text || '#1A1A1A' }}
                  >
                    {settings.site_title || 'SMS AO'}
                  </h1>
                  <p 
                    className="text-xs opacity-70"
                    style={{ color: settings.light_secondary || '#666666' }}
                  >
                    {settings.site_tagline || 'Conectando empresas aos seus clientes'}
                  </p>
                </div>

                {/* Button Samples */}
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-3 rounded text-white text-xs font-medium transition-colors"
                    style={{ backgroundColor: settings.light_primary || '#1A1A1A' }}
                  >
                    Enviar SMS Rápido
                  </button>
                  <button
                    className="w-full py-2 px-3 rounded border text-xs font-medium transition-colors"
                    style={{ 
                      borderColor: settings.light_secondary || '#666666',
                      color: settings.light_secondary || '#666666'
                    }}
                  >
                    Gestão de Contactos
                  </button>
                </div>

                {/* Stats Cards Preview */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div 
                    className="p-2 rounded border"
                    style={{ borderColor: settings.light_secondary + '30' }}
                  >
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: settings.light_primary || '#1A1A1A' }}
                    >
                      158
                    </div>
                    <div className="text-xs opacity-60">SMS Enviados</div>
                  </div>
                  <div 
                    className="p-2 rounded border"
                    style={{ borderColor: settings.light_secondary + '30' }}
                  >
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: settings.light_primary || '#1A1A1A' }}
                    >
                      95%
                    </div>
                    <div className="text-xs opacity-60">Taxa Entrega</div>
                  </div>
                </div>

                {/* Typography Sample */}
                <div className="border-t pt-2 mt-3">
                  <div 
                    className="text-xs"
                    style={{ 
                      fontFamily: settings.font_family || 'Inter',
                      color: settings.light_text || '#1A1A1A'
                    }}
                  >
                    <strong>Font:</strong> {settings.font_family || 'Inter'}<br/>
                    <strong>Primária:</strong> {settings.light_primary || '#1A1A1A'}<br/>
                    <strong>Secundária:</strong> {settings.light_secondary || '#666666'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Marca</CardTitle>
          <CardDescription>
            Informações principais da sua identidade visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da Marca</label>
              <p className="text-sm text-muted-foreground">
                {settings.site_title || 'SMS AO'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Slogan</label>
              <p className="text-sm text-muted-foreground">
                {settings.site_tagline || 'Conectando empresas aos seus clientes'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Paleta de Cores</label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border shadow-sm"
                style={{ backgroundColor: settings.light_primary || '#1A1A1A' }}
                title="Cor Primária"
              />
              <div 
                className="w-8 h-8 rounded border shadow-sm"
                style={{ backgroundColor: settings.light_secondary || '#666666' }}
                title="Cor Secundária"
              />
              <div 
                className="w-8 h-8 rounded border shadow-sm"
                style={{ backgroundColor: settings.light_bg || '#F5F6F8' }}
                title="Cor de Fundo"
              />
              <div 
                className="w-8 h-8 rounded border shadow-sm"
                style={{ backgroundColor: settings.light_text || '#1A1A1A' }}
                title="Cor do Texto"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tipografia</label>
            <p 
              className="text-base mt-1"
              style={{ fontFamily: settings.font_family || 'Inter' }}
            >
              {settings.font_family || 'Inter'} - AaBbCc 123
            </p>
          </div>

          {(settings.logo_light_url || settings.logo_dark_url) && (
            <div>
              <label className="text-sm font-medium">Logos</label>
              <div className="flex items-center gap-4 mt-2">
                {settings.logo_light_url && (
                  <div className="space-y-1">
                    <img
                      src={settings.logo_light_url}
                      alt="Logo Claro"
                      className="h-12 w-auto border rounded p-2"
                    />
                    <p className="text-xs text-muted-foreground">Claro</p>
                  </div>
                )}
                {settings.logo_dark_url && (
                  <div className="space-y-1">
                    <img
                      src={settings.logo_dark_url}
                      alt="Logo Escuro"
                      className="h-12 w-auto border rounded p-2 bg-gray-900"
                    />
                    <p className="text-xs text-muted-foreground">Escuro</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Site Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};