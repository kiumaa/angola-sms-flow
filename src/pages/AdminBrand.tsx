import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useTheme } from 'next-themes';
import { Palette } from 'lucide-react';

const AdminBrand = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState('#1A1A1A');

  const handleSaveColor = () => {
    // Para futuras implementações de cores personalizadas
    toast({
      title: "Cor salva",
      description: `Cor primária definida para ${primaryColor}`,
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-h1 font-light tracking-tight">Personalização</h1>
        <p className="text-muted-foreground font-light">
          Configure a aparência da plataforma SMS Marketing Angola
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Modo de Tema */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-h3 font-light flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-600" />
              Modo de Tema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">Modo Dark</Label>
                <p className="text-xs text-muted-foreground font-light">
                  Ativa o tema escuro sofisticado (recomendado)
                </p>
              </div>
              <ThemeToggle />
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-light">Tema atual:</span>
                <span className="text-sm font-medium capitalize">
                  {theme === 'dark' ? 'Dark (Elegante)' : 'Light (Clássico)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cor Primária */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-h3 font-light flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-600" />
              Cor Primária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-normal">Cor Principal</Label>
              <div className="flex space-x-3 items-center">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 rounded-minimal border-0 bg-transparent p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1A1A1A"
                  className="flex-1 rounded-minimal border-border font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground font-light">
                Cinza escuro sofisticado para interface elegante
              </p>
            </div>

            <Button 
              onClick={handleSaveColor}
              className="w-full rounded-minimal font-light"
              variant="outline"
            >
              Salvar Cor
            </Button>
          </CardContent>
        </Card>

        {/* Prévia do Design */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-h3 font-light">Prévia do Design</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-minimal border border-border bg-background/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-light">Interface de Exemplo</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-minimal bg-card/50 border border-border">
                  <div className="text-xs text-muted-foreground font-light mb-1">Métricas</div>
                  <div className="text-lg font-light">1,234</div>
                </div>
                <div className="p-3 rounded-minimal bg-primary text-primary-foreground">
                  <div className="text-xs opacity-90 font-light mb-1">Principal</div>
                  <div className="text-lg font-light">Button</div>
                </div>
                <div className="p-3 rounded-minimal bg-muted">
                  <div className="text-xs text-muted-foreground font-light mb-1">Secundário</div>
                  <div className="text-sm font-light">Content</div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground font-light">
                Design clean e minimalista com foco na usabilidade e elegância
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBrand;