import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          id: string;
          admin_id: string;
          title: string;
          message: string;
          target_type: 'all' | 'specific' | 'role';
          target_users: string[] | null;
          target_role: 'admin' | 'client' | null;
          priority: 'info' | 'warning' | 'urgent';
          category: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          title: string;
          message: string;
          target_type: 'all' | 'specific' | 'role';
          target_users?: string[] | null;
          target_role?: 'admin' | 'client' | null;
          priority?: 'info' | 'warning' | 'urgent';
          category?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          title?: string;
          message?: string;
          target_type?: 'all' | 'specific' | 'role';
          target_users?: string[] | null;
          target_role?: 'admin' | 'client' | null;
          priority?: 'info' | 'warning' | 'urgent';
          category?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_notifications: {
        Row: {
          id: string;
          notification_id: string;
          user_id: string;
          read_at: string | null;
          dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id: string;
          user_id: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notification_id?: string;
          user_id?: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (req.method === 'GET' && path === 'stats') {
      // Get notification statistics
      const notificationId = url.searchParams.get('notification_id');
      
      if (!notificationId) {
        throw new Error('notification_id parameter is required');
      }

      const { data: userNotifications, error } = await supabase
        .from('user_notifications')
        .select('read_at, dismissed_at')
        .eq('notification_id', notificationId);

      if (error) throw error;

      const stats = {
        total_recipients: userNotifications.length,
        read_count: userNotifications.filter(n => n.read_at !== null).length,
        dismissed_count: userNotifications.filter(n => n.dismissed_at !== null).length,
        active_count: userNotifications.filter(n => n.dismissed_at === null).length,
      };

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'send-realtime') {
      // Send real-time notification to users
      const { notification_id } = await req.json();
      
      if (!notification_id) {
        throw new Error('notification_id is required');
      }

      // Get notification details
      const { data: notification, error: notificationError } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('id', notification_id)
        .single();

      if (notificationError) throw notificationError;

      // Get target users for this notification
      const { data: userNotifications, error: userNotificationsError } = await supabase
        .from('user_notifications')
        .select('user_id')
        .eq('notification_id', notification_id)
        .is('dismissed_at', null);

      if (userNotificationsError) throw userNotificationsError;

      // Send real-time notifications via Supabase Realtime
      for (const userNotification of userNotifications) {
        const channel = supabase.channel(`user_${userNotification.user_id}_notifications`);
        
        await channel.send({
          type: 'broadcast',
          event: 'admin_notification',
          payload: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            category: notification.category,
            created_at: notification.created_at,
          }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        sent_to: userNotifications.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-notifications-api:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});