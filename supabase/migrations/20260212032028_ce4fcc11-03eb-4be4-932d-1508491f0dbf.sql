
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin');

-- Tabela de papéis (separada do auth.users)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função segura para verificar papel (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: apenas admins leem a tabela de papéis
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de escrita para business_rules
CREATE POLICY "Admins can insert rules"
  ON public.business_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rules"
  ON public.business_rules FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rules"
  ON public.business_rules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de escrita para roadmap_items
CREATE POLICY "Admins can insert roadmap"
  ON public.roadmap_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roadmap"
  ON public.roadmap_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roadmap"
  ON public.roadmap_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de escrita para development_history
CREATE POLICY "Admins can insert history"
  ON public.development_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update history"
  ON public.development_history FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete history"
  ON public.development_history FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
