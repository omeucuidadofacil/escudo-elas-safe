
-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Emergency contacts table
CREATE TABLE public.contatos_emergencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  relacao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_emergencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.contatos_emergencia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON public.contatos_emergencia FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.contatos_emergencia FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.contatos_emergencia FOR DELETE USING (auth.uid() = user_id);

-- Alerts table
CREATE TABLE public.alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_alerta TEXT NOT NULL DEFAULT 'sos',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON public.alertas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.alertas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.alertas FOR UPDATE USING (auth.uid() = user_id);

-- Incidents table (community reports)
CREATE TABLE public.incidentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view incidents" ON public.incidentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own incidents" ON public.incidentes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incidents" ON public.incidentes FOR DELETE USING (auth.uid() = user_id);

-- Real-time location table
CREATE TABLE public.localizacao_tempo_real (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.localizacao_tempo_real ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location" ON public.localizacao_tempo_real FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own location" ON public.localizacao_tempo_real FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for alerts and location
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.localizacao_tempo_real;
