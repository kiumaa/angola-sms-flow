import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<any>;
  color?: string;
  loading?: boolean;
  className?: string;
  variant?: "default" | "compact" | "highlighted";
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color = "bg-gradient-primary",
  loading = false,
  className,
  variant = "default"
}: MetricCardProps) => {
  const isPositive = change !== undefined && change >= 0;
  
  if (variant === "compact") {
    return (
      <Card className={cn("hover-lift transition-all duration-200", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <p className="text-xl font-bold">{loading ? "..." : value}</p>
            </div>
            <div className={cn("p-2 rounded-xl", color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          {change !== undefined && (
            <div className={cn("flex items-center space-x-1 text-xs mt-2", 
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "highlighted") {
    return (
      <Card className={cn("hover-lift transition-all duration-200 border-l-4 border-l-primary", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-2xl", color)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            {change !== undefined && (
              <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                {isPositive ? "+" : ""}{change}%
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold gradient-text">{loading ? "..." : value}</p>
            {changeLabel && (
              <p className="text-xs text-muted-foreground">{changeLabel}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("hover-lift transition-all duration-200 glass-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{loading ? "..." : value}</p>
              {change !== undefined && (
                <div className={cn("flex items-center space-x-1 text-xs", 
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
            {changeLabel && (
              <p className="text-xs text-muted-foreground">{changeLabel}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-2xl shadow-glow", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};