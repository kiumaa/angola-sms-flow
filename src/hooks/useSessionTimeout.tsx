import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface UseSessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning
}: UseSessionTimeoutProps = {}) => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!user) return;

    // Set warning timer
    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, (timeoutMinutes - warningMinutes) * 60 * 1000);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      console.warn('Session timeout - user signed out for inactivity');
      onTimeout?.();
      signOut();
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Start the timer
    resetTimer();

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, timeoutMinutes, warningMinutes]);

  return {
    resetTimer,
    getRemainingTime: () => {
      if (!user) return 0;
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, (timeoutMinutes * 60 * 1000) - elapsed);
    }
  };
};