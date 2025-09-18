-- Migration to allow multiple commitments per day
-- Removes the unique constraint on (user_id, commitment_date)

ALTER TABLE daily_commitments
DROP CONSTRAINT IF EXISTS daily_commitments_user_id_commitment_date_key;