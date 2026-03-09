ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS polar_customer_id text;
