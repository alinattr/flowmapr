-- Fix legacy plan rows.
UPDATE subscriptions
SET plan = 'free', monthly_limit = 3
WHERE plan IN ('free_trial', 'team');

-- Restrict plan values to free/basic/pro only.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'basic', 'pro'));

-- Ensure signup trigger writes the new free plan defaults.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status, monthly_limit, generations_used)
  VALUES (NEW.id, 'free', 'active', 3, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
