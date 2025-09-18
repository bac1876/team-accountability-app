-- Remove the unique constraint on daily_commitments table
-- This allows multiple commitments per user per day

ALTER TABLE daily_commitments
DROP CONSTRAINT IF EXISTS daily_commitments_user_id_commitment_date_key;