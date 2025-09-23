import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_CATEGORIES, getActiveNavItem } from "@/config/adminNav";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface AdminSidebarNavProps {
  isSidebarOpen: boolean;
}

export const AdminSidebarNav = ({ isSidebarOpen }: AdminSidebarNavProps) => {
  const location = useLocation();
  const activeNavKey = getActiveNavItem(location.pathname);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'dashboard', 'sms', 'financial', 'users', 'system'
  ]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  return (
    <nav className="p-4 space-y-2">
      {ADMIN_NAV_CATEGORIES.map((category) => {
        const isExpanded = expandedCategories.includes(category.key);
        const hasActiveItem = category.items.some(item => item.key === activeNavKey);
        
        return (
          <div key={category.key} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.key)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                hasActiveItem 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isSidebarOpen ? (
                <>
                  <span>{category.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </>
              ) : (
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    hasActiveItem ? "bg-primary" : "bg-muted-foreground"
                  )}
                  title={category.label}
                />
              )}
            </button>

            {/* Category Items */}
            {(isExpanded || !isSidebarOpen) && (
              <div className={cn(
                "space-y-1",
                isSidebarOpen ? "ml-2" : "ml-0"
              )}>
                {category.items.map((item) => {
                  const isActive = item.key === activeNavKey;
                  
                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
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
                        <span className="ml-3 transition-all duration-200 truncate">
                          {item.label}
                        </span>
                      )}
                      
                      {/* Active indicator for collapsed sidebar */}
                      {!isSidebarOpen && isActive && (
                        <div className="absolute right-1 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};