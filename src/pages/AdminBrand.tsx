import { useState } from 'react';
import { BrandCustomizationForm } from '@/components/admin/brand/BrandCustomizationForm';
import { LivePreview } from '@/components/admin/brand/LivePreview';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { usePageMeta } from '@/hooks/useDynamicMetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';

const AdminBrand = () => {
  const { settings } = useBrandSettings();
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Set page meta tags
  usePageMeta({
    title: 'Personalização',
    description: 'Configure toda a identidade visual e SEO da plataforma SMS Marketing Angola'
  });

  const toggleViewMode = () => {
    setViewMode(viewMode === 'edit' ? 'preview' : 'edit');
  };

  if (viewMode === 'preview' && settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-6 bg-background border-b">
          <div>
            <h1 className="text-h1 font-light tracking-tight">Preview da Personalização</h1>
            <p className="text-muted-foreground font-light">
              Visualize como ficará a aparência da plataforma
            </p>
          </div>
          <Button
            onClick={toggleViewMode}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Voltar à Edição
          </Button>
        </div>
        <LivePreview settings={settings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandCustomizationForm />
    </div>
  );
};

export default AdminBrand;