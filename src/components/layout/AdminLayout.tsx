import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ADMIN_NAV_ITEMS, getActiveNavItem } from "@/config/adminNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}
const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
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
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link to="/admin" onClick={onItemClick} className="flex items-center">
          <BrandAwareLogo className="h-8 w-auto mr-2" textClassName="font-bold text-lg" showText={!isDesktopSidebarCollapsed} />
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map(item => (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
              item.current 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {(!isDesktopSidebarCollapsed) && (
              <span className="ml-3 text-sm font-normal truncate">{item.name}</span>
            )}
            {isDesktopSidebarCollapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border sticky top-0 z-40 w-full">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SidebarContent onItemClick={() => setIsSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Alternar sidebar</span>
            </Button>

            <div className="lg:hidden">
              <Link to="/admin">
                <BrandAwareLogo className="h-8 w-auto" textClassName="font-bold text-lg" showText={true} />
              </Link>
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

      <div className="flex w-full">
        {/* Desktop Sidebar - Always visible on desktop */}
        <aside
          data-testid="admin-sidebar"
          className={`hidden lg:block bg-card/50 border-r border-border transition-all duration-300 ${
            isDesktopSidebarCollapsed ? "w-16" : "w-64"
          } min-h-[calc(100vh-64px)] sticky top-16 shrink-0`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <Link to="/admin" className="flex items-center">
                <BrandAwareLogo 
                  className="h-8 w-auto mr-2" 
                  textClassName="font-bold text-lg" 
                  showText={!isDesktopSidebarCollapsed} 
                />
              </Link>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    item.current 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!isDesktopSidebarCollapsed) && (
                    <span className="ml-3 text-sm font-normal truncate">{item.name}</span>
                  )}
                  {isDesktopSidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border shadow-md">
                      {item.name}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 min-h-[calc(100vh-64px)] w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;