ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_check
CHECK (plan = ANY (ARRAY['free'::text, 'free_trial'::text, 'basic'::text, 'pro'::text, 'team'::text]));
