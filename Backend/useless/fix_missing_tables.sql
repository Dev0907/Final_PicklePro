-- Fix missing tables and update existing ones

-- 1. Create maintenance_blocks table
CREATE TABLE IF NOT EXISTS maintenance_blocks (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255),
    created_by INTEGER NOT NULL REFERENCES owners(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Update join_requests table to match our model
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing records to have proper timestamps if they don't
UPDATE join_requests 
SET created_at = request_time 
WHERE created_at IS NULL AND request_time IS NOT NULL;

UPDATE join_requests 
SET updated_at = request_time 
WHERE updated_at IS NULL AND request_time IS NOT NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_court_id ON maintenance_blocks(court_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_date ON maintenance_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_join_requests_created_at ON join_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_join_requests_updated_at ON join_requests(updated_at);

-- Success message
SELECT 'Missing tables and columns fixed successfully!' as message;