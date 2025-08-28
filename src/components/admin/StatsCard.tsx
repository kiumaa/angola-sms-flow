import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<any>;
  gradient: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  index?: number;
}

export const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  gradient, 
  trend,
  index = 0 
}: StatsCardProps) => {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return "text-emerald-600 dark:text-emerald-400";
      case 'down':
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card 
      className="card-futuristic animate-slide-up-stagger cursor-default relative overflow-hidden group hover-lift"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity duration-300",
        gradient,
        "group-hover:opacity-10"
      )}></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-3 rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
          gradient
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-3xl font-light gradient-text mb-2 transition-all duration-300 group-hover:scale-105">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground mb-3">
            {description}
          </p>
        )}
        
        {trend && (
          <div className={cn("flex items-center text-xs", getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-1">{trend.value}</span>
            {trend.label && (
              <span className="ml-1 text-muted-foreground">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};