import pool from '../db.js';

// Create a new court
export async function createCourt(court) {
  const {
    facility_id,
    name,
    sport_type,
    surface_type,
    court_size,
    pricing_per_hour,
    operating_hours_start,
    operating_hours_end,
    photos
  } = court;

  const res = await pool.query(
    `INSERT INTO courts 
      (facility_id, name, sport_type, surface_type, court_size, pricing_per_hour, operating_hours_start, operating_hours_end, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [facility_id, name, sport_type, surface_type || 'Synthetic', court_size || 'Standard', pricing_per_hour, operating_hours_start, operating_hours_end, photos || []]
  );
  return res.rows[0];
}

// Get courts by facility
export async function getCourtsByFacility(facility_id) {
  const res = await pool.query(
    `SELECT c.*, f.name as facility_name
     FROM courts c
     JOIN facilities f ON c.facility_id = f.id
     WHERE c.facility_id = $1
     ORDER BY c.name ASC`,
    [facility_id]
  );
  return res.rows;
}

// Get court by ID
export async function getCourtById(court_id) {
  const res = await pool.query(
    `SELECT c.*, f.name as facility_name, f.location as facility_location
     FROM courts c
     JOIN facilities f ON c.facility_id = f.id
     WHERE c.id = $1`,
    [court_id]
  );
  return res.rows[0];
}

// Update court
export async function updateCourt(court_id, updates) {
  const {
    name,
    sport_type,
    surface_type,
    court_size,
    pricing_per_hour,
    operating_hours_start,
    operating_hours_end,
    is_active,
    photos
  } = updates;

  const res = await pool.query(
    `UPDATE courts 
     SET name = COALESCE($1, name), 
         sport_type = COALESCE($2, sport_type), 
         surface_type = COALESCE($3, surface_type),
         court_size = COALESCE($4, court_size),
         pricing_per_hour = COALESCE($5, pricing_per_hour),
         operating_hours_start = COALESCE($6, operating_hours_start), 
         operating_hours_end = COALESCE($7, operating_hours_end), 
         is_active = COALESCE($8, is_active),
         photos = COALESCE($9, photos),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [name, sport_type, surface_type, court_size, pricing_per_hour, operating_hours_start, operating_hours_end, is_active, photos, court_id]
  );
  return res.rows[0];
}

// Delete court
export async function deleteCourt(court_id) {
  const res = await pool.query(
    'DELETE FROM courts WHERE id = $1 RETURNING *',
    [court_id]
  );
  return res.rows[0];
}

// Get available time slots for a court on a specific date
export async function getAvailableSlots(court_id, date) {
  // Get court operating hours
  const courtRes = await pool.query(
    'SELECT operating_hours_start, operating_hours_end FROM courts WHERE id = $1',
    [court_id]
  );

  if (courtRes.rows.length === 0) {
    return [];
  }

  const { operating_hours_start, operating_hours_end } = courtRes.rows[0];

  // Get existing bookings for the date
  const bookingsRes = await pool.query(
    `SELECT start_time, end_time FROM bookings 
     WHERE court_id = $1 AND booking_date = $2 AND status != 'cancelled'`,
    [court_id, date]
  );

  // Get maintenance blocks for the date
  const maintenanceRes = await pool.query(
    `SELECT start_time, end_time FROM maintenance_blocks 
     WHERE court_id = $1 AND block_date = $2`,
    [court_id, date]
  );

  const bookedSlots = [...bookingsRes.rows, ...maintenanceRes.rows];

  // Generate available slots (1-hour intervals)
  const availableSlots = [];
  const startHour = parseInt(operating_hours_start.split(':')[0]);
  const endHour = parseInt(operating_hours_end.split(':')[0]);

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00`;
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Check if slot is available
    const isBooked = bookedSlots.some(booking => {
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;
      return (slotStart >= bookingStart && slotStart < bookingEnd) ||
             (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
             (slotStart <= bookingStart && slotEnd >= bookingEnd);
    });

    if (!isBooked) {
      availableSlots.push({
        start_time: slotStart,
        end_time: slotEnd,
        duration: 1
      });
    }
  }

  return availableSlots;
}

// Get all courts with facility details (with optional sport filter)
export async function getAllCourtsWithFacilities(sport_type = null) {
  let query = `
    SELECT 
      c.*,
      f.name as facility_name,
      f.location as facility_location,
      f.description as facility_description,
      f.photos as facility_photos,
      f.amenities,
      4.5 as rating,
      0 as total_reviews
    FROM courts c
    JOIN facilities f ON c.facility_id = f.id
    WHERE c.is_active = true
  `;

  const params = [];
  if (sport_type) {
    query += ` AND c.sport_type = $1`;
    params.push(sport_type);
  }

  query += `
    ORDER BY c.name ASC
  `;

  const res = await pool.query(query, params);
  return res.rows;
}

// Get courts by owner
export async function getCourtsByOwner(owner_id) {
  const res = await pool.query(
    `SELECT 
      c.*,
      f.name as facility_name,
      f.location as facility_location
     FROM courts c
     JOIN facilities f ON c.facility_id = f.id
     WHERE f.owner_id = $1
     ORDER BY f.name ASC, c.name ASC`,
    [owner_id]
  );
  return res.rows;
}