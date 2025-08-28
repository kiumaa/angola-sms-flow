import { ChevronRight, Home, File } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/config/adminNav";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
}

export const AdminBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Remove 'admin' from segments since it's implied
  const adminSegments = pathSegments.slice(1);
  
  const getBreadcrumbData = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin', icon: Home }
    ];
    
    if (adminSegments.length > 0) {
      // Find the matching nav item
      const currentItem = ADMIN_NAV_ITEMS.find(item => 
        item.href === location.pathname
      );
      
      if (currentItem) {
        breadcrumbs.push({
          label: currentItem.label,
          href: currentItem.href,
          icon: currentItem.icon
        });
      } else {
        // Handle custom paths
        adminSegments.forEach((segment, index) => {
          const path = `/admin/${adminSegments.slice(0, index + 1).join('/')}`;
          const label = segment.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          breadcrumbs.push({
            label,
            href: path,
            icon: File
          });
        });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbData();
  
  // Don't show breadcrumbs on the main dashboard
  if (location.pathname === '/admin') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = breadcrumb.icon;
        
        return (
          <div key={breadcrumb.href} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            )}
            
            {isLast ? (
              <span className={cn(
                "flex items-center space-x-1 text-foreground font-medium",
                Icon && "space-x-1.5"
              )}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{breadcrumb.label}</span>
              </span>
            ) : (
              <Link
                to={breadcrumb.href}
                className={cn(
                  "flex items-center space-x-1 hover:text-foreground transition-colors",
                  Icon && "space-x-1.5"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{breadcrumb.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};