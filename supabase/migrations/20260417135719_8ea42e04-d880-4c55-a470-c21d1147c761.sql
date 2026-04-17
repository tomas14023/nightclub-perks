CREATE POLICY "Venue staff can update customers"
ON public.customers
FOR UPDATE
USING (public.user_in_venue(auth.uid(), venue_id));

CREATE POLICY "Venue staff can delete customers"
ON public.customers
FOR DELETE
USING (public.user_in_venue(auth.uid(), venue_id));