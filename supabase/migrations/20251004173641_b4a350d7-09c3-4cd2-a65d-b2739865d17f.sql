-- Create indexes for analytics performance
-- These indexes will significantly speed up analytics queries

-- Index for SMS logs analytics queries (date range, status, gateway, country)
CREATE INDEX IF NOT EXISTS idx_sms_logs_analytics 
ON sms_logs(created_at DESC, status, gateway_used, country_code);

-- Index for filtering by status only (delivery rate calculations)
CREATE INDEX IF NOT EXISTS idx_sms_logs_status_date 
ON sms_logs(status, created_at DESC);

-- Index for transactions analytics
CREATE INDEX IF NOT EXISTS idx_transactions_analytics 
ON transactions(created_at DESC, status, amount_kwanza);

-- Index for user profile status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status_date 
ON profiles(user_status, created_at DESC);

-- Index for campaigns analytics
CREATE INDEX IF NOT EXISTS idx_campaigns_status_date 
ON campaigns(status, created_at DESC);

-- Add comment explaining the optimization
COMMENT ON INDEX idx_sms_logs_analytics IS 'Composite index for analytics dashboard queries - optimizes date range filtering with status, gateway, and country grouping';
COMMENT ON INDEX idx_sms_logs_status_date IS 'Optimizes delivery rate calculations by status';
COMMENT ON INDEX idx_transactions_analytics IS 'Speeds up financial metrics queries';
COMMENT ON INDEX idx_profiles_status_date IS 'Optimizes user metrics queries';
COMMENT ON INDEX idx_campaigns_status_date IS 'Optimizes campaign analytics queries';
