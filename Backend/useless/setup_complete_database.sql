-- Complete Database Setup Script
-- This script creates all necessary tables and columns for the application

-- 1. Add status column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'status') THEN
        ALTER TABLE matches 
        ADD COLUMN status VARCHAR(20) DEFAULT 'upcoming' 
        CHECK (status IN ('upcoming', 'completed', 'cancelled'));
    END IF;
END $$;

-- 2. Add updated_at column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'updated_at') THEN
        ALTER TABLE matches 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 3. Add description column to matches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'description') THEN
        ALTER TABLE matches 
        ADD COLUMN description TEXT;
    END IF;
END $$;

-- 4. Create tournament_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    player1_name VARCHAR(100) NOT NULL,
    player1_phone VARCHAR(20) NOT NULL,
    player2_name VARCHAR(100),
    player2_phone VARCHAR(20),
    registration_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, user_id) -- Prevent duplicate registrations
);

-- 5. Create facilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    sports_supported TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create courts table if it doesn't exist
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(100) NOT NULL,
    pricing_per_hour DECIMAL(10,2) NOT NULL,
    operating_hours_start TIME NOT NULL,
    operating_hours_end TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
    booking_time TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(court_id, booking_date, start_time, end_time)
);

-- 8. Create maintenance_blocks table if it doesn't exist
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

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_date_time ON matches(date_time);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities(owner_id);
CREATE INDEX IF NOT EXISTS idx_courts_facility_id ON courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_court_id ON maintenance_blocks(court_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_date ON maintenance_blocks(block_date);

-- 10. Update existing matches to have proper status based on date
UPDATE matches 
SET status = CASE 
  WHEN date_time > NOW() THEN 'upcoming'
  ELSE 'completed'
END
WHERE status IS NULL OR status = '';

-- 11. Update existing matches to have updated_at timestamp (only if created_at exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'matches' AND column_name = 'created_at') THEN
        UPDATE matches 
        SET updated_at = created_at
        WHERE updated_at IS NULL;
    ELSE
        UPDATE matches 
        SET updated_at = NOW()
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'All tables and columns have been created/updated.';
END $$;