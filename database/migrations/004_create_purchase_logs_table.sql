-- Create purchase_logs table
CREATE TABLE IF NOT EXISTS purchase_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT,
    product_description TEXT,
    points INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'demo',
    payment_status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_logs_user_id ON purchase_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_logs_product_id ON purchase_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_logs_created_at ON purchase_logs(created_at);

-- Enable RLS
ALTER TABLE purchase_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own purchase logs" ON purchase_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all purchase logs" ON purchase_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can insert their own purchase logs" ON purchase_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert purchase logs" ON purchase_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );