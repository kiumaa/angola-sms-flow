import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bell, Search } from "lucide-react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { Badge } from "@/components/ui/badge";
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
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Enhanced Top Navigation */}
      <nav className="glass-card backdrop-blur-lg border-b border-border/40 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover-lift"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <Link to="/admin" className="flex items-center">
                <BrandAwareLogo 
                  className="h-8 w-auto mr-3" 
                  textClassName="font-light text-lg gradient-text" 
                  showText={true} 
                />
              </Link>

              {/* Admin Badge */}
              <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              {/* Quick Search */}
              <Button variant="ghost" size="sm" className="rounded-xl hover-lift">
                <Search className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="rounded-xl hover-lift relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              <ThemeToggle />
              
              <div className="h-6 w-px bg-border/50"></div>
              
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="rounded-xl hover-lift">
                  Ver Site
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="rounded-xl hover-lift text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside 
          data-testid="admin-sidebar"
          className={`${
            isSidebarOpen ? "w-72" : "w-16"
          } glass-card border-r border-border/40 transition-all duration-300 min-h-[calc(100vh-64px)] flex-shrink-0 relative`}
        >
          {/* Sidebar gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"></div>
          
          <AdminSidebarNav isSidebarOpen={isSidebarOpen} />
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 p-6 min-w-0 bg-background/50">
          <div className="max-w-7xl mx-auto">
            <AdminBreadcrumbs />
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;