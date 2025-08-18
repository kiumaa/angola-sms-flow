import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ADMIN_NAV_ITEMS, getActiveNavItem } from "@/config/adminNav";
interface AdminLayoutProps {
  children?: React.ReactNode;
}
const AdminLayout = ({
  children
}: AdminLayoutProps = {}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    navigate("/");
  };
  const activeNavKey = getActiveNavItem(location.pathname);
  
  const navigation = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    name: item.label,
    current: item.key === activeNavKey
  }));
  return <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/admin" className="flex items-center ml-4">
                <BrandAwareLogo className="h-8 w-auto mr-2" textClassName="font-bold text-lg" showText={true} />
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="rounded-minimal">
                  Ver Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-minimal">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          data-testid="admin-sidebar"
          className={`${isSidebarOpen ? "w-64" : "w-16"} bg-card border-r border-border transition-all duration-300 min-h-[calc(100vh-64px)] flex-shrink-0`}
        >
          <nav className="p-4 space-y-1">
            {navigation.map(item => (
              <Link 
                key={item.name} 
                to={item.href} 
                className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  item.current 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {isSidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 min-w-0">
          {children || <Outlet />}
        </main>
      </div>
    </div>;
};
export default AdminLayout;