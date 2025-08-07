-- Create appointment_logs table
CREATE TABLE IF NOT EXISTS appointment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('booked', 'cancelled', 'completed')),
    action_by UUID NOT NULL REFERENCES users(id),
    action_by_name TEXT NOT NULL,
    action_by_role TEXT NOT NULL CHECK (action_by_role IN ('user', 'trainer', 'admin')),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    trainer_id UUID NOT NULL,
    trainer_name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    used_point_batch_id TEXT,
    purchase_item_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_logs_appointment_id ON appointment_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_action_by ON appointment_logs(action_by);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_user_id ON appointment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_trainer_id ON appointment_logs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_date ON appointment_logs(appointment_date);

-- Enable RLS
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own appointment logs" ON appointment_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Trainers can view their appointment logs" ON appointment_logs
    FOR SELECT USING (
        trainer_id = auth.uid() OR user_id = auth.uid()
    );

CREATE POLICY "Admins can view all appointment logs" ON appointment_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can insert appointment logs" ON appointment_logs
    FOR INSERT WITH CHECK (
        action_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );