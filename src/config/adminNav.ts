import { 
  Home, 
  Users, 
  Package, 
  CreditCard, 
  Send, 
  BarChart3, 
  Settings, 
  Palette,
  MessageSquare,
  Wifi,
  FileText,
  Shield,
  DollarSign,
  MonitorSpeaker,
  UserCheck,
  Archive,
  TestTube
} from "lucide-react";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
  category?: string;
}

export interface AdminNavCategory {
  key: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  // Dashboard
  {
    key: 'home',
    label: 'Dashboard',
    href: '/admin',
    icon: Home,
    category: 'dashboard'
  },
  
  // Gestão de Usuários
  {
    key: 'users',
    label: 'Usuários',
    href: '/admin/users',
    icon: Users,
    category: 'users'
  },
  
  // SMS & Comunicação
  {
    key: 'smsConfiguration',
    label: 'Configurações SMS',
    href: '/admin/sms-configuration',
    icon: Settings,
    category: 'sms'
  },
  {
    key: 'senderIds',
    label: 'Sender IDs',
    href: '/admin/sender-ids',
    icon: Send,
    category: 'sms'
  },
  {
    key: 'smsTest',
    label: 'Teste SMS',
    href: '/admin/sms-test',
    icon: TestTube,
    category: 'sms'
  },
  {
    key: 'smsMonitoring',
    label: 'Monitoramento SMS',
    href: '/admin/sms-monitoring',
    icon: Wifi,
    category: 'sms'
  },
  {
    key: 'gatewayControl',
    label: 'Controle de Gateways',
    href: '/admin/gateway-control',
    icon: Settings,
    category: 'sms'
  },
  
  // Financeiro
  {
    key: 'financeiro',
    label: 'Painel Financeiro',
    href: '/admin/financeiro',
    icon: DollarSign,
    category: 'financial'
  },
  {
    key: 'packages',
    label: 'Pacotes de Créditos',
    href: '/admin/packages',
    icon: Package,
    category: 'financial'
  },
  {
    key: 'transactions',
    label: 'Transações',
    href: '/admin/transactions',
    icon: CreditCard,
    category: 'financial'
  },
  {
    key: 'creditRequests',
    label: 'Pedidos de Créditos',
    href: '/admin/credit-requests',
    icon: DollarSign,
    category: 'financial'
  },
  
  // Relatórios & Analytics
  {
    key: 'reports',
    label: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart3,
    category: 'reports'
  },
  
  // Sistema
  {
    key: 'branding',
    label: 'Personalização',
    href: '/admin/brand',
    icon: Palette,
    category: 'system'
  },
  {
    key: 'production',
    label: 'Produção',
    href: '/admin/production',
    icon: Shield,
    category: 'system'
  },
];

export const ADMIN_NAV_CATEGORIES: AdminNavCategory[] = [
  {
    key: 'dashboard',
    label: 'Principal',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'dashboard')
  },
  {
    key: 'users',
    label: 'Usuários',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'users')
  },
  {
    key: 'sms',
    label: 'SMS & Comunicação',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'sms')
  },
  {
    key: 'financial',
    label: 'Financeiro',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'financial')
  },
  {
    key: 'reports',
    label: 'Relatórios',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'reports')
  },
  {
    key: 'system',
    label: 'Sistema',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'system')
  }
];

export const getActiveNavItem = (pathname: string): string | null => {
  const item = ADMIN_NAV_ITEMS.find(item => {
    if (item.href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(item.href);
  });
  
  return item?.key || null;
};