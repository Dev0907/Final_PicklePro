-- Update notification system with comprehensive notification types
-- This script updates the notifications table to support all notification types

-- 1. Drop the existing constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Update the notifications table with comprehensive type checking
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'info', 'success', 'warning', 'error',
    'tournament_registration', 'tournament_update', 'tournament_withdrawal',
    'match_created', 'match_join_request', 'join_request_sent', 
    'join_request_accepted', 'join_request_declined', 'match_partner_joined',
    'booking_confirmed', 'booking_cancelled', 'booking_completed'
));

-- 3. Add related_type column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);

-- 4. Create join_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS join_requests (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, user_id) -- Prevent duplicate requests
);

-- 5. Add indexes for join_requests
CREATE INDEX IF NOT EXISTS idx_join_requests_match_id ON join_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- 6. Add notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_type ON notifications(related_type);

-- Success message
SELECT 'Notification system updated successfully!' as message;