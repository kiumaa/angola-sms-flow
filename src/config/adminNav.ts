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
  FileText 
} from "lucide-react";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/admin',
    icon: Home,
  },
  {
    key: 'users',
    label: 'Usuários',
    href: '/admin/users',
    icon: Users,
  },
  {
    key: 'packages',
    label: 'Pacotes',
    href: '/admin/packages',
    icon: Package,
  },
  {
    key: 'transactions',
    label: 'Transações',
    href: '/admin/transactions',
    icon: CreditCard,
  },
  {
    key: 'senderIds',
    label: 'Sender IDs',
    href: '/admin/sender-ids',
    icon: Send,
  },
  {
    key: 'reports',
    label: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    key: 'smsConfiguration',
    label: 'Configurações SMS',
    href: '/admin/sms-configuration',
    icon: Settings,
  },
  {
    key: 'smsMonitoring',
    label: 'Monitoramento SMS',
    href: '/admin/sms-monitoring',
    icon: Wifi,
  },
  {
    key: 'branding',
    label: 'Personalização',
    href: '/admin/brand',
    icon: Palette,
  },
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