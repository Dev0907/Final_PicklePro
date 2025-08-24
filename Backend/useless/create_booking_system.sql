-- Create booking system tables

-- 1. Ensure facilities table exists with proper structure
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    sports_supported TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Ensure courts table exists with proper structure
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(100) NOT NULL,
    pricing_per_hour DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities(owner_id);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_courts_facility_id ON courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_courts_is_active ON courts(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 5. Add some sample data if tables are empty
DO $$
BEGIN
    -- Check if we have any facilities
    IF NOT EXISTS (SELECT 1 FROM facilities LIMIT 1) THEN
        -- Insert sample facilities (assuming owner_id 1 exists)
        INSERT INTO facilities (owner_id, name, location, description, sports_supported, amenities, photos) VALUES
        (1, 'Elite Sports Complex', 'Sector 15, Gurgaon, Haryana', 'Premium sports facility with world-class amenities', 
         ARRAY['Pickleball', 'Tennis', 'Badminton'], 
         ARRAY['Parking', 'Locker Rooms', 'Cafeteria', 'Pro Shop'], 
         ARRAY['https://example.com/facility1.jpg']),
        (1, 'City Sports Center', 'MG Road, Bangalore, Karnataka', 'Modern sports center in the heart of the city',
         ARRAY['Pickleball', 'Squash', 'Table Tennis'],
         ARRAY['Air Conditioning', 'Parking', 'Refreshments'],
         ARRAY['https://example.com/facility2.jpg']);
    END IF;

    -- Check if we have any courts
    IF NOT EXISTS (SELECT 1 FROM courts LIMIT 1) THEN
        -- Insert sample courts
        INSERT INTO courts (facility_id, name, sport_type, pricing_per_hour, description) VALUES
        (1, 'Court A1', 'Pickleball', 500.00, 'Professional pickleball court with premium surface'),
        (1, 'Court A2', 'Pickleball', 500.00, 'Professional pickleball court with premium surface'),
        (1, 'Court B1', 'Tennis', 800.00, 'Full-size tennis court with synthetic grass'),
        (1, 'Court C1', 'Badminton', 400.00, 'Indoor badminton court with wooden flooring'),
        (2, 'Court 1', 'Pickleball', 450.00, 'Standard pickleball court'),
        (2, 'Court 2', 'Pickleball', 450.00, 'Standard pickleball court'),
        (2, 'Squash Court 1', 'Squash', 600.00, 'Professional squash court');
    END IF;
END $$;

-- Success message
SELECT 'Booking system setup completed successfully!' as message;