ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS ai_persona text NOT NULL DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS verbosity text NOT NULL DEFAULT 'normal';