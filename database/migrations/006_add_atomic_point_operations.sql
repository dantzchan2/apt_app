-- Migration: Add atomic point batch operations
-- Purpose: Fix race conditions in point refund operations during appointment cancellation

-- Function to atomically increment point batch remaining points
CREATE OR REPLACE FUNCTION increment_point_batch(
  batch_id UUID, 
  increment_amount INTEGER
)
RETURNS TABLE (
  id UUID,
  remaining_points INTEGER,
  is_active BOOLEAN
) AS $$
DECLARE
  updated_batch RECORD;
BEGIN
  -- Update the point batch atomically and return the updated values
  UPDATE point_batches 
  SET 
    remaining_points = remaining_points + increment_amount,
    is_active = CASE 
      WHEN remaining_points + increment_amount > 0 THEN true 
      ELSE is_active 
    END,
    updated_at = NOW()
  WHERE point_batches.id = batch_id
  RETURNING 
    point_batches.id, 
    point_batches.remaining_points, 
    point_batches.is_active
  INTO updated_batch;
  
  -- Check if the batch was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Point batch with ID % not found', batch_id;
  END IF;
  
  -- Return the updated values
  RETURN QUERY SELECT 
    updated_batch.id, 
    updated_batch.remaining_points, 
    updated_batch.is_active;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically decrement point batch remaining points (for bookings)
CREATE OR REPLACE FUNCTION decrement_point_batch(
  batch_id UUID, 
  decrement_amount INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  remaining_points INTEGER,
  is_active BOOLEAN
) AS $$
DECLARE
  updated_batch RECORD;
  current_points INTEGER;
BEGIN
  -- First check if there are enough points
  SELECT remaining_points INTO current_points
  FROM point_batches 
  WHERE point_batches.id = batch_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Point batch with ID % not found', batch_id;
  END IF;
  
  IF current_points < decrement_amount THEN
    RAISE EXCEPTION 'Insufficient points in batch. Current: %, Required: %', current_points, decrement_amount;
  END IF;
  
  -- Update the point batch atomically
  UPDATE point_batches 
  SET 
    remaining_points = remaining_points - decrement_amount,
    is_active = CASE 
      WHEN remaining_points - decrement_amount <= 0 THEN false 
      ELSE is_active 
    END,
    updated_at = NOW()
  WHERE point_batches.id = batch_id
  RETURNING 
    point_batches.id, 
    point_batches.remaining_points, 
    point_batches.is_active
  INTO updated_batch;
  
  -- Return the updated values
  RETURN QUERY SELECT 
    updated_batch.id, 
    updated_batch.remaining_points, 
    updated_batch.is_active;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to point_batches if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'point_batches' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE point_batches ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to have updated_at timestamps
UPDATE point_batches SET updated_at = created_at WHERE updated_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_point_batches_updated_at ON point_batches(updated_at);
CREATE INDEX IF NOT EXISTS idx_point_batches_user_active ON point_batches(user_id, is_active) WHERE is_active = true;