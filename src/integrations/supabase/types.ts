export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          custom_css: string | null
          dark_bg: string | null
          dark_primary: string | null
          dark_secondary: string | null
          dark_text: string | null
          favicon_url: string | null
          font_family: string | null
          font_scale: Json | null
          id: string
          light_bg: string | null
          light_primary: string | null
          light_secondary: string | null
          light_text: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          og_image_url: string | null
          robots_follow: boolean | null
          robots_index: boolean | null
          seo_canonical: string | null
          seo_description: string | null
          seo_title: string | null
          seo_twitter: string | null
          site_tagline: string | null
          site_title: string
          updated_at: string | null
        }
        Insert: {
          custom_css?: string | null
          dark_bg?: string | null
          dark_primary?: string | null
          dark_secondary?: string | null
          dark_text?: string | null
          favicon_url?: string | null
          font_family?: string | null
          font_scale?: Json | null
          id?: string
          light_bg?: string | null
          light_primary?: string | null
          light_secondary?: string | null
          light_text?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          og_image_url?: string | null
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_canonical?: string | null
          seo_description?: string | null
          seo_title?: string | null
          seo_twitter?: string | null
          site_tagline?: string | null
          site_title?: string
          updated_at?: string | null
        }
        Update: {
          custom_css?: string | null
          dark_bg?: string | null
          dark_primary?: string | null
          dark_secondary?: string | null
          dark_text?: string | null
          favicon_url?: string | null
          font_family?: string | null
          font_scale?: Json | null
          id?: string
          light_bg?: string | null
          light_primary?: string | null
          light_secondary?: string | null
          light_text?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          og_image_url?: string | null
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_canonical?: string | null
          seo_description?: string | null
          seo_title?: string | null
          seo_twitter?: string | null
          site_tagline?: string | null
          site_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          credits_spent: number | null
          delivered: number | null
          failed: number | null
          queued: number | null
          sending: number | null
          sent: number | null
          undeliverable: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          credits_spent?: number | null
          delivered?: number | null
          failed?: number | null
          queued?: number | null
          sending?: number | null
          sent?: number | null
          undeliverable?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          credits_spent?: number | null
          delivered?: number | null
          failed?: number | null
          queued?: number | null
          sending?: number | null
          sent?: number | null
          undeliverable?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_targets: {
        Row: {
          account_id: string
          bulksms_message_id: string | null
          campaign_id: string
          contact_id: string | null
          cost_credits: number | null
          country_code: string | null
          credits_multiplier: number | null
          delivered_at: string | null
          error_code: string | null
          error_detail: string | null
          id: string
          last_attempt_at: string | null
          phone_e164: string
          queued_at: string | null
          rendered_message: string | null
          segments: number
          sent_at: string | null
          status: string
          tries: number | null
        }
        Insert: {
          account_id: string
          bulksms_message_id?: string | null
          campaign_id: string
          contact_id?: string | null
          cost_credits?: number | null
          country_code?: string | null
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_detail?: string | null
          id?: string
          last_attempt_at?: string | null
          phone_e164: string
          queued_at?: string | null
          rendered_message?: string | null
          segments?: number
          sent_at?: string | null
          status?: string
          tries?: number | null
        }
        Update: {
          account_id?: string
          bulksms_message_id?: string | null
          campaign_id?: string
          contact_id?: string | null
          cost_credits?: number | null
          country_code?: string | null
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_detail?: string | null
          id?: string
          last_attempt_at?: string | null
          phone_e164?: string
          queued_at?: string | null
          rendered_message?: string | null
          segments?: number
          sent_at?: string | null
          status?: string
          tries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string
          est_credits: number | null
          id: string
          message_template: string
          name: string
          schedule_at: string | null
          sender_id: string | null
          status: string
          timezone: string | null
          total_targets: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by: string
          est_credits?: number | null
          id?: string
          message_template: string
          name: string
          schedule_at?: string | null
          sender_id?: string | null
          status?: string
          timezone?: string | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string
          est_credits?: number | null
          id?: string
          message_template?: string
          name?: string
          schedule_at?: string | null
          sender_id?: string | null
          status?: string
          timezone?: string | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_import_jobs: {
        Row: {
          account_id: string
          created_at: string | null
          error: string | null
          file_path: string
          finished_at: string | null
          id: string
          original_name: string | null
          status: string
          totals: Json | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          error?: string | null
          file_path: string
          finished_at?: string | null
          id?: string
          original_name?: string | null
          status?: string
          totals?: Json | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          error?: string | null
          file_path?: string
          finished_at?: string | null
          id?: string
          original_name?: string | null
          status?: string
          totals?: Json | null
        }
        Relationships: []
      }
      contact_list_members: {
        Row: {
          added_at: string
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          rule: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rule?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rule?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_tag_pivot: {
        Row: {
          contact_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_pivot_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_pivot_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          attributes: Json | null
          created_at: string
          email: string | null
          id: string
          is_blocked: boolean | null
          name: string
          notes: string | null
          phone: string
          phone_e164: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          attributes?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name: string
          notes?: string | null
          phone: string
          phone_e164?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          attributes?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          phone_e164?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      country_pricing: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          credits_multiplier: number
          gateway_cost_multiplier: Json | null
          id: string
          is_active: boolean
          preferred_gateway: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          credits_multiplier?: number
          gateway_cost_multiplier?: Json | null
          id?: string
          is_active?: boolean
          preferred_gateway?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          credits_multiplier?: number
          gateway_cost_multiplier?: Json | null
          id?: string
          is_active?: boolean
          preferred_gateway?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_adjustments: {
        Row: {
          adjustment_type: string
          admin_id: string
          created_at: string
          delta: number
          id: string
          is_free_credit: boolean | null
          new_balance: number
          previous_balance: number
          reason: string
          user_id: string
        }
        Insert: {
          adjustment_type: string
          admin_id: string
          created_at?: string
          delta: number
          id?: string
          is_free_credit?: boolean | null
          new_balance: number
          previous_balance: number
          reason: string
          user_id: string
        }
        Update: {
          adjustment_type?: string
          admin_id?: string
          created_at?: string
          delta?: number
          id?: string
          is_free_credit?: boolean | null
          new_balance?: number
          previous_balance?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_adjustments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "credit_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_kwanza: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_kwanza: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_kwanza?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_requests: {
        Row: {
          admin_notes: string | null
          amount_kwanza: number
          created_at: string
          credits_requested: number
          id: string
          package_id: string | null
          payment_reference: string | null
          receipt_url: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_kwanza: number
          created_at?: string
          credits_requested: number
          id?: string
          package_id?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_kwanza?: number
          created_at?: string
          credits_requested?: number
          id?: string
          package_id?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_overrides: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          override_type: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          override_type?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          override_type?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gateway_routing_rules: {
        Row: {
          cost_threshold: number | null
          country_code: string
          created_at: string | null
          fallback_gateway: string | null
          id: string
          is_active: boolean | null
          primary_gateway: string
          priority_order: Json | null
          updated_at: string | null
        }
        Insert: {
          cost_threshold?: number | null
          country_code: string
          created_at?: string | null
          fallback_gateway?: string | null
          id?: string
          is_active?: boolean | null
          primary_gateway: string
          priority_order?: Json | null
          updated_at?: string | null
        }
        Update: {
          cost_threshold?: number | null
          country_code?: string
          created_at?: string | null
          fallback_gateway?: string | null
          id?: string
          is_active?: boolean | null
          primary_gateway?: string
          priority_order?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          account_id: string
          content: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          account_id: string
          content: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          attempts: number | null
          code: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          phone: string
          used: boolean
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          phone: string
          used?: boolean
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          phone?: string
          used?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          credits: number | null
          default_sender_id: string | null
          email: string | null
          email_confirm_expires_at: string | null
          email_confirm_token: string | null
          email_confirmed: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          user_status: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          credits?: number | null
          default_sender_id?: string | null
          email?: string | null
          email_confirm_expires_at?: string | null
          email_confirm_token?: string | null
          email_confirmed?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          user_status?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          credits?: number | null
          default_sender_id?: string | null
          email?: string | null
          email_confirm_expires_at?: string | null
          email_confirm_token?: string | null
          email_confirmed?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_status?: string | null
        }
        Relationships: []
      }
      quick_send_jobs: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          credits_estimated: number
          credits_spent: number
          id: string
          message: string
          segments_avg: number
          sender_id: string
          status: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          credits_estimated?: number
          credits_spent?: number
          id?: string
          message: string
          segments_avg?: number
          sender_id?: string
          status?: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          credits_estimated?: number
          credits_spent?: number
          id?: string
          message?: string
          segments_avg?: number
          sender_id?: string
          status?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: []
      }
      quick_send_targets: {
        Row: {
          bulksms_message_id: string | null
          contact_id: string | null
          country_code: string | null
          created_at: string
          credits_multiplier: number | null
          delivered_at: string | null
          error_code: string | null
          error_detail: string | null
          id: string
          job_id: string
          phone_e164: string
          rendered_message: string
          segments: number
          sent_at: string | null
          status: string
        }
        Insert: {
          bulksms_message_id?: string | null
          contact_id?: string | null
          country_code?: string | null
          created_at?: string
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_detail?: string | null
          id?: string
          job_id: string
          phone_e164: string
          rendered_message: string
          segments?: number
          sent_at?: string | null
          status?: string
        }
        Update: {
          bulksms_message_id?: string | null
          contact_id?: string | null
          country_code?: string | null
          created_at?: string
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_detail?: string | null
          id?: string
          job_id?: string
          phone_e164?: string
          rendered_message?: string
          segments?: number
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_send_targets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "quick_send_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sender_ids: {
        Row: {
          account_id: string | null
          bulksms_status: string | null
          created_at: string
          id: string
          is_default: boolean | null
          sender_id: string
          status: string | null
          supported_gateways: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          bulksms_status?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          sender_id: string
          status?: string | null
          supported_gateways?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          bulksms_status?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          sender_id?: string
          status?: string | null
          supported_gateways?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          message: string
          name: string
          scheduled_at: string | null
          status: string | null
          total_failed: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          status?: string | null
          total_failed?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          status?: string | null
          total_failed?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_configurations: {
        Row: {
          api_token_id_secret_name: string | null
          api_token_secret_name: string | null
          balance: number | null
          created_at: string
          credentials_encrypted: boolean | null
          gateway_name: string
          id: string
          is_active: boolean
          last_balance_check: string | null
          updated_at: string
        }
        Insert: {
          api_token_id_secret_name?: string | null
          api_token_secret_name?: string | null
          balance?: number | null
          created_at?: string
          credentials_encrypted?: boolean | null
          gateway_name: string
          id?: string
          is_active?: boolean
          last_balance_check?: string | null
          updated_at?: string
        }
        Update: {
          api_token_id_secret_name?: string | null
          api_token_secret_name?: string | null
          balance?: number | null
          created_at?: string
          credentials_encrypted?: boolean | null
          gateway_name?: string
          id?: string
          is_active?: boolean
          last_balance_check?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_gateways: {
        Row: {
          api_endpoint: string
          auth_type: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          auth_type: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          auth_type?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          cost_credits: number | null
          cost_optimization: boolean | null
          country_code: string | null
          country_detected: string | null
          created_at: string
          credits_multiplier: number | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          fallback_attempted: boolean | null
          gateway_message_id: string | null
          gateway_priority: string | null
          gateway_used: string | null
          id: string
          message: string
          original_gateway: string | null
          payload: Json | null
          phone_number: string
          routing_decision: Json | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          cost_credits?: number | null
          cost_optimization?: boolean | null
          country_code?: string | null
          country_detected?: string | null
          created_at?: string
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          fallback_attempted?: boolean | null
          gateway_message_id?: string | null
          gateway_priority?: string | null
          gateway_used?: string | null
          id?: string
          message: string
          original_gateway?: string | null
          payload?: Json | null
          phone_number: string
          routing_decision?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          cost_credits?: number | null
          cost_optimization?: boolean | null
          country_code?: string | null
          country_detected?: string | null
          created_at?: string
          credits_multiplier?: number | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          fallback_attempted?: boolean | null
          gateway_message_id?: string | null
          gateway_priority?: string | null
          gateway_used?: string | null
          id?: string
          message?: string
          original_gateway?: string | null
          payload?: Json | null
          phone_number?: string
          routing_decision?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_settings: {
        Row: {
          created_at: string
          created_by: string | null
          from_email: string
          from_name: string
          host: string
          id: string
          is_active: boolean | null
          last_tested_at: string | null
          password_encrypted: string
          port: number
          test_status: string | null
          updated_at: string
          use_tls: boolean
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_email: string
          from_name: string
          host: string
          id?: string
          is_active?: boolean | null
          last_tested_at?: string | null
          password_encrypted: string
          port?: number
          test_status?: string | null
          updated_at?: string
          use_tls?: boolean
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          is_active?: boolean | null
          last_tested_at?: string | null
          password_encrypted?: string
          port?: number
          test_status?: string | null
          updated_at?: string
          use_tls?: boolean
          username?: string
        }
        Relationships: []
      }
      smtp_test_logs: {
        Row: {
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
          test_email: string
          tested_at: string
          tested_by: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
          test_email: string
          tested_at?: string
          tested_by?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
          test_email?: string
          tested_at?: string
          tested_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_kwanza: number
          created_at: string
          credits_purchased: number
          id: string
          package_id: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_kwanza: number
          created_at?: string
          credits_purchased: number
          id?: string
          package_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_kwanza?: number
          created_at?: string
          credits_purchased?: number
          id?: string
          package_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted_at: string
          created_at: string
          document: string
          id: string
          ip_address: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          document: string
          id?: string
          ip_address?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          document?: string
          id?: string
          ip_address?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: { credit_amount: number; user_id: string }
        Returns: undefined
      }
      approve_credit_request: {
        Args: { admin_user_id: string; request_id: string }
        Returns: boolean
      }
      check_admin_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          action_type: string
          max_requests?: number
          time_window_minutes?: number
          user_identifier: string
        }
        Returns: boolean
      }
      check_session_security: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      clean_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_contacts_in_list: {
        Args: { list_id: string }
        Returns: number
      }
      debit_user_credits: {
        Args: {
          _account_id: string
          _amount: number
          _meta?: Json
          _reason: string
        }
        Returns: boolean
      }
      decrypt_smtp_password: {
        Args: { encrypted_password: string }
        Returns: string
      }
      encrypt_smtp_password: {
        Args: { password_text: string }
        Returns: string
      }
      get_active_gateway_override: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_account_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_default_sender_id: {
        Args: { account_user_id?: string }
        Returns: string
      }
      get_effective_sender_id: {
        Args: { _requested_sender_id?: string; _user_id: string }
        Returns: string
      }
      get_public_brand_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          dark_bg: string
          dark_primary: string
          dark_secondary: string
          dark_text: string
          favicon_url: string
          font_family: string
          light_bg: string
          light_primary: string
          light_secondary: string
          light_text: string
          logo_dark_url: string
          logo_light_url: string
          site_tagline: string
          site_title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: { details?: Json; event_type: string; user_identifier: string }
        Returns: undefined
      }
      migrate_sms_credentials_to_secrets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reject_credit_request: {
        Args: { admin_user_id: string; notes?: string; request_id: string }
        Returns: boolean
      }
      sanitize_html_input: {
        Args: { input_text: string }
        Returns: string
      }
      set_gateway_override: {
        Args: { _expires_at?: string; _override_type: string; _reason?: string }
        Returns: string
      }
      system_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_campaign_stats: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
      validate_admin_role_change: {
        Args: {
          admin_id: string
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      validate_secure_sms_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_sms_configuration: {
        Args: { config_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
    },
  },
} as const
