import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { RateLimiter } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check to prevent blocking auth flow
        if (session?.user) {
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin')
                .single();
              
              if (mounted) {
                setIsAdmin(!!data);
              }
            } catch (error) {
              if (mounted) {
                setIsAdmin(false);
              }
            }
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
      // If session exists, let the auth listener handle it
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Security: Rate limiting for sign-in attempts
    const rateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    const clientKey = `signin_${email.split('@')[0]}`;
    
    if (!rateLimiter.isAllowed(clientKey)) {
      const remainingTime = Math.ceil(rateLimiter.getTimeUntilReset(clientKey) / 60000);
      return { 
        error: { 
          message: `Too many sign-in attempts. Please try again in ${remainingTime} minutes.` 
        } 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Security: Log failed sign-in attempts (but not successful ones for privacy)
    if (error) {
      console.warn('Sign-in attempt failed:', { 
        email: email.replace(/(.{2}).*@/, '$1***@'), 
        timestamp: new Date().toISOString(),
        remaining: rateLimiter.getRemainingAttempts(clientKey)
      });
    } else {
      // Reset rate limiter on successful login
      rateLimiter.reset(clientKey);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};