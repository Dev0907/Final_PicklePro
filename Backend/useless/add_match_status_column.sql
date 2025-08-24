-- Add status column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming' 
CHECK (status IN ('upcoming', 'completed', 'cancelled'));

-- Add updated_at column if it doesn't exist
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Update existing matches to have 'upcoming' status for future matches and 'completed' for past matches
UPDATE matches 
SET status = CASE 
  WHEN date_time > NOW() THEN 'upcoming'
  ELSE 'completed'
END
WHERE status IS NULL OR status = 'upcoming';