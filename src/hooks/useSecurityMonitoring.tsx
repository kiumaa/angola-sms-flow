import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'role_change' | 'multiple_failures' | 'rate_limit';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

export const useSecurityMonitoring = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      fetchSecurityAlerts();
      
      // Set up real-time monitoring
      const channel = supabase
        .channel('security_monitoring')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'admin_audit_logs' }, 
          handleNewAuditLog
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchSecurityAlerts = async () => {
    try {
      setLoading(true);
      
      // Fetch recent audit logs for security analysis
      const { data: auditLogs, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze logs for security patterns
      const generatedAlerts = analyzeAuditLogs(auditLogs || []);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAuditLog = (payload: any) => {
    const newLog = payload.new;
    const alert = analyzeLogForAlert(newLog);
    
    if (alert) {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    }
  };

  const analyzeAuditLogs = (logs: any[]): SecurityAlert[] => {
    const alerts: SecurityAlert[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Enhanced security pattern detection
    
    // 1. Multiple role changes by same admin
    const recentRoleChanges = logs.filter(log => 
      log.action.includes('role_') && 
      new Date(log.created_at) > oneHourAgo
    );

    const roleChangesByAdmin = recentRoleChanges.reduce((acc, log) => {
      acc[log.admin_id] = (acc[log.admin_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(roleChangesByAdmin).forEach(([adminId, count]) => {
      if ((count as number) > 5) {
        alerts.push({
          id: `role_spam_${adminId}_${Date.now()}`,
          type: 'role_change',
          message: `Admin made ${count} role changes in the last hour - possible privilege escalation`,
          severity: (count as number) > 10 ? 'critical' : 'high',
          timestamp: now.toISOString(),
          metadata: { adminId, count, pattern: 'rapid_role_changes' }
        });
      }
    });

    // 2. After-hours suspicious activity
    const afterHoursActivity = logs.filter(log => {
      const logTime = new Date(log.created_at);
      const hour = logTime.getHours();
      return logTime > sixHoursAgo && (hour < 6 || hour > 22) && 
             ['role_change', 'credit_adjustment', 'smtp_settings'].some(action => log.action.includes(action));
    });

    if (afterHoursActivity.length > 3) {
      alerts.push({
        id: `after_hours_${Date.now()}`,
        type: 'suspicious_login',
        message: `${afterHoursActivity.length} critical operations detected outside business hours`,
        severity: 'high',
        timestamp: now.toISOString(),
        metadata: { count: afterHoursActivity.length, pattern: 'after_hours_activity' }
      });
    }

    // 3. Multiple IP address usage
    const ipByAdmin = logs.filter(log => new Date(log.created_at) > oneHourAgo)
      .reduce((acc, log) => {
        if (!acc[log.admin_id]) acc[log.admin_id] = new Set();
        if (log.ip_address) acc[log.admin_id].add(log.ip_address);
        return acc;
      }, {} as Record<string, Set<string>>);

    Object.entries(ipByAdmin).forEach(([adminId, ips]) => {
      const ipSet = ips as Set<string>;
      if (ipSet.size > 2) {
        alerts.push({
          id: `multi_ip_${adminId}_${Date.now()}`,
          type: 'suspicious_login',
          message: `Admin using ${ipSet.size} different IP addresses in the last hour`,
          severity: 'medium',
          timestamp: now.toISOString(),
          metadata: { adminId, ipCount: ipSet.size, pattern: 'multiple_ips' }
        });
      }
    });

    // 4. Enhanced security alert patterns
    const enhancedAlerts = logs.filter(log => 
      log.action === 'enhanced_security_alert' && 
      new Date(log.created_at) > oneHourAgo
    );

    enhancedAlerts.forEach(log => {
      const riskScore = log.details?.risk_score || 0;
      alerts.push({
        id: `enhanced_alert_${log.id}`,
        type: 'suspicious_login',
        message: `Enhanced security alert: ${log.details?.patterns?.join(', ') || 'Multiple suspicious patterns'}`,
        severity: riskScore >= 6 ? 'critical' : riskScore >= 4 ? 'high' : 'medium',
        timestamp: log.created_at,
        metadata: { 
          patterns: log.details?.patterns, 
          riskScore,
          adminId: log.admin_id 
        }
      });
    });

    // 5. Rate limit violations
    const rateLimitViolations = logs.filter(log => 
      log.action === 'rate_limit_exceeded' && 
      new Date(log.created_at) > oneHourAgo
    );

    if (rateLimitViolations.length > 5) {
      alerts.push({
        id: `rate_limit_violations_${Date.now()}`,
        type: 'rate_limit',
        message: `${rateLimitViolations.length} rate limit violations detected - possible brute force attack`,
        severity: 'high',
        timestamp: now.toISOString(),
        metadata: { count: rateLimitViolations.length, pattern: 'rate_limit_violations' }
      });
    }

    // 6. Failed authentication attempts
    const failedAttempts = logs.filter(log => 
      (log.action === 'role_change_attempt' || log.action.includes('failed')) && 
      log.details?.error &&
      new Date(log.created_at) > oneHourAgo
    );

    if (failedAttempts.length > 10) {
      alerts.push({
        id: `auth_failures_${Date.now()}`,
        type: 'multiple_failures',
        message: `${failedAttempts.length} failed authorization attempts in the last hour`,
        severity: 'high',
        timestamp: now.toISOString(),
        metadata: { count: failedAttempts.length, pattern: 'failed_auth_attempts' }
      });
    }

    return alerts.slice(0, 50); // Limit to 50 alerts
  };

  const analyzeLogForAlert = (log: any): SecurityAlert | null => {
    // Check for privilege escalation attempts
    if (log.action === 'role_change_attempt' && log.details?.error?.includes('cannot grant themselves')) {
      return {
        id: `privilege_escalation_${log.id}`,
        type: 'role_change',
        message: `Critical: User attempted to escalate their own privileges`,
        severity: 'critical',
        timestamp: log.created_at,
        metadata: { adminId: log.admin_id, targetUserId: log.target_user_id, pattern: 'privilege_escalation' }
      };
    }

    // Check for enhanced security alerts
    if (log.action === 'enhanced_security_alert') {
      const riskScore = log.details?.risk_score || 0;
      const patterns = log.details?.patterns || [];
      
      return {
        id: `enhanced_alert_${log.id}`,
        type: 'suspicious_login',
        message: `Security alert: ${patterns.join(', ')} (Risk: ${riskScore})`,
        severity: riskScore >= 6 ? 'critical' : riskScore >= 4 ? 'high' : 'medium',
        timestamp: log.created_at,
        metadata: { adminId: log.admin_id, patterns, riskScore }
      };
    }

    // Check for high-risk sessions
    if (log.action === 'high_risk_session_detected') {
      return {
        id: `high_risk_session_${log.id}`,
        type: 'suspicious_login',
        message: `High-risk session detected (Score: ${log.details?.risk_score})`,
        severity: 'high',
        timestamp: log.created_at,
        metadata: { adminId: log.admin_id, riskScore: log.details?.risk_score }
      };
    }

    // Check for rate limit violations
    if (log.details?.error?.includes('Rate limit exceeded') || log.action === 'rate_limit_exceeded') {
      return {
        id: `rate_limit_${log.id}`,
        type: 'rate_limit',
        message: `Rate limit exceeded - potential brute force attack`,
        severity: 'medium',
        timestamp: log.created_at,
        metadata: { adminId: log.admin_id, pattern: 'rate_limit_violation' }
      };
    }

    // Check for anonymous access attempts
    if (log.action === 'anonymous_access_attempt') {
      return {
        id: `anonymous_access_${log.id}`,
        type: 'suspicious_login',
        message: `Anonymous access attempt to protected resource: ${log.details?.table}`,
        severity: 'medium',
        timestamp: log.created_at,
        metadata: { table: log.details?.table, operation: log.details?.operation }
      };
    }

    return null;
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, read: true }
        : alert
    ));
  };

  return {
    alerts,
    loading,
    dismissAlert,
    markAsRead,
    refetch: fetchSecurityAlerts
  };
};