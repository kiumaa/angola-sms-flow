
"use client";
import React from "react";
import { motion } from "motion/react";

// Import testimonial images - using the new uploaded photos
import person1 from "@/assets/testimonials/person-1.jpg";
import person2 from "@/assets/testimonials/person-2.jpg";
import person3 from "@/assets/testimonials/person-3.jpg";
import person4 from "@/assets/testimonials/person-4.jpg";
import person5 from "@/assets/testimonials/person-5.jpg";
import person6 from "@/assets/testimonials/person-6.jpg";
import person7 from "@/assets/testimonials/person-7.jpg";
import person8 from "@/assets/testimonials/person-8.jpg";
import person9 from "@/assets/testimonials/person-9.jpg";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role, flag }, i) => (
              <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={`${index}-${i}`}>
                <div className="text-sm leading-relaxed">{text}</div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5 flex items-center gap-1">
                      <span>{flag}</span>
                      <span>{name}</span>
                    </div>
                    <div className="leading-5 opacity-60 tracking-tight text-sm">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

const testimonials = [
  {
    text: "O SMS AO transformou as nossas campanhas de marketing em Luanda. A taxa de entrega é excelente e chegamos a todos os bairros da cidade.",
    image: person1,
    name: "Esperança Santos",
    role: "Directora de Marketing",
    flag: "🇦🇴"
  },
  {
    text: "Com o SMS AO conseguimos promover os nossos produtos em todo o país. Desde Benguela até Cabinda, os clientes recebem as nossas ofertas.",
    image: person2,
    name: "Osvaldo Teixeira",
    role: "Empresário",
    flag: "🇦🇴"
  },
  {
    text: "O suporte técnico do SMS AO é fantástico. Ajudaram-nos a configurar campanhas personalizadas para o mercado angolano com grande sucesso.",
    image: person3,
    name: "Benedita Francisco",
    role: "Gestora de Comunicação",
    flag: "🇦🇴"
  },
  {
    text: "Excelente plataforma para o mercado lusófono. Usamos o SMS AO tanto em Portugal como em Angola com resultados consistentes.",
    image: person4,
    name: "Miguel Santos",
    role: "Director Comercial",
    flag: "🇵🇹"
  },
  {
    text: "O SMS AO tem preços justos e transparentes, perfeito para pequenas empresas cabo-verdianas. Sem taxas escondidas e com excelente relação qualidade-preço.",
    image: person5,
    name: "Maria Cabral",
    role: "Gestora Financeira",
    flag: "🇨🇻"
  },
  {
    text: "A integração do SMS AO com os nossos sistemas foi simples. A documentação da API é clara e a implementação foi rápida e eficaz.",
    image: person6,
    name: "António Manuel",
    role: "Programador IT",
    flag: "🇦🇴"
  },
  {
    text: "O SMS AO garante entrega rápida em Moçambique. Os nossos clientes recebem as notificações em tempo real, melhorando o nosso atendimento.",
    image: person7,
    name: "Sofia Machado",
    role: "Gestora de Operações",
    flag: "🇲🇿"
  },
  {
    text: "As funcionalidades de gestão de contactos do SMS AO ajudam-nos a organizar a nossa base de dados e segmentar campanhas por regiões de Angola.",
    image: person8,
    name: "Carlos Neto",
    role: "Director de Vendas",
    flag: "🇦🇴"
  },
  {
    text: "O SMS AO melhorou significativamente o nosso engagement em São Tomé. Taxa de abertura muito superior ao email marketing tradicional.",
    image: person9,
    name: "Isabel Costa",
    role: "Responsável de Comunicações",
    flag: "🇸🇹"
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials = () => {
  return (
    <section className="section-padding relative bg-background">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg text-sm text-muted-foreground">Testemunhos</div>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-center">
            O que os nossos clientes dizem
          </h2>
          <p className="text-center mt-5 text-muted-foreground">
            Veja o que os nossos clientes têm a dizer sobre a nossa plataforma SMS AO.
          </p>
        </motion.div>
        
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};
