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
    label: 'Visão Geral',
    href: '/admin',
    icon: Home,
    category: 'dashboard'
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    category: 'dashboard'
  },
  
  // Usuários & Contas
  {
    key: 'users',
    label: 'Gestão de Usuários',
    href: '/admin/users',
    icon: Users,
    category: 'users'
  },
  {
    key: 'roles',
    label: 'Roles & Permissões',
    href: '/admin/roles',
    icon: UserCheck,
    category: 'users'
  },
  
  // SMS & Campanhas  
  {
    key: 'campaigns',
    label: 'Campanhas',
    href: '/admin/campaigns',
    icon: Send,
    category: 'sms'
  },
  {
    key: 'templates',
    label: 'Templates',
    href: '/admin/templates',
    icon: FileText,
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
    key: 'gateways',
    label: 'Gateways',
    href: '/admin/sms-configuration',
    icon: Wifi,
    category: 'sms'
  },
  {
    key: 'smsMonitoring',
    label: 'Monitoramento',
    href: '/admin/sms-monitoring',
    icon: MonitorSpeaker,
    category: 'sms'
  },
  
  // Financeiro
  {
    key: 'transactions',
    label: 'Transações',
    href: '/admin/transactions',
    icon: CreditCard,
    category: 'financial'
  },
  {
    key: 'packages',
    label: 'Pacotes',
    href: '/admin/packages',
    icon: Package,
    category: 'financial'
  },
  {
    key: 'creditRequests',
    label: 'Pedidos de Crédito',
    href: '/admin/credit-requests',
    icon: DollarSign,
    category: 'financial'
  },
  {
    key: 'reports',
    label: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart3,
    category: 'financial'
  },
  
  // Sistema
  {
    key: 'automations',
    label: 'Automações',
    href: '/admin/automations',
    icon: Settings,
    category: 'system'
  },
  {
    key: 'workflows',
    label: 'Workflows',
    href: '/admin/workflows',
    icon: Archive,
    category: 'system'
  },
  {
    key: 'security',
    label: 'Segurança',
    href: '/admin/security',
    icon: Shield,
    category: 'system'
  },
  {
    key: 'compliance',
    label: 'Compliance',
    href: '/admin/compliance',
    icon: Archive,
    category: 'system'
  },
  {
    key: 'branding',
    label: 'Personalização',
    href: '/admin/brand',
    icon: Palette,
    category: 'system'
  },
];

export const ADMIN_NAV_CATEGORIES: AdminNavCategory[] = [
  {
    key: 'dashboard',
    label: '📊 Dashboard',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'dashboard')
  },
  {
    key: 'users',
    label: '👥 Usuários & Contas',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'users')
  },
  {
    key: 'sms',
    label: '📱 SMS & Campanhas',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'sms')
  },
  {
    key: 'financial',
    label: '💰 Financeiro',
    items: ADMIN_NAV_ITEMS.filter(item => item.category === 'financial')
  },
  {
    key: 'system',
    label: '⚙️ Sistema',
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