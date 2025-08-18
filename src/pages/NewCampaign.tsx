import DashboardLayout from "@/components/layout/DashboardLayout";
import { ComingSoon } from "@/components/shared/ComingSoon";

const NewCampaign = () => {
  return (
    <DashboardLayout>
      <ComingSoon 
        title="Nova Campanha SMS"
        description="Estamos aprimorando o módulo de campanhas para oferecer uma experiência ainda melhor. Em breve estará disponível com novas funcionalidades."
      />
    </DashboardLayout>
  );
};

export default NewCampaign;