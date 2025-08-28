import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Landing from './Landing';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Show landing page for unauthenticated users
  return <Landing />;
};

export default Index;
