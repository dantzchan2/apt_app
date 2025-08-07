-- Studio Vit PT Scheduling App - Dummy Data
-- Created: 2025-01-07
-- Description: Sample data for testing and development

-- This file contains all the dummy/sample data for the fitness appointment scheduling system
-- Run this AFTER running schema.sql to populate the database with test data

-- Insert trainer users (trainers are now part of users table)
INSERT INTO users (id, name, email, phone, role, specialization, total_points) VALUES
('11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', 'sarah.johnson@studiovit.com', '010-1234-5678', 'trainer', 'Strength & Conditioning', 0),
('22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', 'mike.chen@studiovit.com', '010-2345-6789', 'trainer', 'Cardio & Endurance', 0),
('33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', 'emma.rodriguez@studiovit.com', '010-3456-7890', 'trainer', 'Yoga & Flexibility', 0),
('44444444-4444-4444-a444-444444444444'::UUID, 'Alex Thompson', 'alex.thompson@studiovit.com', '010-4567-8901', 'trainer', 'CrossFit', 0),
('55555555-5555-4555-a555-555555555555'::UUID, 'Lisa Park', 'lisa.park@studiovit.com', '010-5678-9012', 'trainer', 'Pilates', 0);

-- Insert default products (point packages)
INSERT INTO products (id, name, description, points, price, sale_rate, recv_rate, display_order) VALUES
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::UUID, '스타터 패키지', '첫 고객을 위한 기본 패키지', 5, 25000.00, 0.1000, 0.0500, 1),
('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, '베이직 패키지', '가장 인기 있는 표준 패키지', 10, 45000.00, 0.1200, 0.0600, 2),
('cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, '프리미엄 패키지', '더 많은 가치를 원하는 고객을 위한 패키지', 20, 85000.00, 0.1500, 0.0750, 3),
('dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID, '프로 패키지', '전문 트레이닝을 원하는 고객을 위한 최고급 패키지', 50, 200000.00, 0.2000, 0.1000, 4),
('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee'::UUID, '레거시 패키지', '기존 고객용 호환성 패키지', 1, 5000.00, 0.0500, 0.0250, 99);

-- Insert default admin user
INSERT INTO users (id, name, email, phone, role, total_points) VALUES
('00000000-0000-4000-a000-000000000000'::UUID, 'Admin User', 'admin@studiovit.com', '010-0000-0000', 'admin', 0);

-- Insert some sample users
INSERT INTO users (id, name, email, phone, role, total_points) VALUES
('10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'john.smith@email.com', '010-1111-1111', 'user', 0),
('10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'emily.davis@email.com', '010-2222-2222', 'user', 0),
('10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'michael.brown@email.com', '010-3333-3333', 'user', 0),
('10000000-0000-4000-a000-000000000004'::UUID, 'Sarah Wilson', 'sarah.wilson@email.com', '010-4444-4444', 'user', 0),
('10000000-0000-4000-a000-000000000005'::UUID, 'David Miller', 'david.miller@email.com', '010-5555-5555', 'user', 0),
('10000000-0000-4000-a000-000000000006'::UUID, 'Lisa Garcia', 'lisa.garcia@email.com', '010-6666-6666', 'user', 0),
('10000000-0000-4000-a000-000000000007'::UUID, 'James Martinez', 'james.martinez@email.com', '010-7777-7777', 'user', 0),
('10000000-0000-4000-a000-000000000008'::UUID, 'Maria Lopez', 'maria.lopez@email.com', '010-8888-8888', 'user', 0),
('10000000-0000-4000-a000-000000000009'::UUID, 'Robert Taylor', 'robert.taylor@email.com', '010-9999-9999', 'user', 0),
('10000000-0000-4000-a000-000000000010'::UUID, 'Jennifer White', 'jennifer.white@email.com', '010-1010-1010', 'user', 0);

-- Create some sample point batches using the helper function
-- These will automatically create purchase logs as well
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000001'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000001'::UUID, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000002'::UUID, 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000003'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000004'::UUID, 'dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000005'::UUID, 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000006'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000007'::UUID, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000008'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000009'::UUID, 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000010'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);

-- Add some additional point batches for users with multiple purchases
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000001'::UUID, 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000002'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);
SELECT create_sample_point_batch('10000000-0000-4000-a000-000000000005'::UUID, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);

-- Create some sample appointments
-- Note: These use hardcoded batch IDs that would be generated by the function calls above
-- In real usage, you'd need to query for actual batch IDs or use the appointment booking logic

-- Sample appointments for January 2025
INSERT INTO appointments (
    id, user_id, user_name, user_email, trainer_id, trainer_name,
    appointment_date, appointment_time, status, product_id, notes
) VALUES
-- Week 1 of January
('20000000-0000-4000-a000-000000000001'::UUID, '10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'john.smith@email.com', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '2025-01-02', '09:00', 'completed', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, 'First session'),
('20000000-0000-4000-a000-000000000002'::UUID, '10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'emily.davis@email.com', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', '2025-01-02', '10:00', 'completed', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, NULL),
('20000000-0000-4000-a000-000000000003'::UUID, '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'michael.brown@email.com', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '2025-01-02', '11:00', 'cancelled', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, 'Client cancelled due to illness'),
('20000000-0000-4000-a000-000000000004'::UUID, '10000000-0000-4000-a000-000000000004'::UUID, 'Sarah Wilson', 'sarah.wilson@email.com', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '2025-01-03', '09:00', 'completed', 'dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID, NULL),
('20000000-0000-4000-a000-000000000005'::UUID, '10000000-0000-4000-a000-000000000005'::UUID, 'David Miller', 'david.miller@email.com', '44444444-4444-4444-a444-444444444444'::UUID, 'Alex Thompson', '2025-01-03', '10:00', 'completed', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, NULL),
('20000000-0000-4000-a000-000000000006'::UUID, '10000000-0000-4000-a000-000000000006'::UUID, 'Lisa Garcia', 'lisa.garcia@email.com', '55555555-5555-4555-a555-555555555555'::UUID, 'Lisa Park', '2025-01-03', '11:00', 'completed', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, NULL),

-- Week 2 of January
('20000000-0000-4000-a000-000000000007'::UUID, '10000000-0000-4000-a000-000000000007'::UUID, 'James Martinez', 'james.martinez@email.com', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', '2025-01-09', '14:00', 'completed', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::UUID, NULL),
('20000000-0000-4000-a000-000000000008'::UUID, '10000000-0000-4000-a000-000000000008'::UUID, 'Maria Lopez', 'maria.lopez@email.com', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '2025-01-09', '15:00', 'cancelled', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, 'Trainer unavailable'),
('20000000-0000-4000-a000-000000000009'::UUID, '10000000-0000-4000-a000-000000000009'::UUID, 'Robert Taylor', 'robert.taylor@email.com', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '2025-01-10', '09:00', 'completed', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, NULL),
('20000000-0000-4000-a000-000000000010'::UUID, '10000000-0000-4000-a000-000000000010'::UUID, 'Jennifer White', 'jennifer.white@email.com', '44444444-4444-4444-a444-444444444444'::UUID, 'Alex Thompson', '2025-01-10', '10:00', 'completed', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, NULL),

-- Week 3 of January
('20000000-0000-4000-a000-000000000011'::UUID, '10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'john.smith@email.com', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', '2025-01-16', '11:00', 'completed', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, 'Regular session'),
('20000000-0000-4000-a000-000000000012'::UUID, '10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'emily.davis@email.com', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '2025-01-16', '14:00', 'completed', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, NULL),
('20000000-0000-4000-a000-000000000013'::UUID, '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'michael.brown@email.com', '55555555-5555-4555-a555-555555555555'::UUID, 'Lisa Park', '2025-01-17', '09:00', 'completed', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID, NULL),
('20000000-0000-4000-a000-000000000014'::UUID, '10000000-0000-4000-a000-000000000004'::UUID, 'Sarah Wilson', 'sarah.wilson@email.com', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '2025-01-17', '10:00', 'no_show', 'dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID, 'Client did not attend'),
('20000000-0000-4000-a000-000000000015'::UUID, '10000000-0000-4000-a000-000000000005'::UUID, 'David Miller', 'david.miller@email.com', '44444444-4444-4444-a444-444444444444'::UUID, 'Alex Thompson', '2025-01-18', '15:00', 'completed', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID, NULL);

-- Create corresponding appointment logs for the above appointments
INSERT INTO appointment_logs (
    id, appointment_id, action, action_by, action_by_name, action_by_role,
    timestamp, appointment_date, appointment_time, trainer_id, trainer_name,
    user_id, user_name, user_email, product_id
) VALUES
-- Booking logs
('30000000-0000-4000-a000-000000000001'::UUID, '20000000-0000-4000-a000-000000000001'::UUID, 'booked', '10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'user', '2025-01-01 14:30:00+09', '2025-01-02', '09:00', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'john.smith@email.com', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID),
('30000000-0000-4000-a000-000000000002'::UUID, '20000000-0000-4000-a000-000000000002'::UUID, 'booked', '10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'user', '2025-01-01 15:00:00+09', '2025-01-02', '10:00', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', '10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'emily.davis@email.com', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID),
('30000000-0000-4000-a000-000000000003'::UUID, '20000000-0000-4000-a000-000000000003'::UUID, 'booked', '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'user', '2025-01-01 16:00:00+09', '2025-01-02', '11:00', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'michael.brown@email.com', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID),
('30000000-0000-4000-a000-000000000004'::UUID, '20000000-0000-4000-a000-000000000004'::UUID, 'booked', '10000000-0000-4000-a000-000000000004'::UUID, 'Sarah Wilson', 'user', '2025-01-02 09:30:00+09', '2025-01-03', '09:00', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '10000000-0000-4000-a000-000000000004'::UUID, 'Sarah Wilson', 'sarah.wilson@email.com', 'dddddddd-dddd-4ddd-dddd-dddddddddddd'::UUID),
('30000000-0000-4000-a000-000000000005'::UUID, '20000000-0000-4000-a000-000000000005'::UUID, 'booked', '10000000-0000-4000-a000-000000000005'::UUID, 'David Miller', 'user', '2025-01-02 10:00:00+09', '2025-01-03', '10:00', '44444444-4444-4444-a444-444444444444'::UUID, 'Alex Thompson', '10000000-0000-4000-a000-000000000005'::UUID, 'David Miller', 'david.miller@email.com', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID),

-- Completion logs
('30000000-0000-4000-a000-000000000006'::UUID, '20000000-0000-4000-a000-000000000001'::UUID, 'completed', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', 'trainer', '2025-01-02 10:00:00+09', '2025-01-02', '09:00', '11111111-1111-4111-a111-111111111111'::UUID, 'Sarah Johnson', '10000000-0000-4000-a000-000000000001'::UUID, 'John Smith', 'john.smith@email.com', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID),
('30000000-0000-4000-a000-000000000007'::UUID, '20000000-0000-4000-a000-000000000002'::UUID, 'completed', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', 'trainer', '2025-01-02 11:00:00+09', '2025-01-02', '10:00', '22222222-2222-4222-a222-222222222222'::UUID, 'Mike Chen', '10000000-0000-4000-a000-000000000002'::UUID, 'Emily Davis', 'emily.davis@email.com', 'cccccccc-cccc-4ccc-cccc-cccccccccccc'::UUID),

-- Cancellation logs
('30000000-0000-4000-a000-000000000008'::UUID, '20000000-0000-4000-a000-000000000003'::UUID, 'cancelled', '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'user', '2025-01-02 08:00:00+09', '2025-01-02', '11:00', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '10000000-0000-4000-a000-000000000003'::UUID, 'Michael Brown', 'michael.brown@email.com', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID),
('30000000-0000-4000-a000-000000000009'::UUID, '20000000-0000-4000-a000-000000000008'::UUID, 'cancelled', '00000000-0000-4000-a000-000000000000'::UUID, 'Admin User', 'admin', '2025-01-09 13:00:00+09', '2025-01-09', '15:00', '33333333-3333-4333-a333-333333333333'::UUID, 'Emma Rodriguez', '10000000-0000-4000-a000-000000000008'::UUID, 'Maria Lopez', 'maria.lopez@email.com', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::UUID);

-- Add some memos for users
UPDATE users SET memo = '우수 고객 - 정기적으로 운동함' WHERE id = '10000000-0000-4000-a000-000000000001'::UUID;
UPDATE users SET memo = '초보자 - 요가에 관심 많음' WHERE id = '10000000-0000-4000-a000-000000000002'::UUID;
UPDATE users SET memo = 'VIP 고객 - 프로 패키지 선호' WHERE id = '10000000-0000-4000-a000-000000000004'::UUID;
UPDATE users SET memo = '운동 경험 많음 - 크로스핏 집중' WHERE id = '10000000-0000-4000-a000-000000000005'::UUID;

COMMIT;

-- Display summary of inserted data
SELECT 'Data Summary' as info;
SELECT 'Total Users: ' || COUNT(*) as total_users FROM users;
SELECT 'Trainers: ' || COUNT(*) as trainers FROM users WHERE role = 'trainer';
SELECT 'Regular Users: ' || COUNT(*) as regular_users FROM users WHERE role = 'user';
SELECT 'Admins: ' || COUNT(*) as admins FROM users WHERE role = 'admin';
SELECT 'Products: ' || COUNT(*) as products FROM products;
SELECT 'Point Batches: ' || COUNT(*) as point_batches FROM point_batches;
SELECT 'Purchase Logs: ' || COUNT(*) as purchase_logs FROM purchase_logs;
SELECT 'Appointments: ' || COUNT(*) as appointments FROM appointments;
SELECT 'Appointment Logs: ' || COUNT(*) as appointment_logs FROM appointment_logs;

-- Show user points summary
SELECT 
    u.name as user_name,
    u.total_points,
    COUNT(pb.id) as active_batches,
    STRING_AGG(DISTINCT p.name, ', ') as purchased_products
FROM users u 
LEFT JOIN point_batches pb ON u.id = pb.user_id AND pb.is_active = true
LEFT JOIN products p ON pb.product_id = p.id
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.total_points
ORDER BY u.total_points DESC;