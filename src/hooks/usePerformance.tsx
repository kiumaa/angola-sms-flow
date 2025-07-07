import { useState, useEffect } from 'react';

// Custom hook for scroll to top functionality
export const useScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return { isVisible, scrollToTop };
};

// Custom hook for performance monitoring
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Simple performance monitoring without external dependencies
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Log performance metrics for debugging (can be sent to analytics)
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', entry);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['navigation', 'measure'] });
      } catch (e) {
        // Silently fail if browser doesn't support PerformanceObserver
        console.log('Performance monitoring not supported');
      }
      
      return () => observer.disconnect();
    }
  }, []);
};

// Custom hook for lazy loading images
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imageRef && imageSrc !== src) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imageRef);
    }
    
    return () => {
      if (observer && observer.unobserve) {
        observer.disconnect();
      }
    };
  }, [imageRef, imageSrc, src]);

  return [setImageRef, imageSrc];
};