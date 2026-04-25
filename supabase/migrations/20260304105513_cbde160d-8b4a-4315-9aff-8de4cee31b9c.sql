CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own glossary terms" ON public.glossary_terms FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own glossary terms" ON public.glossary_terms FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own glossary terms" ON public.glossary_terms FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own glossary terms" ON public.glossary_terms FOR DELETE TO authenticated USING (user_id = auth.uid());