import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CampaignWizard } from "@/components/campaign/CampaignWizard";
import { useContacts } from "@/hooks/useContacts";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const NewCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { contacts, contactLists, loading: contactsLoading } = useContacts();
  const { createCampaign } = useCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (campaignData: any) => {
    setIsSubmitting(true);
    try {
      const result = await createCampaign({
        name: campaignData.name,
        message_template: campaignData.message,
        sender_id: campaignData.senderId || null,
        audience_filter: {
          contacts: campaignData.selectedContacts || [],
          lists: campaignData.selectedLists || [],
          tags: campaignData.selectedTags || []
        },
        schedule_at: campaignData.scheduledAt || null
      });

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso!",
      });
      
      navigate("/campaigns");
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/campaigns");
  };

  if (contactsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
          <div className="h-96 bg-muted/20 rounded-3xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <h1 className="text-4xl font-light mb-2 gradient-text">Nova Campanha SMS</h1>
            <p className="text-muted-foreground text-lg">
              Crie e configure sua campanha de marketing via SMS
            </p>
          </div>
        </div>

        {/* Campaign Wizard */}
        <CampaignWizard
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          contacts={contacts}
          contactLists={contactLists}
          isSubmitting={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
};

export default NewCampaign;