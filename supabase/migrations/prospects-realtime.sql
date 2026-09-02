-- Active Realtime sur prospects (feedback RDV prospecteur)
ALTER TABLE public.prospects REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.prospects;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
