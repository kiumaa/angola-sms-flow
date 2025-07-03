import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Image, Globe } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useToast } from "@/hooks/use-toast";

const AdminBrand = () => {
  const { settings, loading, updateSettings, uploadFile } = useBrandSettings();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewColors, setPreviewColors] = useState({
    primary: settings?.primary_color || 'hsl(262, 83%, 58%)',
    secondary: settings?.secondary_color || 'hsl(346, 77%, 49%)'
  });

  const handleColorChange = (type: 'primary' | 'secondary', color: string) => {
    // Convert hex to HSL
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    const hslValue = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    setPreviewColors(prev => ({ ...prev, [type]: hslValue }));
  };

  const handleSaveColors = async () => {
    setIsUpdating(true);
    try {
      await updateSettings({
        primary_color: previewColors.primary,
        secondary_color: previewColors.secondary
      });
    } catch (error) {
      console.error('Error saving colors:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'favicon' && !file.type.includes('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem PNG ou JPG para o favicon.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const fileUrl = await uploadFile(file, type);
      await updateSettings({ 
        [type === 'logo' ? 'logo_url' : 'favicon_url']: fileUrl 
      });
      
      toast({
        title: `${type === 'logo' ? 'Logo' : 'Favicon'} atualizado`,
        description: "O arquivo foi carregado com sucesso.",
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Convert HSL to hex for color input
  const hslToHex = (hsl: string) => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return '#000000';
    
    const [, h, s, l] = match.map(Number);
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;
    if (hNorm < 1/6) { r = c; g = x; b = 0; }
    else if (hNorm < 2/6) { r = x; g = c; b = 0; }
    else if (hNorm < 3/6) { r = 0; g = c; b = x; }
    else if (hNorm < 4/6) { r = 0; g = x; b = c; }
    else if (hNorm < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Personalização da Marca</h1>
          <p className="text-muted-foreground">
            Personalize as cores, logo e favicon da plataforma
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cores da Marca
              </CardTitle>
              <CardDescription>
                Defina as cores primária e secundária da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={hslToHex(previewColors.primary)}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-20 h-10 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={previewColors.primary}
                    onChange={(e) => setPreviewColors(prev => ({ ...prev, primary: e.target.value }))}
                    placeholder="hsl(262, 83%, 58%)"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={hslToHex(previewColors.secondary)}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-20 h-10 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={previewColors.secondary}
                    onChange={(e) => setPreviewColors(prev => ({ ...prev, secondary: e.target.value }))}
                    placeholder="hsl(346, 77%, 49%)"
                    className="flex-1"
                  />
                </div>
              </div>

              <Button onClick={handleSaveColors} disabled={isUpdating} className="w-full">
                {isUpdating ? "Salvando..." : "Salvar Cores"}
              </Button>

              {/* Color preview */}
              <div className="mt-4 p-4 border rounded-lg">
                <p className="text-sm font-medium mb-2">Prévia das cores:</p>
                <div className="flex gap-2">
                  <div 
                    className="w-12 h-12 rounded border"
                    style={{ backgroundColor: previewColors.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="w-12 h-12 rounded border"
                    style={{ backgroundColor: previewColors.secondary }}
                    title="Cor Secundária"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo & Favicon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo e Favicon
              </CardTitle>
              <CardDescription>
                Faça upload do logo e favicon da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-3">
                <Label htmlFor="logo">Logo da Empresa</Label>
                {settings?.logo_url && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo atual" 
                      className="h-12 w-auto"
                    />
                    <div className="text-sm text-muted-foreground">Logo atual</div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendado: PNG ou JPG, máximo 2MB
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <Label htmlFor="favicon">Favicon</Label>
                {settings?.favicon_url && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <img 
                      src={settings.favicon_url} 
                      alt="Favicon atual" 
                      className="h-8 w-8"
                    />
                    <div className="text-sm text-muted-foreground">Favicon atual</div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="favicon"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="flex-1"
                  />
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendado: PNG 32x32px ou 16x16px
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Prévia da Marca</CardTitle>
            <CardDescription>
              Veja como ficará a aparência da plataforma com suas configurações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-3 mb-4">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Image className="h-4 w-4" />
                  </div>
                )}
                <span className="font-bold text-lg">SMS Marketing Angola</span>
              </div>
              <div className="flex gap-2 mb-4">
                <Button style={{ backgroundColor: previewColors.primary }} className="text-white">
                  Botão Primário
                </Button>
                <Button 
                  variant="outline" 
                  style={{ 
                    borderColor: previewColors.secondary,
                    color: previewColors.secondary 
                  }}
                >
                  Botão Secundário
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBrand;