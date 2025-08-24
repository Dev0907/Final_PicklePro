-- Create tournament registration system tables

-- 1. Create tournament_registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    player1_name VARCHAR(100) NOT NULL,
    player1_phone VARCHAR(20) NOT NULL,
    player2_name VARCHAR(100),
    player2_phone VARCHAR(20),
    registration_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 2. Add status column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'status') THEN
        ALTER TABLE matches 
        ADD COLUMN status VARCHAR(20) DEFAULT 'upcoming' 
        CHECK (status IN ('upcoming', 'completed', 'cancelled'));
    END IF;
END $$;

-- 3. Add updated_at column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'updated_at') THEN
        ALTER TABLE matches 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 4. Add description column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'description') THEN
        ALTER TABLE matches 
        ADD COLUMN description TEXT;
    END IF;
END $$;

-- 5. Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- Can reference match_id, tournament_id, etc.
    related_type VARCHAR(50), -- 'match', 'tournament', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 7. Update existing matches status based on date
UPDATE matches 
SET status = CASE 
  WHEN date_time > NOW() THEN 'upcoming'
  ELSE 'completed'
END
WHERE status IS NULL OR status = '';

-- Success message
SELECT 'Tournament system setup completed successfully!' as message;