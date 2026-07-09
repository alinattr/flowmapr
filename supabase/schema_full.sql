-- Full public schema bootstrap from dev 
-- Idempotent where possible.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remove drift from previous partial runs on fresh prod.
DROP TABLE IF EXISTS public.generation_counters CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_counter ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_counter() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_generation_counter(uuid) CASCADE;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  onboarding_completed boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366F1'::text,
  is_default boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366F1'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled diagram'::text,
  diagram_type text NOT NULL,
  flow_data jsonb NOT NULL DEFAULT '{"edges": [], "nodes": []}'::jsonb,
  is_public boolean DEFAULT false,
  public_slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  prompt text,
  preview_svg text,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.api_lens_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  raw_input text,
  parsed_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  public_slug text UNIQUE
);

CREATE TABLE IF NOT EXISTS public.generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagram_id uuid REFERENCES public.diagrams(id) ON DELETE SET NULL,
  prompt text,
  diagram_type text,
  success boolean DEFAULT true,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagram_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id uuid REFERENCES public.diagrams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  label text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free_trial'::text,
  status text NOT NULL DEFAULT 'active'::text,
  polar_subscription_id text UNIQUE,
  monthly_limit integer NOT NULL DEFAULT 5,
  generations_used integer NOT NULL DEFAULT 0,
  period_start timestamptz,
  period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  team_id uuid UNIQUE,
  max_seats integer DEFAULT 1,
  seats_used integer DEFAULT 0,
  polar_customer_id text
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_plan_check'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_check
      CHECK ((plan = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text])));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  content jsonb,
  diagram_id uuid REFERENCES public.diagrams(id) ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'artifacts_type_check'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE public.artifacts
      ADD CONSTRAINT artifacts_type_check
      CHECK ((type = ANY (ARRAY['diagram'::text, 'code_lens'::text, 'api_lens'::text, 'explain_diagram'::text])));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS artifacts_project_id_idx ON public.artifacts USING btree (project_id);
CREATE INDEX IF NOT EXISTS artifacts_type_idx ON public.artifacts USING btree (type);
CREATE INDEX IF NOT EXISTS artifacts_user_id_idx ON public.artifacts USING btree (user_id);
CREATE INDEX IF NOT EXISTS diagram_versions_diagram_id_created_at_idx ON public.diagram_versions USING btree (diagram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS diagrams_project_id_idx ON public.diagrams USING btree (project_id);
CREATE INDEX IF NOT EXISTS diagrams_user_id_updated_at ON public.diagrams USING btree (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagrams_folder_id ON public.diagrams USING btree (folder_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_public_slug ON public.diagrams USING btree (public_slug) WHERE (public_slug IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders USING btree (user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects USING btree (user_id);

ALTER TABLE public.api_lens_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public API Lens results readable by anyone" ON public.api_lens_results;
CREATE POLICY "Public API Lens results readable by anyone" ON public.api_lens_results
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can delete own api_lens_results" ON public.api_lens_results;
CREATE POLICY "Users can delete own api_lens_results" ON public.api_lens_results
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own api_lens_results" ON public.api_lens_results;
CREATE POLICY "Users can insert own api_lens_results" ON public.api_lens_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own api_lens_results" ON public.api_lens_results;
CREATE POLICY "Users can read own api_lens_results" ON public.api_lens_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own artifacts only" ON public.artifacts;
CREATE POLICY "own artifacts only" ON public.artifacts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own versions only" ON public.diagram_versions;
CREATE POLICY "own versions only" ON public.diagram_versions
  FOR ALL
  USING (diagram_id IN (SELECT diagrams.id FROM public.diagrams WHERE diagrams.user_id = auth.uid()))
  WITH CHECK (diagram_id IN (SELECT diagrams.id FROM public.diagrams WHERE diagrams.user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow public read for shared diagrams" ON public.diagrams;
CREATE POLICY "Allow public read for shared diagrams" ON public.diagrams
  FOR SELECT USING ((is_public = true) AND (public_slug IS NOT NULL));

DROP POLICY IF EXISTS "Public diagrams readable by anyone" ON public.diagrams;
CREATE POLICY "Public diagrams readable by anyone" ON public.diagrams
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can manage own diagrams" ON public.diagrams;
CREATE POLICY "Users can manage own diagrams" ON public.diagrams
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own folders" ON public.folders;
CREATE POLICY "Users can insert own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON public.generation_log;
CREATE POLICY "Users can insert own logs" ON public.generation_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own logs" ON public.generation_log;
CREATE POLICY "Users can view own logs" ON public.generation_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "own projects only" ON public.projects;
CREATE POLICY "own projects only" ON public.projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status, monthly_limit, generations_used)
  VALUES (NEW.id, 'free', 'active', 3, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_project()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.projects (user_id, name, is_default, color)
  VALUES (NEW.id, 'My workspace', TRUE, '#6366F1')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_generation_counter(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rows_affected int;
begin
  update public.subscriptions
  set generations_used = generations_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and generations_used < monthly_limit;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS diagrams_updated_at ON public.diagrams;
CREATE TRIGGER diagrams_updated_at
  BEFORE UPDATE ON public.diagrams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_project ON auth.users;
CREATE TRIGGER on_auth_user_created_project
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_project();
