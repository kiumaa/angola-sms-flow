import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Clock, CheckCircle } from "lucide-react";

interface NotificationStatsProps {
  notificationId: string;
  stats: {
    total_recipients: number;
    read_count: number;
    dismissed_count: number;
    active_count: number;
  };
}

export function AdminNotificationStats({ notificationId, stats }: NotificationStatsProps) {
  const readPercentage = stats.total_recipients > 0 ? (stats.read_count / stats.total_recipients) * 100 : 0;
  const dismissedPercentage = stats.total_recipients > 0 ? (stats.dismissed_count / stats.total_recipients) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_recipients}</div>
          <p className="text-xs text-muted-foreground">
            usuários receberam a notificação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lidas</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.read_count}</div>
          <div className="mt-2">
            <Progress value={readPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {readPercentage.toFixed(1)}% taxa de leitura
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dispensadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dismissed_count}</div>
          <div className="mt-2">
            <Progress value={dismissedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {dismissedPercentage.toFixed(1)}% dispensadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active_count}</div>
          <p className="text-xs text-muted-foreground">
            ainda visíveis para usuários
          </p>
        </CardContent>
      </Card>
    </div>
  );
}