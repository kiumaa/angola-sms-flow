
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PALOP_COUNTRIES = [
  '🇦🇴', // Angola
  '🇲🇿', // Moçambique
  '🇨🇻', // Cabo Verde
  '🇬🇼', // Guiné-Bissau
  '🇸🇹'  // São Tomé e Príncipe
];

interface AnimatedPalopTextProps {
  className?: string;
}

export const AnimatedPalopText = ({ className }: AnimatedPalopTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PALOP_COUNTRIES.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center min-w-[64px] h-[48px] ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{
            duration: 0.4,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center text-4xl leading-none"
          style={{ lineHeight: 1 }}
        >
          {PALOP_COUNTRIES[currentIndex]}
        </motion.span>
        {/* Invisible placeholder to maintain consistent height */}
        <span className="invisible text-4xl leading-none" style={{ lineHeight: 1 }}>
          🇸🇹
        </span>
      </AnimatePresence>
    </div>
  );
};
