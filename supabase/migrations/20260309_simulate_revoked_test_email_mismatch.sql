-- Simulate subscription.revoked for test user with email mismatch
-- User registered as test@gmail.com in Polar but different email in app
UPDATE subscriptions
SET
  plan = 'free',
  status = 'active',
  monthly_limit = 3,
  generations_used = 0,
  polar_subscription_id = NULL
WHERE polar_subscription_id = 'ab09d728-c5a2-4ce7-a8b0-92c85452e19c';

-- Verify result
SELECT user_id, plan, status, monthly_limit, generations_used, polar_subscription_id
FROM subscriptions
WHERE user_id = (
  SELECT user_id FROM subscriptions
  WHERE polar_subscription_id IS NULL
  ORDER BY updated_at DESC
  LIMIT 1
);
