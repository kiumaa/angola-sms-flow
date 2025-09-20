-- Ajuste de RLS para exibir pacotes publicamente e manter controle admin

-- 1) Remover políticas antigas que estão restritivas
DROP POLICY IF EXISTS "Admins can manage packages" ON public.credit_packages;
DROP POLICY IF EXISTS "Authenticated users can view active packages" ON public.credit_packages;

-- 2) Criar políticas PERMISSIVE corretas
-- Permitir que qualquer usuário (anon/autenticado) visualize pacotes ativos
CREATE POLICY "Public can view active packages"
ON public.credit_packages
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admins podem gerenciar tudo (INSERT/UPDATE/DELETE/SELECT)
CREATE POLICY "Admins can manage packages"
ON public.credit_packages
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
