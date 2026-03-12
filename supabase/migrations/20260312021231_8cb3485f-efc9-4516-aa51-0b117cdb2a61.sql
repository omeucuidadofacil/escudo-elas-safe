
-- Add new fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone_celular TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cep TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rua TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS numero TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS complemento TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bairro TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cadastro_completo BOOLEAN NOT NULL DEFAULT false;

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles: users can see their own roles, admins can see all
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies for profiles (admin can see all profiles)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for contatos_emergencia
CREATE POLICY "Admins can view all contacts"
  ON public.contatos_emergencia FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for alertas
CREATE POLICY "Admins can view all alerts"
  ON public.alertas FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all alerts"
  ON public.alertas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for incidentes
CREATE POLICY "Admins can delete any incident"
  ON public.incidentes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any incident"
  ON public.incidentes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for localizacao_tempo_real
CREATE POLICY "Admins can view all locations"
  ON public.localizacao_tempo_real FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
