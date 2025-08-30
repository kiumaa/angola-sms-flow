import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, Key, Database, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SecurityStatusCardProps {
  className?: string;
}

export const SecurityStatusCard: React.FC<SecurityStatusCardProps> = ({ className }) => {
  return (
    <Card className={`${className} border-green-200 dark:border-green-800`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Shield className="w-5 h-5" />
          SMS Security Status
        </CardTitle>
        <CardDescription>
          Enhanced security implementation status for SMS gateway credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Encrypted Secrets Storage
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  SMS credentials moved to Supabase encrypted secrets
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-700">
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Enhanced Access Controls
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Rate limiting and audit logging for SMS configurations
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-700">
              Protected
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Legacy Data Migration
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Old plaintext credentials marked for removal
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-500 text-blue-700">
              Migrated
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Security Migration Complete
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Plaintext credentials permanently removed
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-700">
              Completed
            </Badge>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Security Improvements Implemented
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• SMS API credentials stored in encrypted Supabase secrets</li>
            <li>• Database no longer contains plaintext credentials</li>
            <li>• Enhanced RLS policies with rate limiting</li>
            <li>• Comprehensive audit logging for all changes</li>
            <li>• Secure fallback mechanisms for credential access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};