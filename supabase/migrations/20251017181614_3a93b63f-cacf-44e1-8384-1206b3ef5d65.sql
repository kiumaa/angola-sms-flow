-- Permitir que admin_id seja NULL em admin_audit_logs para operações do sistema
ALTER TABLE admin_audit_logs 
ALTER COLUMN admin_id DROP NOT NULL;

-- Atualizar a função de auditoria para usar NULL quando não há usuário autenticado
CREATE OR REPLACE FUNCTION public.audit_financial_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all financial transaction operations with enhanced security
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    auth.uid(), -- NULL para operações do sistema/service_role
    'financial_transaction_' || TG_OP::text,
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'transaction_id', COALESCE(NEW.id, OLD.id),
      'amount_category', 
        CASE 
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 1000 THEN 'small'
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 10000 THEN 'medium'
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 100000 THEN 'large'
          ELSE 'very_large'
        END,
      'credits_purchased', COALESCE(NEW.credits_purchased, OLD.credits_purchased),
      'status', COALESCE(NEW.status, OLD.status),
      'payment_method', COALESCE(NEW.payment_method, OLD.payment_method),
      'payment_reference_hash', 
        CASE 
          WHEN COALESCE(NEW.payment_reference, OLD.payment_reference) IS NOT NULL 
          THEN md5(COALESCE(NEW.payment_reference, OLD.payment_reference))
          ELSE NULL
        END,
      'operation_timestamp', now(),
      'role', current_setting('role'),
      'security_level', 
        CASE 
          WHEN current_setting('role') = 'service_role' THEN 'system'
          WHEN auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role) THEN 'admin'
          ELSE 'user'
        END
    ),
    inet_client_addr()
  );
  
  -- Log high-value transactions separately for enhanced monitoring
  IF COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) > 50000 THEN
    PERFORM log_security_event('high_value_transaction', 
      COALESCE(NEW.user_id, OLD.user_id), 
      jsonb_build_object(
        'transaction_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'amount_category', 'high_value',
        'requires_review', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;