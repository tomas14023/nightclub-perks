
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  venue_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  benefit_headline TEXT NOT NULL DEFAULT 'Scan & get 2x1 drinks until 11PM 🍸',
  benefit_description TEXT NOT NULL DEFAULT 'Enjoy your 2x1 drinks until 11PM',
  code_prefix TEXT NOT NULL DEFAULT 'CLUB',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  total_visits INTEGER NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venue_id, phone)
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_customers_venue ON public.customers(venue_id);

CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_visits_venue ON public.visits(venue_id);

CREATE TYPE public.code_status AS ENUM ('unused', 'redeemed');
CREATE TABLE public.codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status code_status NOT NULL DEFAULT 'unused',
  benefit_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_codes_venue ON public.codes(venue_id);
CREATE INDEX idx_codes_code ON public.codes(code);

CREATE OR REPLACE FUNCTION public.user_in_venue(_user_id uuid, _venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.venues v WHERE v.id = _venue_id AND v.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id AND p.venue_id = _venue_id)
$$;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view active venues" ON public.venues FOR SELECT USING (active = true);
CREATE POLICY "Authenticated can insert venue" ON public.venues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update venue" ON public.venues FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete venue" ON public.venues FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Public can insert customer" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update customer for checkin" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Venue staff can view customers" ON public.customers FOR SELECT USING (public.user_in_venue(auth.uid(), venue_id));

CREATE POLICY "Public can insert visit" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Venue staff can view visits" ON public.visits FOR SELECT USING (public.user_in_venue(auth.uid(), venue_id));

CREATE POLICY "Public can insert code" ON public.codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view codes" ON public.codes FOR SELECT USING (true);
CREATE POLICY "Venue staff can update codes" ON public.codes FOR UPDATE USING (public.user_in_venue(auth.uid(), venue_id));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.venues (id, name, slug, benefit_headline, benefit_description, code_prefix)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nocturne', 'nocturne',
  'Scan & get 2x1 drinks until 11PM 🍸', 'Enjoy your 2x1 drinks until 11PM', 'CLUB');
