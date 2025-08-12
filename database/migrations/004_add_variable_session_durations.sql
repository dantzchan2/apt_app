-- Migration: Add Variable Session Durations Support
-- Date: August 2025
-- Description: Add duration_minutes to products and appointments tables for 30min vs 60min sessions

BEGIN;

-- Add duration_minutes column to products table
ALTER TABLE products 
ADD COLUMN duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes IN (30, 60));

-- Add comment for clarity
COMMENT ON COLUMN products.duration_minutes IS 'Session duration in minutes (30 or 60)';

-- Add duration_minutes column to appointments table for historical tracking
ALTER TABLE appointments 
ADD COLUMN duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes IN (30, 60));

-- Add comment for clarity
COMMENT ON COLUMN appointments.duration_minutes IS 'Session duration in minutes (copied from product at booking time)';

-- Update existing products with appropriate durations
-- Assuming smaller/basic packages are 30min, larger/premium packages are 60min
UPDATE products 
SET duration_minutes = 30 
WHERE points <= 10 OR name ILIKE '%basic%' OR name ILIKE '%starter%';

UPDATE products 
SET duration_minutes = 60 
WHERE points > 10 OR name ILIKE '%premium%' OR name ILIKE '%pro%';

-- Update existing appointments to default 60min (backwards compatibility)
UPDATE appointments 
SET duration_minutes = 60 
WHERE duration_minutes IS NULL;

-- Make duration_minutes NOT NULL after setting defaults
ALTER TABLE products 
ALTER COLUMN duration_minutes SET NOT NULL;

ALTER TABLE appointments 
ALTER COLUMN duration_minutes SET NOT NULL;

-- Add index for performance on duration-based queries
CREATE INDEX idx_products_duration ON products(duration_minutes);
CREATE INDEX idx_appointments_duration ON appointments(duration_minutes);

-- Add index for appointment time range queries (will be useful for conflict detection)
CREATE INDEX idx_appointments_time_range ON appointments(appointment_date, appointment_time, duration_minutes);

COMMIT;