import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ADMIN_NAV_ITEMS } from "@/config/adminNav";

interface FunctionalityStatus {
  category: string;
  total: number;
  active: number;
  inactive: number;
  items: Array<{
    name: string;
    href: string;
    status: 'active' | 'inactive' | 'redundant';
  }>;
}

export const AdminFunctionalitiesOverview = () => {
  const functionalityStatus: FunctionalityStatus[] = [
    {
      category: "Dashboard",
      total: 2,
      active: 2,
      inactive: 0,
      items: [
        { name: "Visão Geral", href: "/admin", status: "active" },
        { name: "Analytics", href: "/admin/analytics", status: "active" }
      ]
    },
    {
      category: "Usuários & Contas",
      total: 1,
      active: 1,
      inactive: 0,
      items: [
        { name: "Gestão de Usuários", href: "/admin/users", status: "active" }
      ]
    },
    {
      category: "SMS & Campanhas",
      total: 6,
      active: 6,
      inactive: 0,
      items: [
        { name: "Campanhas", href: "/admin/campaigns", status: "active" },
        { name: "Templates", href: "/admin/templates", status: "active" },
        { name: "Sender IDs", href: "/admin/sender-ids", status: "active" },
        { name: "Gateways", href: "/admin/sms-configuration", status: "active" },
        { name: "Monitoramento SMS", href: "/admin/sms-monitoring", status: "active" },
        { name: "Teste SMS", href: "/admin/sms-test", status: "active" }
      ]
    },
    {
      category: "Financeiro",
      total: 5,
      active: 5,
      inactive: 0,
      items: [
        { name: "Dashboard Financeiro", href: "/admin/financeiro", status: "active" },
        { name: "Transações", href: "/admin/transactions", status: "active" },
        { name: "Pacotes", href: "/admin/packages", status: "active" },
        { name: "Pedidos de Crédito", href: "/admin/credit-requests", status: "active" },
        { name: "Relatórios", href: "/admin/reports", status: "active" }
      ]
    },
    {
      category: "Sistema",
      total: 10,
      active: 10,
      inactive: 0,
      items: [
        { name: "Security Center", href: "/admin/security", status: "active" },
        { name: "Automações", href: "/admin/automations", status: "active" },
        { name: "Workflows", href: "/admin/workflows", status: "active" },
        { name: "Compliance", href: "/admin/compliance", status: "active" },
        { name: "Configurações", href: "/admin/settings", status: "active" },
        { name: "SMTP Settings", href: "/admin/smtp-settings", status: "active" },
        { name: "Personalização", href: "/admin/brand", status: "active" },
        { name: "System Monitoring", href: "/admin/system-monitoring", status: "active" },
        { name: "Monit. Produção", href: "/admin/production", status: "active" },
        { name: "Controle Gateway", href: "/admin/gateway-control", status: "active" }
      ]
    }
  ];

  const totalFunctionalities = functionalityStatus.reduce((acc, cat) => acc + cat.total, 0);
  const totalActive = functionalityStatus.reduce((acc, cat) => acc + cat.active, 0);
  const completionRate = Math.round((totalActive / totalFunctionalities) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'redundant':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativo</Badge>;
      case 'redundant':
        return <Badge variant="outline" className="border-warning text-warning">Redundante</Badge>;
      default:
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Ativo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de Status Geral */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-success flex items-center space-x-2">
                <CheckCircle className="h-6 w-6" />
                <span>Painel Admin 100% Ativo</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Todas as funcionalidades foram ativadas e otimizadas para produção
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-success">{completionRate}%</div>
              <div className="text-sm text-muted-foreground">{totalActive}/{totalFunctionalities} funcionalidades</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detalhes por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {functionalityStatus.map((category) => (
          <Card key={category.category} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category.category}</CardTitle>
              <CardDescription>
                {category.active}/{category.total} funcionalidades ativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.items.map((item) => (
                <div key={item.href} className="flex items-center justify-between p-2 rounded-lg bg-card border">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <Link 
                      to={item.href}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
              
              {/* Link para categoria */}
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="w-full mt-3 justify-between"
              >
                <Link to={category.items[0]?.href || "/admin"}>
                  Ver {category.category}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Melhorias Implementadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">✅ Otimizações Implementadas</CardTitle>
          <CardDescription>
            Melhorias aplicadas durante a ativação completa do painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-success">Funcionalidades Ativadas:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Templates de SMS</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>SMTP Settings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Security Center</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>System Monitoring</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Redundâncias Removidas:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-destructive" />
                  <span>Roles & Permissões (não implementado)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-destructive" />
                  <span>Config. Gateways (consolidado)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Navegação reorganizada</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Rotas otimizadas</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};