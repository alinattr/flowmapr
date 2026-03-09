UPDATE subscriptions
SET monthly_limit = 3
WHERE plan IN ('free', 'free_trial');
