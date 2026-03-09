-- Fix existing free_trial rows that still have old limit.
UPDATE subscriptions
SET monthly_limit = 3
WHERE plan = 'free_trial';

-- Ensure new users get Free plan defaults.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, monthly_limit, generations_used)
  VALUES (NEW.id, 'free', 'active', 3, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
