-- Complete Database Reset with Trainer Assignment System
-- This script truncates all tables and creates fresh test data with trainer types and assignments

BEGIN;

-- Truncate all tables in the correct order to handle foreign key constraints
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

-- Create trainer accounts first (so we can reference them in user assignments)
-- Password hash for "password!" is generated using bcrypt with 10 salt rounds
INSERT INTO users (id, name, email, phone, role, trainer_type, specialization, total_points, password_hash) VALUES
('10000000-1000-4100-a100-100000000000'::UUID, 'Head Trainer Kim', 'head@ptvit.com', '010-1000-0001', 'trainer', 'head_trainer', 'Premium Personal Training', 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('11111111-1111-4111-a111-111111111111'::UUID, 'Trainer Lee', 'trainer@ptvit.com', '010-1111-1111', 'trainer', 'trainer', 'General Fitness', 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('12222222-1222-4122-a122-122222222222'::UUID, 'Trainer Park', 'trainer2@ptvit.com', '010-2222-2222', 'trainer', 'trainer', 'Weight Training', 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2');

-- Create admin account
INSERT INTO users (id, name, email, phone, role, specialization, total_points, password_hash) VALUES
('00000000-0000-4000-a000-000000000000'::UUID, 'Admin User', 'admin@ptvit.com', '010-0000-0001', 'admin', NULL, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2');

-- Create user accounts with trainer assignments
INSERT INTO users (id, name, email, phone, role, assigned_trainer_id, total_points, password_hash) VALUES
('20000000-2000-4200-a200-200000000000'::UUID, 'User with Head Trainer', 'user-head@ptvit.com', '010-3000-0001', 'user', '10000000-1000-4100-a100-100000000000'::UUID, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('21111111-2111-4211-a211-211111111111'::UUID, 'User with Regular Trainer', 'user1@ptvit.com', '010-3111-1111', 'user', '11111111-1111-4111-a111-111111111111'::UUID, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2'),
('22222222-2222-4222-a222-222222222222'::UUID, 'User with Regular Trainer 2', 'user2@ptvit.com', '010-3222-2222', 'user', '12222222-1222-4122-a122-122222222222'::UUID, 0, '$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2');

-- Create products for different trainer types with different pricing
-- Head Trainer Products (Premium pricing)
INSERT INTO products (id, name, description, points, price, duration_minutes, trainer_type, sale_rate, recv_rate, display_order) VALUES
('a1111111-a111-4a11-aa11-a11111111111'::UUID, 'Head Trainer 30분 패키지 5회', '프리미엄 30분 세션 패키지 5회', 5, 50000.00, 30, 'head_trainer', 0.1000, 0.0500, 1),
('a2222222-a222-4a22-aa22-a22222222222'::UUID, 'Head Trainer 30분 패키지 10회', '프리미엄 30분 세션 패키지 10회', 10, 95000.00, 30, 'head_trainer', 0.1200, 0.0600, 2),
('a3333333-a333-4a33-aa33-a33333333333'::UUID, 'Head Trainer 60분 패키지 5회', '프리미엄 60분 세션 패키지 5회', 5, 150000.00, 60, 'head_trainer', 0.1500, 0.0750, 3),
('a4444444-a444-4a44-aa44-a44444444444'::UUID, 'Head Trainer 60분 패키지 10회', '프리미엄 60분 세션 패키지 10회', 10, 280000.00, 60, 'head_trainer', 0.2000, 0.1000, 4),

-- Regular Trainer Products (Standard pricing)
('b1111111-b111-4b11-bb11-b11111111111'::UUID, '일반 트레이너 30분 패키지 5회', '표준 30분 세션 패키지 5회', 5, 25000.00, 30, 'trainer', 0.1000, 0.0500, 5),
('b2222222-b222-4b22-bb22-b22222222222'::UUID, '일반 트레이너 30분 패키지 10회', '표준 30분 세션 패키지 10회', 10, 45000.00, 30, 'trainer', 0.1200, 0.0600, 6),
('b3333333-b333-4b33-bb33-b33333333333'::UUID, '일반 트레이너 60분 패키지 5회', '표준 60분 세션 패키지 5회', 5, 85000.00, 60, 'trainer', 0.1500, 0.0750, 7),
('b4444444-b444-4b44-bb44-b44444444444'::UUID, '일반 트레이너 60분 패키지 10회', '표준 60분 세션 패키지 10회', 10, 160000.00, 60, 'trainer', 0.2000, 0.1000, 8);

COMMIT;

-- Display created accounts
SELECT 'Created Trainer Accounts:' as info;
SELECT 
    name,
    email,
    role,
    trainer_type,
    specialization,
    total_points,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password Set ✓'
        ELSE 'No Password'
    END as password_status
FROM users 
WHERE role IN ('trainer', 'admin')
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'trainer' THEN 2 
        ELSE 3 
    END,
    trainer_type DESC NULLS LAST;

SELECT 'Created User Accounts with Trainer Assignments:' as info;
SELECT 
    u.name,
    u.email,
    u.role,
    t.name as assigned_trainer,
    t.trainer_type as trainer_type,
    u.total_points,
    CASE 
        WHEN u.password_hash IS NOT NULL THEN 'Password Set ✓'
        ELSE 'No Password'
    END as password_status
FROM users u
LEFT JOIN users t ON u.assigned_trainer_id = t.id
WHERE u.role = 'user'
ORDER BY u.name;

-- Display created products by trainer type
SELECT 'Head Trainer Products:' as info;
SELECT name, points, duration_minutes, price, trainer_type 
FROM products 
WHERE trainer_type = 'head_trainer'
ORDER BY display_order;

SELECT 'Regular Trainer Products:' as info;
SELECT name, points, duration_minutes, price, trainer_type 
FROM products 
WHERE trainer_type = 'trainer'
ORDER BY display_order;

-- Verification
SELECT 'Database Reset with Trainer Assignment System Complete!' as status;
SELECT 'Total Users: ' || COUNT(*) as user_count FROM users;
SELECT 'Total Trainers: ' || COUNT(*) as trainer_count FROM users WHERE role = 'trainer';
SELECT 'Total Products: ' || COUNT(*) as product_count FROM products;
SELECT 'Head Trainer Products: ' || COUNT(*) as head_trainer_products FROM products WHERE trainer_type = 'head_trainer';
SELECT 'Regular Trainer Products: ' || COUNT(*) as regular_trainer_products FROM products WHERE trainer_type = 'trainer';