import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Type, Shield } from "lucide-react";

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
  const { settings: regSettings, updateSetting } = useRegistrationSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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

  const handleToggleOTP = async (enabled: boolean) => {
    const result = await updateSetting('otp_enabled', enabled.toString());
    if (result.success) {
      toast({
        title: "Configuração atualizada",
        description: `Verificação OTP ${enabled ? 'ativada' : 'desativada'}`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCredits = async (credits: number) => {
    const result = await updateSetting('free_credits_new_user', credits.toString());
    if (result.success) {
      toast({
        title: "Configuração atualizada",
        description: `Créditos gratuitos definidos para ${credits}`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração",
        variant: "destructive",
      });
    }
  };

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
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Configurações de Registro</span>
          </CardTitle>
          <CardDescription>
            Configure como novos usuários se registram na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Verificação OTP obrigatória
              </Label>
              <p className="text-sm text-muted-foreground">
                Exigir verificação de telefone via SMS durante o registro
              </p>
            </div>
            <Switch
              checked={regSettings.otp_enabled}
              onCheckedChange={handleToggleOTP}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Créditos gratuitos para novos usuários
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={regSettings.free_credits_new_user}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 0) {
                    handleUpdateCredits(value);
                  }
                }}
                min="0"
                max="100"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">SMS grátis</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Quantidade de SMS gratuitos que novos usuários recebem
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteTextSettings;