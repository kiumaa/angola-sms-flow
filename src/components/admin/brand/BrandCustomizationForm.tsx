import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Palette, 
  Type, 
  Layout, 
  Search, 
  Eye, 
  Save,
  Image as ImageIcon,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';

// Google Fonts populares para SMS/Marketing
const GOOGLE_FONTS = [
  { name: 'Inter', category: 'Sans Serif', description: 'Moderno e legível' },
  { name: 'Roboto', category: 'Sans Serif', description: 'Clean e profissional' },
  { name: 'Open Sans', category: 'Sans Serif', description: 'Amigável e versátil' },
  { name: 'Lato', category: 'Sans Serif', description: 'Elegante e funcional' },
  { name: 'Source Sans Pro', category: 'Sans Serif', description: 'Para interfaces' },
  { name: 'Poppins', category: 'Sans Serif', description: 'Geométrica e moderna' },
  { name: 'Nunito', category: 'Sans Serif', description: 'Arredondada e acessível' },
  { name: 'Montserrat', category: 'Sans Serif', description: 'Inspirada em letreiros' },
  { name: 'Playfair Display', category: 'Serif', description: 'Elegante para títulos' },
  { name: 'Merriweather', category: 'Serif', description: 'Ótima para leitura' }
];

// Temas pré-definidos
const PRESET_THEMES = [
  {
    name: 'Angola Classic',
    colors: {
      light_primary: '#DC2626', // Vermelho Angola
      light_secondary: '#FBBF24', // Dourado
      light_bg: '#F9FAFB',
      light_text: '#111827'
    }
  },
  {
    name: 'Professional Blue',
    colors: {
      light_primary: '#2563EB',
      light_secondary: '#64748B',
      light_bg: '#F8FAFC',
      light_text: '#0F172A'
    }
  },
  {
    name: 'Modern Dark',
    colors: {
      light_primary: '#6366F1',
      light_secondary: '#8B5CF6',
      light_bg: '#0F172A',
      light_text: '#F1F5F9'
    }
  },
  {
    name: 'Green Business',
    colors: {
      light_primary: '#059669',
      light_secondary: '#10B981',
      light_bg: '#F0FDF4',
      light_text: '#064E3B'
    }
  }
];

export const BrandCustomizationForm = () => {
  const { settings, updateSettings, uploadFile, loading } = useBrandSettings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('logos');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [fontSearch, setFontSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    site_title: '',
    site_tagline: '',
    light_primary: '#1A1A1A',
    light_secondary: '#666666',
    light_bg: '#F5F6F8',
    light_text: '#1A1A1A',
    dark_primary: '#F5F6F8',
    dark_secondary: '#9CA3AF',
    dark_bg: '#0B0B0C',
    dark_text: '#ECECEC',
    font_family: 'Inter',
    logo_light_url: '',
    logo_dark_url: '',
    favicon_url: '',
    og_image_url: '',
    seo_title: '',
    seo_description: '',
    seo_canonical: '',
    seo_twitter: '@smsao',
    custom_css: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_title: settings.site_title || 'SMS AO',
        site_tagline: settings.site_tagline || '',
        light_primary: settings.light_primary || '#1A1A1A',
        light_secondary: settings.light_secondary || '#666666',
        light_bg: settings.light_bg || '#F5F6F8',
        light_text: settings.light_text || '#1A1A1A',
        dark_primary: settings.dark_primary || '#F5F6F8',
        dark_secondary: settings.dark_secondary || '#9CA3AF',
        dark_bg: settings.dark_bg || '#0B0B0C',
        dark_text: settings.dark_text || '#ECECEC',
        font_family: settings.font_family || 'Inter',
        logo_light_url: settings.logo_light_url || '',
        logo_dark_url: settings.logo_dark_url || '',
        favicon_url: settings.favicon_url || '',
        og_image_url: settings.og_image_url || '',
        seo_title: settings.seo_title || '',
        seo_description: settings.seo_description || '',
        seo_canonical: settings.seo_canonical || '',
        seo_twitter: settings.seo_twitter || '@smsao',
        custom_css: settings.custom_css || ''
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo_light' | 'logo_dark' | 'favicon' | 'og_image') => {
    try {
      setUploading(true);
      const fileType = type.includes('logo') ? 'logo' : type as 'favicon' | 'og_image';
      const url = await uploadFile(file, fileType);
      
      const fieldMap = {
        'logo_light': 'logo_light_url',
        'logo_dark': 'logo_dark_url',
        'favicon': 'favicon_url',
        'og_image': 'og_image_url'
      };
      
      handleInputChange(fieldMap[type], url);
      
      toast({
        title: "Upload concluído",
        description: `${type} foi carregado com sucesso.`
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const applyPresetTheme = (theme: typeof PRESET_THEMES[0]) => {
    setFormData(prev => ({
      ...prev,
      ...theme.colors
    }));
    
    toast({
      title: "Tema aplicado",
      description: `Tema "${theme.name}" foi aplicado.`
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(formData);
      
      toast({
        title: "Configurações salvas",
        description: "Todas as personalizações foram aplicadas com sucesso."
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredFonts = GOOGLE_FONTS.filter(font =>
    font.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
    font.category.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personalização Completa</h1>
          <p className="text-muted-foreground">
            Configure a identidade visual, logos, fontes e temas da sua plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="logos" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logos
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cores
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Fontes
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Avançado
              </TabsTrigger>
            </TabsList>

            {/* Logos Tab */}
            <TabsContent value="logos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Logos e Imagens</CardTitle>
                  <CardDescription>
                    Faça upload dos logos e imagens da sua marca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Claro */}
                  <div className="space-y-3">
                    <Label>Logo Claro (para tema claro)</Label>
                    <div className="flex items-center gap-4">
                      {formData.logo_light_url && (
                        <img
                          src={formData.logo_light_url}
                          alt="Logo claro"
                          className="h-12 w-auto border rounded"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo_light');
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Logo Escuro */}
                  <div className="space-y-3">
                    <Label>Logo Escuro (para tema escuro)</Label>
                    <div className="flex items-center gap-4">
                      {formData.logo_dark_url && (
                        <img
                          src={formData.logo_dark_url}
                          alt="Logo escuro"
                          className="h-12 w-auto border rounded bg-gray-800 p-2"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo_dark');
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-3">
                    <Label>Favicon (ícone do navegador)</Label>
                    <div className="flex items-center gap-4">
                      {formData.favicon_url && (
                        <img
                          src={formData.favicon_url}
                          alt="Favicon"
                          className="h-8 w-8 border rounded"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'favicon');
                        }}
                        disabled={uploading}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recomendado: 32x32px ou 64x64px (PNG/JPG)
                    </p>
                  </div>

                  {/* OG Image */}
                  <div className="space-y-3">
                    <Label>Imagem de Compartilhamento (OG Image)</Label>
                    <div className="flex items-center gap-4">
                      {formData.og_image_url && (
                        <img
                          src={formData.og_image_url}
                          alt="OG Image"
                          className="h-16 w-auto border rounded"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'og_image');
                        }}
                        disabled={uploading}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recomendado: 1200x630px para redes sociais
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temas Pré-definidos</CardTitle>
                  <CardDescription>
                    Escolha um tema base ou personalize suas próprias cores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {PRESET_THEMES.map((theme) => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        onClick={() => applyPresetTheme(theme)}
                        className="h-auto p-4 flex flex-col items-start gap-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex gap-1">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.colors.light_primary }}
                            />
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.colors.light_secondary }}
                            />
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: theme.colors.light_bg }}
                            />
                          </div>
                          <span className="font-medium">{theme.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cores Personalizadas</CardTitle>
                  <CardDescription>
                    Configure as cores principais da sua plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={formData.light_primary}
                          onChange={(e) => handleInputChange('light_primary', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.light_primary}
                          onChange={(e) => handleInputChange('light_primary', e.target.value)}
                          placeholder="#1A1A1A"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={formData.light_secondary}
                          onChange={(e) => handleInputChange('light_secondary', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.light_secondary}
                          onChange={(e) => handleInputChange('light_secondary', e.target.value)}
                          placeholder="#666666"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor de Fundo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={formData.light_bg}
                          onChange={(e) => handleInputChange('light_bg', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.light_bg}
                          onChange={(e) => handleInputChange('light_bg', e.target.value)}
                          placeholder="#F5F6F8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor do Texto</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={formData.light_text}
                          onChange={(e) => handleInputChange('light_text', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.light_text}
                          onChange={(e) => handleInputChange('light_text', e.target.value)}
                          placeholder="#1A1A1A"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fonts Tab */}
            <TabsContent value="fonts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tipografia</CardTitle>
                  <CardDescription>
                    Escolha a fonte perfeita para sua marca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Font Search */}
                  <div className="space-y-2">
                    <Label>Buscar Fontes</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou categoria..."
                        value={fontSearch}
                        onChange={(e) => setFontSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredFonts.map((font) => (
                      <div
                        key={font.name}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.font_family === font.name
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleInputChange('font_family', font.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 
                              className="font-medium text-lg"
                              style={{ fontFamily: font.name }}
                            >
                              {font.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {font.description}
                            </p>
                          </div>
                          <Badge variant="secondary">{font.category}</Badge>
                        </div>
                        <p 
                          className="mt-2 text-base"
                          style={{ fontFamily: font.name }}
                        >
                          Conectando empresas aos seus clientes através de SMS marketing
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Configure o título e descrição da sua plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do Site</Label>
                    <Input
                      value={formData.site_title}
                      onChange={(e) => handleInputChange('site_title', e.target.value)}
                      placeholder="SMS AO"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Slogan/Descrição</Label>
                    <Input
                      value={formData.site_tagline}
                      onChange={(e) => handleInputChange('site_tagline', e.target.value)}
                      placeholder="Conectando empresas aos seus clientes"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Avançado</CardTitle>
                  <CardDescription>
                    Otimize sua presença nos motores de busca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título SEO</Label>
                    <Input
                      value={formData.seo_title}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      placeholder="SMS Marketing Angola - Plataforma Profissional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição SEO</Label>
                    <Textarea
                      value={formData.seo_description}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      placeholder="Plataforma profissional de SMS marketing para empresas angolanas..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL Canônica</Label>
                    <Input
                      value={formData.seo_canonical}
                      onChange={(e) => handleInputChange('seo_canonical', e.target.value)}
                      placeholder="https://smsao.ao"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Twitter/X Handle</Label>
                    <Input
                      value={formData.seo_twitter}
                      onChange={(e) => handleInputChange('seo_twitter', e.target.value)}
                      placeholder="@smsao"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CSS Personalizado</CardTitle>
                  <CardDescription>
                    Adicione estilos CSS personalizados para ajustes avançados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.custom_css}
                    onChange={(e) => handleInputChange('custom_css', e.target.value)}
                    placeholder="/* Adicione seu CSS personalizado aqui */
.custom-button {
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  border: none;
  border-radius: 8px;
}"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Use com cuidado: CSS inválido pode afetar a aparência da plataforma
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'tablet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Visualize suas alterações em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border rounded-lg overflow-hidden transition-all ${
                    previewMode === 'desktop' ? 'w-full h-96' :
                    previewMode === 'tablet' ? 'w-80 h-60 mx-auto' :
                    'w-64 h-80 mx-auto'
                  }`}
                  style={{
                    backgroundColor: formData.light_bg,
                    color: formData.light_text,
                    fontFamily: formData.font_family
                  }}
                >
                  {/* Preview Header */}
                  <div 
                    className="p-4 border-b"
                    style={{ backgroundColor: formData.light_primary }}
                  >
                    {formData.logo_light_url ? (
                      <img
                        src={formData.logo_light_url}
                        alt="Logo"
                        className="h-8 w-auto"
                      />
                    ) : (
                      <div className="text-white font-bold text-lg">
                        {formData.site_title}
                      </div>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 space-y-4">
                    <div>
                      <h1 className="text-xl font-bold" style={{ color: formData.light_text }}>
                        {formData.site_title}
                      </h1>
                      <p className="text-sm opacity-70">
                        {formData.site_tagline}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        className="w-full p-2 rounded text-white text-sm"
                        style={{ backgroundColor: formData.light_primary }}
                      >
                        Enviar SMS
                      </button>
                      <button
                        className="w-full p-2 rounded border text-sm"
                        style={{ 
                          borderColor: formData.light_secondary,
                          color: formData.light_secondary 
                        }}
                      >
                        Ver Contactos
                      </button>
                    </div>

                    <div className="text-xs space-y-1">
                      <p><strong>Font:</strong> {formData.font_family}</p>
                      <p><strong>Primary:</strong> {formData.light_primary}</p>
                      <p><strong>Secondary:</strong> {formData.light_secondary}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};