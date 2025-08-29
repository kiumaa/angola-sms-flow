import { useEffect, useState } from 'react';

export const useScrollZoom = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate zoom scale based on scroll position
  const scale = Math.min(1 + scrollY * 0.0005, 1.3);
  
  return { scale };
};