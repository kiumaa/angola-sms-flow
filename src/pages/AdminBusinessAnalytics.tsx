import AdminLayout from '@/components/layout/AdminLayout';
import { BusinessAnalyticsDashboard } from '@/components/admin/BusinessAnalyticsDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function AdminBusinessAnalytics() {
  return <BusinessAnalyticsDashboard />;
}
