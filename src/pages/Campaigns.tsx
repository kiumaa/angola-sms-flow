import DashboardLayout from "@/components/layout/DashboardLayout";
import { ComingSoon } from "@/components/shared/ComingSoon";

const Campaigns = () => {
  return (
    <DashboardLayout>
      <ComingSoon 
        title="Campanhas SMS"
        description="Estamos aprimorando o módulo de campanhas para oferecer uma experiência ainda melhor. Em breve estará disponível com novas funcionalidades."
        showBackButton={false}
      />
    </DashboardLayout>
  );
};

export default Campaigns;