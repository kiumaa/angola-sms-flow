import { useState, useEffect } from 'react';

interface UseImagePreloaderReturn {
  loaded: boolean;
  error: boolean;
  retry: () => void;
}

export const useImagePreloader = (src: string, fallbackSrc?: string): UseImagePreloaderReturn => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const loadImage = (imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoaded(true);
        setError(false);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
      
      img.src = imageSrc;
    });
  };

  const retry = () => {
    setLoaded(false);
    setError(false);
    setCurrentSrc(src);
  };

  useEffect(() => {
    setLoaded(false);
    setError(false);

    loadImage(currentSrc)
      .catch(() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return loadImage(fallbackSrc);
        }
        throw new Error('All image sources failed');
      })
      .catch(() => {
        setError(true);
        setLoaded(false);
      });
  }, [currentSrc, fallbackSrc]);

  return { loaded, error, retry };
};