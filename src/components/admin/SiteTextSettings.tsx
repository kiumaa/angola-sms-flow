import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { Loader2, Type } from "lucide-react";

const siteTextSchema = z.object({
  site_title: z.string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(60, "Título deve ter no máximo 60 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, "Título contém caracteres inválidos"),
  site_subtitle: z.string()
    .min(10, "Subtítulo deve ter pelo menos 10 caracteres")
    .max(120, "Subtítulo deve ter no máximo 120 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.\,\!]+$/, "Subtítulo contém caracteres inválidos"),
});

type SiteTextFormValues = z.infer<typeof siteTextSchema>;

const SiteTextSettings = () => {
  const { settings, loading, updateSettings } = useBrandSettings();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<SiteTextFormValues>({
    resolver: zodResolver(siteTextSchema),
    defaultValues: {
      site_title: settings?.site_title || "SMS Marketing Angola",
      site_subtitle: settings?.site_subtitle || "Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional",
    },
  });

  // Update form when settings load
  useState(() => {
    if (settings) {
      form.reset({
        site_title: settings.site_title || "SMS Marketing Angola",
        site_subtitle: settings.site_subtitle || "Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional",
      });
    }
  });

  const onSubmit = async (data: SiteTextFormValues) => {
    setIsUpdating(true);
    try {
      await updateSettings({
        site_title: data.site_title.trim(),
        site_subtitle: data.site_subtitle.trim(),
      });
    } catch (error) {
      console.error('Error updating site text:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const watchedTitle = form.watch("site_title");
  const watchedSubtitle = form.watch("site_subtitle");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Type className="h-5 w-5" />
          <span>Configurações de Texto do Site</span>
        </CardTitle>
        <CardDescription>
          Personalize o título e subtítulo que aparecem na página inicial do site público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="site_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Título do Site *
                    <span className="text-xs text-muted-foreground ml-2">
                      {watchedTitle?.length || 0}/60
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SMS Marketing Angola"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subtítulo do Site *
                    <span className="text-xs text-muted-foreground ml-2">
                      {watchedSubtitle?.length || 0}/120
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Conectando empresas aos seus clientes através de SMS marketing eficiente"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SiteTextSettings;