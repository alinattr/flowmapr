UPDATE subscriptions
SET 
  plan = 'free',
  status = 'active',
  monthly_limit = 3,
  generations_used = 0,
  polar_subscription_id = NULL
WHERE user_id = '7e8cd297-6c0d-47f4-9557-578006e28ba1';
