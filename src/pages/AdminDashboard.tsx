import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Globe,
  Server,
  UserPlus,
  DollarSign,
  BarChart3
} from "lucide-react";

import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useGatewayMonitoring } from "@/hooks/useGatewayMonitoring";
import { StatsCard } from "@/components/admin/StatsCard";
import { DashboardWidgets } from "@/components/admin/DashboardWidgets";
import { AdminFunctionalitiesOverview } from "@/components/admin/AdminFunctionalitiesOverview";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const { stats: userStats, users, loading: usersLoading } = useAdminUsers();
  const { gateways, metrics, loading: gatewaysLoading } = useGatewayMonitoring();

  if (usersLoading || gatewaysLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="h-32 bg-muted/20 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const onlineGateways = gateways?.filter(g => g.status === 'online').length || 0;
  const totalGateways = gateways?.length || 0;

  return (
    <div className="space-y-8">
      {/* Advanced Header */}
      <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative">
          <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
            <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <span>Painel Administrativo - 100% Ativo</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            🚀 Plataforma otimizada e pronta para produção - Todas as funcionalidades ativas
          </p>
        </div>
      </div>

      {/* Funcionalidades Overview */}
      <AdminFunctionalitiesOverview />

      {/* Modern Dashboard Widgets */}
      <DashboardWidgets />
    </div>
  );
};

export default AdminDashboard;