-- Studio Vit PT Scheduling App - PostgreSQL Schema
-- Description: Complete database schema for the fitness appointment scheduling system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS appointment_logs CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS purchase_logs CASCADE;
DROP TABLE IF EXISTS point_batches CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products table (purchasable point packages)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL CHECK (points > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes IN (30, 60)),
    trainer_type VARCHAR(20) NOT NULL CHECK (trainer_type IN ('trainer', 'head_trainer')) DEFAULT 'trainer',
    sale_rate DECIMAL(5,4) DEFAULT 0.0000, -- Percentage that goes to sales team (0.0000 to 1.0000)
    recv_rate DECIMAL(5,4) DEFAULT 0.0000, -- Percentage that goes to trainers for monthly settlement (0.0000 to 1.0000)
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (sale_rate >= 0 AND sale_rate <= 1),
    CHECK (recv_rate >= 0 AND recv_rate <= 1)
);

-- Create users table (includes trainers, users, and admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(10) CHECK (role IN ('user', 'trainer', 'admin')) NOT NULL DEFAULT 'user',
    trainer_type VARCHAR(20) CHECK (trainer_type IN ('trainer', 'head_trainer')), -- Only for users with role='trainer'
    assigned_trainer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For users: which trainer they're assigned to
    password_hash VARCHAR(255), -- For future authentication implementation
    total_points INTEGER DEFAULT 0,
    specialization VARCHAR(100), -- For trainers: their specialization area
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints to ensure data integrity
    CHECK ((role = 'trainer' AND trainer_type IS NOT NULL) OR (role != 'trainer' AND trainer_type IS NULL)),
    CHECK ((role = 'user' AND assigned_trainer_id IS NOT NULL) OR (role != 'user'))
);

-- Create sessions table (for HTTP-only cookie authentication)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(128) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create point_batches table (tracks point purchases and expiration)
CREATE TABLE point_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    original_points INTEGER NOT NULL,
    remaining_points INTEGER NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    price_paid DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (remaining_points >= 0),
    CHECK (remaining_points <= original_points)
);

-- Create purchase_logs table (tracks all point purchases)
CREATE TABLE purchase_logs (
    purchase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    points INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20), -- card, cash, bank_transfer, etc.
    payment_status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100),
    trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    trainer_name VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes IN (30, 60)),
    status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) NOT NULL DEFAULT 'scheduled',
    used_point_batch_id UUID REFERENCES point_batches(id),
    product_id UUID REFERENCES products(id), -- Which product the used points came from
    notes TEXT,
    cancelled_by UUID, -- user_id of who cancelled (user, trainer, admin)
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no double booking for same trainer at same time (considering duration)
    UNIQUE(trainer_id, appointment_date, appointment_time)
);

-- Create appointment_logs table (audit trail for all appointment actions)
CREATE TABLE appointment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    action VARCHAR(20) CHECK (action IN ('booked', 'cancelled', 'completed', 'no_show', 'rescheduled')) NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action_by_name VARCHAR(100) NOT NULL,
    action_by_role VARCHAR(10) CHECK (action_by_role IN ('user', 'trainer', 'admin')) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    trainer_id UUID NOT NULL,
    trainer_name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    used_point_batch_id UUID,
    product_id UUID REFERENCES products(id), -- Which product the used points came from
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_trainer_type ON users(trainer_type);
CREATE INDEX idx_users_assigned_trainer ON users(assigned_trainer_id);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_active);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_display_order ON products(display_order);
CREATE INDEX idx_products_duration ON products(duration_minutes);
CREATE INDEX idx_products_trainer_type ON products(trainer_type);

CREATE INDEX idx_point_batches_user_id ON point_batches(user_id);
CREATE INDEX idx_point_batches_product_id ON point_batches(product_id);
CREATE INDEX idx_point_batches_expiry ON point_batches(expiry_date);
CREATE INDEX idx_point_batches_active ON point_batches(is_active);

CREATE INDEX idx_purchase_logs_user_id ON purchase_logs(user_id);
CREATE INDEX idx_purchase_logs_product_id ON purchase_logs(product_id);
CREATE INDEX idx_purchase_logs_datetime ON purchase_logs(datetime);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_trainer_id ON appointments(trainer_id);
CREATE INDEX idx_appointments_product_id ON appointments(product_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_duration ON appointments(duration_minutes);
CREATE INDEX idx_appointments_time_range ON appointments(appointment_date, appointment_time, duration_minutes);

CREATE INDEX idx_appointment_logs_appointment_id ON appointment_logs(appointment_id);
CREATE INDEX idx_appointment_logs_action_by ON appointment_logs(action_by);
CREATE INDEX idx_appointment_logs_product_id ON appointment_logs(product_id);
CREATE INDEX idx_appointment_logs_timestamp ON appointment_logs(timestamp);
CREATE INDEX idx_appointment_logs_date ON appointment_logs(appointment_date);

-- Add constraint function to ensure users can only book with their assigned trainer
CREATE OR REPLACE FUNCTION check_trainer_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check for admins making appointments for others
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Check if user is trying to book with their assigned trainer
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = NEW.user_id 
            AND assigned_trainer_id = NEW.trainer_id
        ) THEN
            RAISE EXCEPTION 'User can only book appointments with their assigned trainer';
        END IF;
        
        -- Check if trainer type matches product trainer type
        IF NOT EXISTS (
            SELECT 1 FROM users u
            JOIN products p ON p.id = NEW.product_id
            WHERE u.id = NEW.trainer_id 
            AND u.trainer_type = p.trainer_type
        ) THEN
            RAISE EXCEPTION 'Product trainer type must match trainer type';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce trainer assignment constraint
CREATE TRIGGER enforce_trainer_assignment
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_trainer_assignment();

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_point_batches_updated_at BEFORE UPDATE ON point_batches
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to automatically update user total_points when point_batches change
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's total_points based on active point batches
    UPDATE users 
    SET total_points = (
        SELECT COALESCE(SUM(remaining_points), 0)
        FROM point_batches 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
        AND is_active = true 
        AND expiry_date > CURRENT_TIMESTAMP
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_points_on_batch_change 
    AFTER INSERT OR UPDATE OR DELETE ON point_batches
    FOR EACH ROW EXECUTE PROCEDURE update_user_total_points();

-- Schema is now ready for production use
-- For sample/dummy data, run the dummy.sql file after this schema

-- Create views for common queries

-- View for active users with their current points
CREATE VIEW v_users_with_points AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.role,
    u.total_points,
    u.memo,
    u.created_at,
    COALESCE(SUM(pb.remaining_points), 0) as calculated_points,
    COUNT(pb.id) as active_batches
FROM users u
LEFT JOIN point_batches pb ON u.id = pb.user_id 
    AND pb.is_active = true 
    AND pb.expiry_date > CURRENT_TIMESTAMP
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email, u.phone, u.role, u.total_points, u.memo, u.created_at;

-- View for appointment statistics by trainer and month
CREATE VIEW v_monthly_trainer_stats AS
SELECT 
    u.id as trainer_id,
    u.name as trainer_name,
    u.specialization as trainer_specialization,
    DATE_TRUNC('month', a.appointment_date) as month_year,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_appointments,
    p.id as product_id,
    p.name as product_name,
    p.recv_rate as trainer_commission_rate,
    COUNT(CASE WHEN a.status = 'completed' AND a.product_id IS NOT NULL THEN 1 END) as completed_by_product,
    COUNT(CASE WHEN a.status = 'cancelled' AND a.product_id IS NOT NULL THEN 1 END) as cancelled_by_product,
    -- Calculate trainer revenue for completed sessions
    SUM(CASE WHEN a.status = 'completed' AND p.price IS NOT NULL THEN p.price * p.recv_rate ELSE 0 END) as trainer_revenue
FROM users u
LEFT JOIN appointments a ON u.id = a.trainer_id
LEFT JOIN products p ON a.product_id = p.id
WHERE u.role = 'trainer' AND a.appointment_date IS NOT NULL
GROUP BY u.id, u.name, u.specialization, DATE_TRUNC('month', a.appointment_date), p.id, p.name, p.recv_rate
ORDER BY month_year DESC, u.name, p.display_order;

-- View for purchase statistics
CREATE VIEW v_purchase_stats AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.points as product_points,
    p.price as product_price,
    COUNT(*) as total_purchases,
    SUM(pl.points) as total_points_sold,
    SUM(pl.price) as total_revenue,
    AVG(pl.price) as avg_price,
    MIN(pl.datetime) as first_purchase,
    MAX(pl.datetime) as last_purchase,
    SUM(pl.price * p.sale_rate) as total_sales_commission,
    SUM(pl.price * p.recv_rate) as total_trainer_revenue
FROM products p
LEFT JOIN purchase_logs pl ON p.id = pl.product_id
WHERE pl.payment_status = 'completed' OR pl.payment_status IS NULL
GROUP BY p.id, p.name, p.points, p.price, p.sale_rate, p.recv_rate
ORDER BY total_revenue DESC NULLS LAST;

-- View for active products (for frontend display)
CREATE VIEW v_active_products AS
SELECT 
    id,
    name,
    description,
    points,
    price,
    display_order,
    -- Calculate value per point
    ROUND(price / points, 0) as price_per_point
FROM products 
WHERE is_active = true
ORDER BY display_order, id;

-- View for trainers (for easy querying of trainers without role filtering)
CREATE VIEW v_trainers AS
SELECT 
    id,
    name,
    email,
    phone,
    specialization,
    is_active,
    created_at,
    updated_at
FROM users 
WHERE role = 'trainer'
ORDER BY name;

-- Add comments to tables for documentation
COMMENT ON TABLE products IS 'Purchasable point packages with pricing and commission rates';
COMMENT ON TABLE users IS 'Stores all user accounts (users, trainers, admins) with authentication';
COMMENT ON TABLE sessions IS 'HTTP-only cookie sessions for secure authentication';
COMMENT ON TABLE point_batches IS 'Tracks individual point purchases with expiration dates (FIFO consumption)';
COMMENT ON TABLE purchase_logs IS 'Audit log of all point purchases with payment status';
COMMENT ON TABLE appointments IS 'Main appointments table with trainer and user details';
COMMENT ON TABLE appointment_logs IS 'Complete audit trail for all appointment-related actions';

COMMENT ON COLUMN users.specialization IS 'For trainers: their area of expertise (Strength & Conditioning, Yoga, etc.)';
COMMENT ON COLUMN users.total_points IS 'For users: current point balance, always 0 for trainers and admins';
COMMENT ON COLUMN users.role IS 'user (customers), trainer (fitness trainers), admin (administrators)';

COMMENT ON COLUMN products.sale_rate IS 'Commission rate for sales team (0.0000 to 1.0000)';
COMMENT ON COLUMN products.recv_rate IS 'Revenue share rate for trainers in monthly settlement (0.0000 to 1.0000)';
COMMENT ON COLUMN appointments.status IS 'scheduled, completed, cancelled, no_show';
COMMENT ON COLUMN appointments.used_point_batch_id IS 'Which point batch was consumed for this appointment';
COMMENT ON COLUMN appointments.product_id IS 'Which product the consumed points came from';

-- Create sample data functions (optional - for testing)
CREATE OR REPLACE FUNCTION create_sample_point_batch(
    p_user_id UUID,
    p_product_id UUID
) RETURNS UUID AS $$
DECLARE
    batch_id UUID;
    purchase_id UUID;
    product_points INTEGER;
    product_price DECIMAL(10,2);
BEGIN
    -- Get product details
    SELECT points, price INTO product_points, product_price
    FROM products WHERE id = p_product_id AND is_active = true;
    
    IF product_points IS NULL THEN
        RAISE EXCEPTION 'Product % not found or not active', p_product_id;
    END IF;
    
    -- Generate unique IDs
    batch_id := uuid_generate_v4();
    purchase_id := uuid_generate_v4();
    
    -- Insert point batch
    INSERT INTO point_batches (
        id, user_id, product_id, original_points, remaining_points, 
        purchase_date, expiry_date, price_paid
    ) VALUES (
        batch_id, p_user_id, p_product_id, product_points, product_points,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months',
        product_price
    );
    
    -- Insert purchase log
    INSERT INTO purchase_logs (
        purchase_id, user_id, user_name, user_email,
        product_id, points, price
    ) SELECT 
        purchase_id, u.id, u.name, u.email,
        p_product_id, product_points, product_price
    FROM users u WHERE u.id = p_user_id;
    
    RETURN batch_id;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT create_sample_point_batch('01234567-89ab-cdef-0123-456789abcdef'::UUID, '01234567-89ab-cdef-0123-456789abcdef'::UUID);
-- SELECT create_sample_point_batch('01234567-89ab-cdef-0123-456789abcdef'::UUID, '01234567-89ab-cdef-0123-456789abcdef'::UUID);

COMMIT;