import pool from '../db.js';

// Create a new facility
export async function createFacility(facility) {
  const {
    owner_id,
    name,
    location,
    description,
    sports_supported,
    amenities,
    photos
  } = facility;

  const res = await pool.query(
    `INSERT INTO facilities 
      (owner_id, name, location, description, sports_supported, amenities, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [owner_id, name, location, description, sports_supported, amenities, photos]
  );
  return res.rows[0];
}

// Get all facilities for an owner
export async function getFacilitiesByOwner(owner_id) {
  const res = await pool.query(
    `SELECT f.*, 
            COUNT(c.id) as court_count,
            COUNT(CASE WHEN c.is_active = true THEN 1 END) as active_courts
     FROM facilities f
     LEFT JOIN courts c ON f.id = c.facility_id
     WHERE f.owner_id = $1
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    [owner_id]
  );
  return res.rows;
}

// Get all facilities (public view)
export async function getAllFacilities() {
  const res = await pool.query(
    `SELECT f.*, o.full_name as owner_name,
            COUNT(c.id) as court_count,
            COUNT(CASE WHEN c.is_active = true THEN 1 END) as active_courts
     FROM facilities f
     JOIN owners o ON f.owner_id = o.id
     LEFT JOIN courts c ON f.id = c.facility_id
     GROUP BY f.id, o.full_name
     ORDER BY f.created_at DESC`
  );
  
  // Get courts for each facility
  const facilities = res.rows;
  for (const facility of facilities) {
    const courtsRes = await pool.query(
      `SELECT * FROM courts 
       WHERE facility_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [facility.id]
    );
    facility.courts = courtsRes.rows;
  }
  
  return facilities;
}

// Get facility by ID with courts
export async function getFacilityById(facility_id) {
  const facilityRes = await pool.query(
    `SELECT f.*, o.full_name as owner_name, o.phone_number as owner_phone
     FROM facilities f
     JOIN owners o ON f.owner_id = o.id
     WHERE f.id = $1`,
    [facility_id]
  );

  if (facilityRes.rows.length === 0) {
    return null;
  }

  const facility = facilityRes.rows[0];

  // Get courts for this facility
  const courtsRes = await pool.query(
    `SELECT * FROM courts 
     WHERE facility_id = $1 AND is_active = true
     ORDER BY name ASC`,
    [facility_id]
  );

  facility.courts = courtsRes.rows;
  return facility;
}

// Update facility
export async function updateFacility(facility_id, updates) {
  const {
    name,
    location,
    description,
    sports_supported,
    amenities,
    photos
  } = updates;

  const res = await pool.query(
    `UPDATE facilities 
     SET name = $1, location = $2, description = $3, 
         sports_supported = $4, amenities = $5, photos = $6,
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, location, description, sports_supported, amenities, photos, facility_id]
  );
  return res.rows[0];
}

// Delete facility
export async function deleteFacility(facility_id) {
  const res = await pool.query(
    'DELETE FROM facilities WHERE id = $1 RETURNING *',
    [facility_id]
  );
  return res.rows[0];
}