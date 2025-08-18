import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ADMIN_NAV_ITEMS, getActiveNavItem } from "@/config/adminNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

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

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <Link to="/admin" onClick={onItemClick} className="flex items-center">
          <BrandAwareLogo 
            className="h-8 w-auto" 
            textClassName="font-bold text-lg" 
            showText={!isDesktopSidebarCollapsed} 
          />
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(item => (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group",
              item.current 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {(!isDesktopSidebarCollapsed) && (
              <span className="ml-3 truncate">{item.name}</span>
            )}
            {isDesktopSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </div>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SidebarContent onItemClick={() => setIsMobileSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>

            {/* Mobile logo */}
            <div className="lg:hidden">
              <BrandAwareLogo className="h-8 w-auto" textClassName="font-bold text-lg" />
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
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
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0",
            isDesktopSidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;