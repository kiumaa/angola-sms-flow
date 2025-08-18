import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  Palette, 
  Type, 
  Image, 
  Globe, 
  Settings,
  Save,
  Eye,
  Upload,
  RefreshCw
} from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter',
  'Sora', 
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Raleway',
  'PT Sans',
  'Lora'
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' }
];

export const BrandCustomizationForm = () => {
  const { settings, loading, updateSettings, uploadFile } = useBrandSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    primary_color: 'hsl(262, 83%, 58%)',
    secondary_color: 'hsl(346, 77%, 49%)',
    background_color: 'hsl(220, 14%, 96%)',
    text_color: 'hsl(220, 39%, 11%)',
    font_family: 'Inter',
    font_weight: '300',
    font_sizes: {
      h1: '1.75rem',
      h2: '1.25rem',
      h3: '1rem',
      body: '1rem',
      small: '0.875rem'
    },
    line_height: '1.5',
    letter_spacing: '-0.01em',
    site_title: 'SMS AO',
    site_subtitle: 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
    meta_title_template: '{{page}} · {{siteTitle}}',
    meta_description: 'Plataforma de SMS Marketing para Angola',
    og_title: '',
    og_description: '',
    robots_index: true,
    robots_follow: true,
    theme_mode: 'system',
    custom_css: '',
    logo_url: '',
    favicon_url: '',
    og_image_url: ''
  });

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setFormData({
        primary_color: settings.primary_color || 'hsl(262, 83%, 58%)',
        secondary_color: settings.secondary_color || 'hsl(346, 77%, 49%)',
        background_color: settings.background_color || 'hsl(220, 14%, 96%)',
        text_color: settings.text_color || 'hsl(220, 39%, 11%)',
        font_family: settings.font_family || 'Inter',
        font_weight: settings.font_weight || '300',
        font_sizes: settings.font_sizes || {
          h1: '1.75rem',
          h2: '1.25rem',
          h3: '1rem',
          body: '1rem',
          small: '0.875rem'
        },
        line_height: settings.line_height || '1.5',
        letter_spacing: settings.letter_spacing || '-0.01em',
        site_title: settings.site_title || 'SMS AO',
        site_subtitle: settings.site_subtitle || 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
        meta_title_template: settings.meta_title_template || '{{page}} · {{siteTitle}}',
        meta_description: settings.meta_description || 'Plataforma de SMS Marketing para Angola',
        og_title: settings.og_title || '',
        og_description: settings.og_description || '',
        robots_index: settings.robots_index ?? true,
        robots_follow: settings.robots_follow ?? true,
        theme_mode: settings.theme_mode || 'system',
        custom_css: settings.custom_css || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        og_image_url: settings.og_image_url || ''
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFontSizeChange = (type: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      font_sizes: {
        ...prev.font_sizes,
        [type]: value
      }
    }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'og_image') => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file, type);
      
      if (type === 'logo') {
        handleInputChange('logo_url', url);
      } else if (type === 'favicon') {
        handleInputChange('favicon_url', url);
      } else if (type === 'og_image') {
        handleInputChange('og_image_url', url);
      }
      
      toast({
        title: "Upload realizado",
        description: `${type === 'logo' ? 'Logotipo' : type === 'favicon' ? 'Favicon' : 'Imagem OG'} carregado com sucesso.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateSettings(formData);
      
      toast({
        title: "Configurações salvas",
        description: "Todas as personalizações foram aplicadas com sucesso.",
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-light tracking-tight">Personalização Completa</h1>
          <p className="text-muted-foreground font-light">
            Configure toda a identidade visual e SEO da plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={togglePreview}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Editar' : 'Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Tudo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Tipografia
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Mídia
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Visual Identity */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Identidade da Marca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título do Site</Label>
                  <Input
                    value={formData.site_title}
                    onChange={(e) => handleInputChange('site_title', e.target.value)}
                    placeholder="SMS AO"
                  />
                </div>
                <div>
                  <Label>Subtítulo/Tagline</Label>
                  <Textarea
                    value={formData.site_subtitle}
                    onChange={(e) => handleInputChange('site_subtitle', e.target.value)}
                    placeholder="Conectando empresas aos seus clientes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Paleta de Cores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={formData.primary_color.includes('hsl') ? '#8B5CF6' : formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        placeholder="hsl(262, 83%, 58%)"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={formData.secondary_color.includes('hsl') ? '#EC4899' : formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="hsl(346, 77%, 49%)"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor de Fundo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={formData.background_color.includes('hsl') ? '#F8FAFC' : formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        placeholder="hsl(220, 14%, 96%)"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={formData.text_color.includes('hsl') ? '#1F2937' : formData.text_color}
                        onChange={(e) => handleInputChange('text_color', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => handleInputChange('text_color', e.target.value)}
                        placeholder="hsl(220, 39%, 11%)"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Configuração de Fonte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Fonte Principal</Label>
                  <Select value={formData.font_family} onValueChange={(value) => handleInputChange('font_family', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peso Padrão</Label>
                  <Select value={formData.font_weight} onValueChange={(value) => handleInputChange('font_weight', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map(weight => (
                        <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Line Height</Label>
                  <Input
                    value={formData.line_height}
                    onChange={(e) => handleInputChange('line_height', e.target.value)}
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <Label>Letter Spacing</Label>
                  <Input
                    value={formData.letter_spacing}
                    onChange={(e) => handleInputChange('letter_spacing', e.target.value)}
                    placeholder="-0.01em"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Tamanhos de Texto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>H1 - Títulos Principais</Label>
                  <Input
                    value={formData.font_sizes.h1}
                    onChange={(e) => handleFontSizeChange('h1', e.target.value)}
                    placeholder="1.75rem"
                  />
                </div>
                <div>
                  <Label>H2 - Subtítulos</Label>
                  <Input
                    value={formData.font_sizes.h2}
                    onChange={(e) => handleFontSizeChange('h2', e.target.value)}
                    placeholder="1.25rem"
                  />
                </div>
                <div>
                  <Label>H3 - Seções</Label>
                  <Input
                    value={formData.font_sizes.h3}
                    onChange={(e) => handleFontSizeChange('h3', e.target.value)}
                    placeholder="1rem"
                  />
                </div>
                <div>
                  <Label>Body - Texto Padrão</Label>
                  <Input
                    value={formData.font_sizes.body}
                    onChange={(e) => handleFontSizeChange('body', e.target.value)}
                    placeholder="1rem"
                  />
                </div>
                <div>
                  <Label>Small - Texto Pequeno</Label>
                  <Input
                    value={formData.font_sizes.small}
                    onChange={(e) => handleFontSizeChange('small', e.target.value)}
                    placeholder="0.875rem"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Media Assets */}
        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Logotipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  accept="image/*"
                  maxSize={2}
                  onFileSelect={(file) => handleFileUpload(file, 'logo')}
                  selectedFile={null}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">Upload do Logo</p>
                    <p className="text-xs text-muted-foreground">SVG/PNG até 5MB</p>
                  </div>
                </FileUpload>
                {formData.logo_url && (
                  <div className="text-center">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo preview" 
                      className="h-16 w-auto mx-auto rounded border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Preview atual</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Favicon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  accept="image/*"
                  maxSize={1}
                  onFileSelect={(file) => handleFileUpload(file, 'favicon')}
                  selectedFile={null}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">Upload do Favicon</p>
                    <p className="text-xs text-muted-foreground">PNG até 1MB</p>
                  </div>
                </FileUpload>
                {formData.favicon_url && (
                  <div className="text-center">
                    <img 
                      src={formData.favicon_url} 
                      alt="Favicon preview" 
                      className="h-8 w-8 mx-auto rounded border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Preview atual</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Open Graph</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  accept="image/*"
                  maxSize={2}
                  onFileSelect={(file) => handleFileUpload(file, 'og_image')}
                  selectedFile={null}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">Imagem OG</p>
                    <p className="text-xs text-muted-foreground">1200x630px até 2MB</p>
                  </div>
                </FileUpload>
                {formData.og_image_url && (
                  <div className="text-center">
                    <img 
                      src={formData.og_image_url} 
                      alt="OG image preview" 
                      className="h-16 w-auto mx-auto rounded border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Preview atual</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO & Metadata */}
        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template de Título</Label>
                  <Input
                    value={formData.meta_title_template}
                    onChange={(e) => handleInputChange('meta_title_template', e.target.value)}
                    placeholder="{{page}} · {{siteTitle}}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{{page}}'} e {'{{siteTitle}}'} como variáveis
                  </p>
                </div>
                <div>
                  <Label>Meta Description Padrão</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="Descrição da plataforma..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Open Graph & Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>OG Título</Label>
                  <Input
                    value={formData.og_title}
                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                    placeholder="Título para redes sociais"
                  />
                </div>
                <div>
                  <Label>OG Descrição</Label>
                  <Textarea
                    value={formData.og_description}
                    onChange={(e) => handleInputChange('og_description', e.target.value)}
                    placeholder="Descrição para redes sociais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 font-light">Robots & Indexação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Indexação</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que motores de busca indexem o site
                    </p>
                  </div>
                  <Switch
                    checked={formData.robots_index}
                    onCheckedChange={(checked) => handleInputChange('robots_index', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seguir Links</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que motores de busca sigam links
                    </p>
                  </div>
                  <Switch
                    checked={formData.robots_follow}
                    onCheckedChange={(checked) => handleInputChange('robots_follow', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3 font-light">CSS Personalizado</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione CSS personalizado para controle total da aparência
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.custom_css}
                onChange={(e) => handleInputChange('custom_css', e.target.value)}
                placeholder="/* Seu CSS personalizado aqui */&#10;.custom-class {&#10;  /* estilos */&#10;}"
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};