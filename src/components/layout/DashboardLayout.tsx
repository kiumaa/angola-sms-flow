import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Users, Calendar, Settings, Plus, Layout, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userEmail = localStorage.getItem("userEmail") || "";
  const smsCredits = localStorage.getItem("smsCredits") || "0";

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Layout,
      current: location.pathname === "/dashboard"
    },
    {
      name: "Campanhas",
      href: "/campaigns",
      icon: Mail,
      current: location.pathname.startsWith("/campaigns")
    },
    {
      name: "Contatos",
      href: "/contacts",
      icon: Users,
      current: location.pathname.startsWith("/contacts")
    },
    {
      name: "Relatórios",
      href: "/reports",
      icon: Calendar,
      current: location.pathname.startsWith("/reports")
    },
    {
      name: "Créditos",
      href: "/credits",
      icon: Plus,
      current: location.pathname.startsWith("/credits")
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: Settings,
      current: location.pathname.startsWith("/settings")
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
                <Layout className="h-5 w-5" />
              </button>
              <Link to="/dashboard" className="flex items-center ml-4">
                <Mail className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-lg">SMS Marketing Angola</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Créditos:</span>
                <span className="font-bold text-primary ml-1">{smsCredits}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {userEmail}
              </div>
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

export default DashboardLayout;