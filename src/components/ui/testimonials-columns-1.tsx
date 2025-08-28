"use client";
import React from "react";
import { motion } from "motion/react";

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
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={`${index}-${i}`}>
                <div>{text}</div>
                <div className="flex items-center gap-2 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5">{name}</div>
                    <div className="leading-5 opacity-60 tracking-tight">{role}</div>
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
    text: "SMSAO transformed our marketing campaigns with reliable SMS delivery and excellent delivery rates across Angola.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    name: "Maria Santos",
    role: "Marketing Director",
  },
  {
    text: "The bulk SMS feature saved us hours of work. We can now reach thousands of customers instantly with promotional offers.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "João Silva",
    role: "Business Owner",
  },
  {
    text: "Customer support is outstanding. They helped us set up our SMS campaigns and provided ongoing technical assistance.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Ana Costa",
    role: "Customer Success Manager",
  },
  {
    text: "The delivery reports and analytics help us track campaign performance and optimize our messaging strategy effectively.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Carlos Mendes",
    role: "Digital Marketing Specialist",
  },
  {
    text: "Affordable pricing with transparent credit system. No hidden fees and excellent value for money compared to competitors.",
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face",
    name: "Luisa Ferreira",
    role: "Finance Manager",
  },
  {
    text: "Easy integration with our existing systems. The API documentation is clear and implementation was straightforward.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Pedro Oliveira",
    role: "IT Developer",
  },
  {
    text: "Quick SMS delivery and high success rates. Our customers receive notifications promptly, improving our service quality.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Sofia Rodrigues",
    role: "Operations Manager",
  },
  {
    text: "The contact management features help us organize our customer database and target specific groups effectively.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Miguel Torres",
    role: "Sales Director",
  },
  {
    text: "SMSAO improved our customer engagement significantly. Higher open rates compared to email marketing campaigns.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Isabel Gomes",
    role: "Communications Lead",
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
            <div className="border py-1 px-4 rounded-lg text-sm text-muted-foreground">Testimoniais</div>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-center">
            O que os nossos clientes dizem
          </h2>
          <p className="text-center mt-5 text-muted-foreground">
            Veja o que os nossos clientes têm a dizer sobre a nossa plataforma SMS.
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