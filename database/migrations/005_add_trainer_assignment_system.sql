-- Migration 005: Add Trainer Assignment System
-- Description: Adds trainer types and user-trainer assignment system
-- Date: August 2025

BEGIN;

-- Add trainer_type column to products table
ALTER TABLE products 
ADD COLUMN trainer_type VARCHAR(20) NOT NULL CHECK (trainer_type IN ('trainer', 'head_trainer')) DEFAULT 'trainer';

-- Add trainer assignment fields to users table
ALTER TABLE users 
ADD COLUMN trainer_type VARCHAR(20) CHECK (trainer_type IN ('trainer', 'head_trainer')),
ADD COLUMN assigned_trainer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add constraints to ensure data integrity
ALTER TABLE users 
ADD CONSTRAINT users_trainer_type_check 
CHECK ((role = 'trainer' AND trainer_type IS NOT NULL) OR (role != 'trainer' AND trainer_type IS NULL));

ALTER TABLE users 
ADD CONSTRAINT users_assigned_trainer_check 
CHECK ((role = 'user' AND assigned_trainer_id IS NOT NULL) OR (role != 'user'));

-- Create indexes for performance
CREATE INDEX idx_products_trainer_type ON products(trainer_type);
CREATE INDEX idx_users_trainer_type ON users(trainer_type);
CREATE INDEX idx_users_assigned_trainer ON users(assigned_trainer_id);

-- Create constraint function to ensure users can only book with their assigned trainer
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
        
        -- Check if trainer type matches product trainer type (if product_id is provided)
        IF NEW.product_id IS NOT NULL AND NOT EXISTS (
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

COMMIT;

-- Verification queries
SELECT 'Migration 005 completed successfully' as status;

-- Show updated schema info
SELECT 'Updated Products Table:' as info;
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('trainer_type')
ORDER BY ordinal_position;

SELECT 'Updated Users Table:' as info;
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('trainer_type', 'assigned_trainer_id')
ORDER BY ordinal_position;