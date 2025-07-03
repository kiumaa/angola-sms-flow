import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Users, Package, CreditCard, BarChart3, Settings, LogOut, Menu, MessageSquare, Send, FileText } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/");
  };

  const navigation = [
    {
      name: "Dashboard Admin",
      href: "/admin",
      icon: BarChart3,
      current: location.pathname === "/admin"
    },
    {
      name: "Gestão de Usuários",
      href: "/admin/users",
      icon: Users,
      current: location.pathname.startsWith("/admin/users")
    },
    {
      name: "Gestão de Pacotes",
      href: "/admin/packages",
      icon: Package,
      current: location.pathname.startsWith("/admin/packages")
    },
    {
      name: "Transações",
      href: "/admin/transactions",
      icon: CreditCard,
      current: location.pathname.startsWith("/admin/transactions")
    },
    {
      name: "Solicitações de Crédito",
      href: "/admin/credit-requests",
      icon: FileText,
      current: location.pathname.startsWith("/admin/credit-requests")
    },
    {
      name: "Sender IDs",
      href: "/admin/sender-ids",
      icon: Send,
      current: location.pathname.startsWith("/admin/sender-ids")
    },
    {
      name: "Relatórios",
      href: "/admin/reports",
      icon: BarChart3,
      current: location.pathname.startsWith("/admin/reports")
    },
    {
      name: "Configurações",
      href: "/admin/settings",
      icon: Settings,
      current: location.pathname.startsWith("/admin/settings")
    },
    {
      name: "Personalização",
      href: "/admin/brand",
      icon: Settings,
      current: location.pathname.startsWith("/admin/brand")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/admin" className="flex items-center ml-4">
                <BrandAwareLogo 
                  className="h-8 w-auto mr-2" 
                  textClassName="font-bold text-lg"
                  showText={true}
                />
                <span className="font-bold text-lg">Admin</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Admin:</span>
                <span className="font-bold text-primary ml-1">{user?.email}</span>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Ver Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-card border-r border-border transition-all duration-300 min-h-[calc(100vh-64px)]`}>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;