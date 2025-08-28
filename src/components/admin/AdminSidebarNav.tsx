import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_CATEGORIES, getActiveNavItem } from "@/config/adminNav";

interface AdminSidebarNavProps {
  isSidebarOpen: boolean;
}

export const AdminSidebarNav = ({ isSidebarOpen }: AdminSidebarNavProps) => {
  const location = useLocation();
  const activeNavKey = getActiveNavItem(location.pathname);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['dashboard', 'users', 'sms', 'financial'])
  );

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <nav className="p-4 space-y-2">
      {ADMIN_NAV_CATEGORIES.map((category) => {
        const isExpanded = expandedCategories.has(category.key);
        const hasActiveItem = category.items.some(item => item.key === activeNavKey);
        
        return (
          <div key={category.key} className="space-y-1">
            {/* Category Header */}
            {isSidebarOpen && category.items.length > 1 ? (
              <button
                onClick={() => toggleCategory(category.key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200",
                  hasActiveItem 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{category.label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : null}

            {/* Category Items */}
            <div className={cn(
              "space-y-1 transition-all duration-200",
              !isSidebarOpen || isExpanded || category.items.length === 1 ? "block" : "hidden"
            )}>
              {category.items.map((item) => {
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
            </div>
          </div>
        );
      })}
    </nav>
  );
};