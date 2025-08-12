-- Reset Database and Create Initial Accounts
-- Description: Truncates all tables and creates three test accounts with hashed passwords
-- Usage: Run this script in your PostgreSQL/Supabase database

BEGIN;

-- Truncate all tables in dependency order (child tables first)
TRUNCATE TABLE appointment_logs CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE purchase_logs CASCADE;
TRUNCATE TABLE point_batches CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE products CASCADE;

-- Reset sequences if they exist
DO $$
BEGIN
    -- Reset any sequences here if needed
    NULL;
END $$;

-- Create the three required accounts
-- Password hash for "password!" is generated using bcrypt with 10 salt rounds
-- All three accounts use the same password: "password!"
INSERT INTO users (id, name, email, phone, role, specialization, total_points, password_hash) VALUES
('00000000-0000-4000-a000-000000000000'::UUID, 'Admin User', 'admin@ptvit.com', '010-0000-0001', 'admin', NULL, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('11111111-1111-4111-a111-111111111111'::UUID, 'Test Trainer', 'trainer@ptvit.com', '010-1111-1111', 'trainer', 'General Fitness', 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('22222222-2222-4222-a222-222222222222'::UUID, 'Test User', 'user@ptvit.com', '010-2222-2222', 'user', NULL, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2');

-- Create basic products for testing
INSERT INTO products (id, name, description, points, price, duration_minutes, sale_rate, recv_rate, display_order) VALUES
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::UUID, '30분 패키지 5회', '30분 세션 패키지 5회', 5, 25000.00, 30, 0.1000, 0.0500, 1),
('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, '30분 패키지 10회', '30분 세션 패키지 10회', 10, 45000.00, 30, 0.1200, 0.0600, 3),
('cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, '60분 패키지 5회', '60분 세션 패키지 5회', 5, 85000.00, 60, 0.1500, 0.0750, 4),
('dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID, '60분 패키지 10회', '60분 세션 패키지 10회', 10, 200000.00, 60, 0.2000, 0.1000, 2);

COMMIT;

-- Display created accounts
SELECT 'Created Accounts:' as info;
SELECT 
    name,
    email,
    role,
    specialization,
    total_points,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password Set ✓'
        ELSE 'No Password'
    END as password_status
FROM users 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'trainer' THEN 2 
        WHEN 'user' THEN 3 
        ELSE 4 
    END;

-- Display created products
SELECT 'Created Products:' as info;
SELECT name, points, duration_minutes, price FROM products ORDER BY display_order;

-- Verification
SELECT 'Database Reset Complete!' as status;
SELECT 'Users: ' || COUNT(*) as user_count FROM users;
SELECT 'Products: ' || COUNT(*) as product_count FROM products;