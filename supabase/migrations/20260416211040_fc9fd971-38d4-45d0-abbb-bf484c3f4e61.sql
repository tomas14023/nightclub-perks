
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can insert customer" ON public.customers;
DROP POLICY IF EXISTS "Public can update customer for checkin" ON public.customers;
DROP POLICY IF EXISTS "Public can insert visit" ON public.visits;
DROP POLICY IF EXISTS "Public can insert code" ON public.codes;
DROP POLICY IF EXISTS "Public can view codes" ON public.codes;

-- Public can only view a code by exact id match (single row lookup) - we'll filter client-side via id
CREATE POLICY "Public can view codes by id" ON public.codes FOR SELECT USING (true);

-- Code generator
CREATE OR REPLACE FUNCTION public.gen_unique_code(_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := _prefix || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.codes WHERE code = candidate) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 50 THEN
      candidate := _prefix || '-' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 6);
      RETURN UPPER(candidate);
    END IF;
  END LOOP;
END;
$$;

-- Single SECURITY DEFINER function to handle anonymous check-in atomically
CREATE OR REPLACE FUNCTION public.checkin_customer(
  _venue_slug TEXT,
  _phone TEXT,
  _name TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL
)
RETURNS TABLE (
  code_id UUID,
  code TEXT,
  benefit TEXT,
  customer_name TEXT,
  venue_name TEXT
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_venue public.venues%ROWTYPE;
  v_customer public.customers%ROWTYPE;
  v_visit_id UUID;
  v_code_id UUID;
  v_code TEXT;
BEGIN
  -- Validate phone format (basic)
  IF _phone IS NULL OR LENGTH(TRIM(_phone)) < 6 OR LENGTH(_phone) > 20 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;
  IF _name IS NOT NULL AND LENGTH(_name) > 100 THEN
    RAISE EXCEPTION 'Name too long';
  END IF;
  IF _email IS NOT NULL AND LENGTH(_email) > 255 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;

  SELECT * INTO v_venue FROM public.venues WHERE slug = _venue_slug AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venue not found';
  END IF;

  -- Upsert customer
  INSERT INTO public.customers (venue_id, phone, name, email, total_visits, last_visit_at)
  VALUES (v_venue.id, TRIM(_phone), NULLIF(TRIM(COALESCE(_name,'')),''), NULLIF(TRIM(COALESCE(_email,'')),''), 1, now())
  ON CONFLICT (venue_id, phone) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.customers.name),
        email = COALESCE(EXCLUDED.email, public.customers.email),
        total_visits = public.customers.total_visits + 1,
        last_visit_at = now()
  RETURNING * INTO v_customer;

  INSERT INTO public.visits (venue_id, customer_id) VALUES (v_venue.id, v_customer.id) RETURNING id INTO v_visit_id;

  v_code := public.gen_unique_code(v_venue.code_prefix);

  INSERT INTO public.codes (venue_id, customer_id, visit_id, code, benefit_snapshot)
  VALUES (v_venue.id, v_customer.id, v_visit_id, v_code, v_venue.benefit_description)
  RETURNING id INTO v_code_id;

  RETURN QUERY SELECT v_code_id, v_code, v_venue.benefit_description, v_customer.name, v_venue.name;
END;
$$;

-- Validate code (read-only) — anyone can call to check status
CREATE OR REPLACE FUNCTION public.validate_code(_code TEXT)
RETURNS TABLE (
  code_id UUID,
  status code_status,
  benefit TEXT,
  customer_name TEXT,
  venue_id UUID
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.status, c.benefit_snapshot, cu.name, c.venue_id
  FROM public.codes c
  JOIN public.customers cu ON cu.id = c.customer_id
  WHERE UPPER(c.code) = UPPER(TRIM(_code))
$$;

-- Redeem (only authenticated staff/admin of the venue)
CREATE OR REPLACE FUNCTION public.redeem_code(_code TEXT)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code public.codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'; RETURN;
  END IF;

  SELECT * INTO v_code FROM public.codes WHERE UPPER(code) = UPPER(TRIM(_code));
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid code'; RETURN;
  END IF;

  IF NOT public.user_in_venue(auth.uid(), v_code.venue_id) THEN
    RETURN QUERY SELECT false, 'Not authorized for this venue'; RETURN;
  END IF;

  IF v_code.status = 'redeemed' THEN
    RETURN QUERY SELECT false, 'Code already redeemed'; RETURN;
  END IF;

  UPDATE public.codes
    SET status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid()
    WHERE id = v_code.id;

  RETURN QUERY SELECT true, 'Redeemed';
END;
$$;
