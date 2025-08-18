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
    light_primary: '#8B5CF6',
    light_secondary: '#EC4899',
    light_bg: '#F8FAFC',
    light_text: '#1F2937',
    font_family: 'Inter',
    font_scale: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24
    },
    site_title: 'SMS AO',
    site_tagline: 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
    seo_title: '',
    seo_description: 'Plataforma de SMS Marketing para Angola',
    seo_canonical: '',
    seo_twitter: '@smsao',
    robots_index: true,
    robots_follow: true,
    custom_css: '',
    logo_light_url: '',
    logo_dark_url: '',
    favicon_url: '',
    og_image_url: ''
  });

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setFormData({
        light_primary: settings.light_primary || '#8B5CF6',
        light_secondary: settings.light_secondary || '#EC4899',
        light_bg: settings.light_bg || '#F8FAFC',
        light_text: settings.light_text || '#1F2937',
        font_family: settings.font_family || 'Inter',
        font_scale: settings.font_scale || {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 20,
          "2xl": 24
        },
        site_title: settings.site_title || 'SMS AO',
        site_tagline: settings.site_tagline || 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
        seo_title: settings.seo_title || '',
        seo_description: settings.seo_description || 'Plataforma de SMS Marketing para Angola',
        seo_canonical: settings.seo_canonical || '',
        seo_twitter: settings.seo_twitter || '@smsao',
        robots_index: settings.robots_index ?? true,
        robots_follow: settings.robots_follow ?? true,
        custom_css: settings.custom_css || '',
        logo_light_url: settings.logo_light_url || '',
        logo_dark_url: settings.logo_dark_url || '',
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

  const handleFontScaleChange = (type: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      font_scale: {
        ...prev.font_scale,
        [type]: value
      }
    }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'og_image') => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file, type);
      
      if (type === 'logo') {
        handleInputChange('logo_light_url', url);
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
                     value={formData.site_tagline}
                     onChange={(e) => handleInputChange('site_tagline', e.target.value)}
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
                         value={formData.light_primary}
                         onChange={(e) => handleInputChange('light_primary', e.target.value)}
                         className="w-16 h-10 p-1"
                       />
                       <Input
                         value={formData.light_primary}
                         onChange={(e) => handleInputChange('light_primary', e.target.value)}
                         placeholder="#8B5CF6"
                         className="flex-1"
                       />
                     </div>
                   </div>
                   <div>
                     <Label>Cor Secundária</Label>
                     <div className="flex items-center gap-2">
                       <Input
                         type="color"
                         value={formData.light_secondary}
                         onChange={(e) => handleInputChange('light_secondary', e.target.value)}
                         className="w-16 h-10 p-1"
                       />
                       <Input
                         value={formData.light_secondary}
                         onChange={(e) => handleInputChange('light_secondary', e.target.value)}
                         placeholder="#EC4899"
                         className="flex-1"
                       />
                     </div>
                   </div>
                   <div>
                     <Label>Cor de Fundo</Label>
                     <div className="flex items-center gap-2">
                       <Input
                         type="color"
                         value={formData.light_bg}
                         onChange={(e) => handleInputChange('light_bg', e.target.value)}
                         className="w-16 h-10 p-1"
                       />
                       <Input
                         value={formData.light_bg}
                         onChange={(e) => handleInputChange('light_bg', e.target.value)}
                         placeholder="#F8FAFC"
                         className="flex-1"
                       />
                     </div>
                   </div>
                   <div>
                     <Label>Cor do Texto</Label>
                     <div className="flex items-center gap-2">
                       <Input
                         type="color"
                         value={formData.light_text}
                         onChange={(e) => handleInputChange('light_text', e.target.value)}
                         className="w-16 h-10 p-1"
                       />
                       <Input
                         value={formData.light_text}
                         onChange={(e) => handleInputChange('light_text', e.target.value)}
                         placeholder="#1F2937"
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
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="text-h3 font-light">Escala de Texto</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <Label>Extra Small (xs)</Label>
                   <Input
                     type="number"
                     value={formData.font_scale.xs}
                     onChange={(e) => handleFontScaleChange('xs', Number(e.target.value))}
                     placeholder="12"
                   />
                 </div>
                 <div>
                   <Label>Small (sm)</Label>
                   <Input
                     type="number"
                     value={formData.font_scale.sm}
                     onChange={(e) => handleFontScaleChange('sm', Number(e.target.value))}
                     placeholder="14"
                   />
                 </div>
                 <div>
                   <Label>Base</Label>
                   <Input
                     type="number"
                     value={formData.font_scale.base}
                     onChange={(e) => handleFontScaleChange('base', Number(e.target.value))}
                     placeholder="16"
                   />
                 </div>
              </CardContent>
            </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="text-h3 font-light">Escala Ampliada</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <Label>Large (lg)</Label>
                   <Input
                     type="number"
                     value={formData.font_scale.lg}
                     onChange={(e) => handleFontScaleChange('lg', Number(e.target.value))}
                     placeholder="18"
                   />
                 </div>
                 <div>
                   <Label>Extra Large (xl)</Label>
                   <Input
                     type="number"
                     value={formData.font_scale.xl}
                     onChange={(e) => handleFontScaleChange('xl', Number(e.target.value))}
                     placeholder="20"
                   />
                 </div>
                 <div>
                   <Label>2XL</Label>
                   <Input
                     type="number"
                     value={formData.font_scale["2xl"]}
                     onChange={(e) => handleFontScaleChange('2xl', Number(e.target.value))}
                     placeholder="24"
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
                {formData.logo_light_url && (
                  <div className="text-center">
                    <img 
                      src={formData.logo_light_url} 
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
                   <Label>SEO Título</Label>
                   <Input
                     value={formData.seo_title}
                     onChange={(e) => handleInputChange('seo_title', e.target.value)}
                     placeholder="Título para SEO"
                   />
                 </div>
                 <div>
                   <Label>SEO Descrição</Label>
                   <Textarea
                     value={formData.seo_description}
                     onChange={(e) => handleInputChange('seo_description', e.target.value)}
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
                   <Label>Twitter Handle</Label>
                   <Input
                     value={formData.seo_twitter}
                     onChange={(e) => handleInputChange('seo_twitter', e.target.value)}
                     placeholder="@smsao"
                   />
                 </div>
                 <div>
                   <Label>URL Canônica</Label>
                   <Input
                     value={formData.seo_canonical}
                     onChange={(e) => handleInputChange('seo_canonical', e.target.value)}
                     placeholder="https://smsao.com"
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