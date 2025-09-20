import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, getActiveNavItem } from "@/config/adminNav";

interface AdminSidebarNavProps {
  isSidebarOpen: boolean;
}

export const AdminSidebarNav = ({ isSidebarOpen }: AdminSidebarNavProps) => {
  const location = useLocation();
  const activeNavKey = getActiveNavItem(location.pathname);

  return (
    <nav className="p-4 space-y-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = item.key === activeNavKey;
        
        return (
          <Link
            key={item.key}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
            title={!isSidebarOpen ? item.label : undefined}
          >
            <item.icon className={cn(
              "h-4 w-4 flex-shrink-0 transition-transform duration-200",
              isActive && "scale-110",
              !isActive && "group-hover:scale-105"
            )} />
            {isSidebarOpen && (
              <span className="ml-3 transition-all duration-200">
                {item.label}
              </span>
            )}
            
            {/* Active indicator dot for collapsed sidebar */}
            {!isSidebarOpen && isActive && (
              <div className="absolute right-1 w-2 h-2 bg-primary rounded-full"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};