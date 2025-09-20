'use client';

import { PricingCard } from '@/components/ui/price';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Building } from 'lucide-react';

// --- FADE-IN ANIMATION VARIANTS ---
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2, // Stagger the animation of children
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function PricingDemo() {
  const handlePurchase = (planName: string) => {
    console.log(`Purchasing ${planName} plan`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* --- Starter Plan --- */}
        <motion.div variants={itemVariants}>
          <PricingCard
            planName="Starter"
            description="Para começar"
            price={25000}
            billingCycle=" Kz"
            features={[
              '1.000 SMS incluídos',
              'Dashboard básico',
              'Suporte por email',
              'Relatórios simples',
            ]}
            buttonText="Escolher Starter"
            icon={<MessageSquare className="w-6 h-6" />}
            onPurchase={() => handlePurchase('Starter')}
          />
        </motion.div>

        {/* --- Professional Plan (Popular) --- */}
        <motion.div variants={itemVariants}>
          <PricingCard
            variant="popular"
            planName="Professional"
            description="Mais popular"
            price={75000}
            billingCycle=" Kz"
            features={[
              '5.000 SMS incluídos',
              'Dashboard completo',
              'Suporte prioritário',
              'Relatórios detalhados',
              'API access',
            ]}
            buttonText="Escolher Professional"
            icon={<Zap className="w-6 h-6" />}
            onPurchase={() => handlePurchase('Professional')}
          />
        </motion.div>

        {/* --- Enterprise Plan --- */}
        <motion.div variants={itemVariants}>
          <PricingCard
            planName="Enterprise"
            description="Para empresas"
            price={200000}
            billingCycle=" Kz"
            features={[
              '20.000 SMS incluídos',
              'Dashboard avançado',
              'Suporte 24/7',
              'Relatórios customizados',
              'API ilimitada',
              'Sender ID personalizado',
            ]}
            buttonText="Escolher Enterprise"
            icon={<Building className="w-6 h-6" />}
            onPurchase={() => handlePurchase('Enterprise')}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}