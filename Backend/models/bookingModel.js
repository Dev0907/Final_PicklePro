import pool from "../db.js";

// Create a new booking
export async function createBooking(booking) {
  const {
    court_id,
    user_id,
    booking_date,
    start_time,
    end_time,
    total_hours,
    total_amount,
    notes,
    status = "booked",
  } = booking;

  const res = await pool.query(
    `INSERT INTO bookings 
      (court_id, user_id, booking_date, start_time, end_time, total_hours, total_amount, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      court_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      total_hours,
      total_amount,
      notes,
      status,
    ]
  );
  return res.rows[0];
}

// Get bookings by user
export async function getBookingsByUser(user_id) {
  const res = await pool.query(
    `SELECT b.*, c.name as court_name, c.sport_type, 
            f.name as facility_name, f.location as facility_location
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     JOIN facilities f ON c.facility_id = f.id
     WHERE b.user_id = $1
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [user_id]
  );
  return res.rows;
}

// Get bookings by facility (for owners)
export async function getBookingsByFacility(facility_id) {
  const res = await pool.query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            u.fullname as user_name, u.phone_no as user_phone, u.email as user_email
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     JOIN users u ON b.user_id = u.id
     WHERE c.facility_id = $1
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [facility_id]
  );
  return res.rows;
}

// Get bookings by court
export async function getBookingsByCourt(court_id) {
  const res = await pool.query(
    `SELECT b.*, u.fullname as user_name, u.phone_no as user_phone
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.court_id = $1
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [court_id]
  );
  return res.rows;
}

// Get booking by ID
export async function getBookingById(booking_id) {
  const res = await pool.query(
    `SELECT b.*, c.name as court_name, c.sport_type, c.pricing_per_hour,
            f.name as facility_name, f.location as facility_location,
            u.fullname as user_name, u.phone_no as user_phone, u.email as user_email
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     JOIN facilities f ON c.facility_id = f.id
     JOIN users u ON b.user_id = u.id
     WHERE b.id = $1`,
    [booking_id]
  );
  return res.rows[0];
}

// Update booking status
export async function updateBookingStatus(booking_id, status) {
  const res = await pool.query(
    `UPDATE bookings 
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, booking_id]
  );
  return res.rows[0];
}

// Cancel booking
export async function cancelBooking(booking_id, user_id) {
  const res = await pool.query(
    `UPDATE bookings 
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [booking_id, user_id]
  );
  return res.rows[0];
}

// Complete booking (for owners)
export async function completeBooking(booking_id) {
  const res = await pool.query(
    `UPDATE bookings 
     SET status = 'completed', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [booking_id]
  );
  return res.rows[0];
}

// Check if slot is available (with more robust overlap detection)
export async function isSlotAvailable(
  court_id,
  booking_date,
  start_time,
  end_time
) {
  const res = await pool.query(
    `SELECT COUNT(*) as count, 
            array_agg(start_time || ' - ' || end_time) as conflicting_slots
     FROM bookings
     WHERE court_id = $1 
       AND booking_date = $2
       AND status IN ('confirmed', 'completed')
       AND (
         -- Check for any time overlap
         (start_time < $4 AND end_time > $3)
       )`,
    [court_id, booking_date, start_time, end_time]
  );

  const result = res.rows[0];
  const isAvailable = parseInt(result.count) === 0;

  if (!isAvailable) {
    console.log(
      `Slot conflict detected for court ${court_id} on ${booking_date} ${start_time}-${end_time}`
    );
    console.log(`Conflicting slots: ${result.conflicting_slots}`);
  }

  return isAvailable;
}

// Get upcoming bookings
export async function getUpcomingBookings(user_id) {
  const res = await pool.query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            f.name as facility_name, f.location as facility_location
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     JOIN facilities f ON c.facility_id = f.id
     WHERE b.user_id = $1 
       AND b.booking_date >= CURRENT_DATE
       AND b.status = 'confirmed'
     ORDER BY b.booking_date ASC, b.start_time ASC`,
    [user_id]
  );
  return res.rows;
}

// Get slot availability for a court on a specific date
export async function getSlotAvailability(court_id, date) {
  const res = await pool.query(
    `SELECT start_time, end_time
     FROM bookings
     WHERE court_id = $1 
       AND booking_date = $2
       AND status NOT IN ('cancelled')
     ORDER BY start_time ASC`,
    [court_id, date]
  );
  return res.rows;
}

// Get booking analytics for owner
export async function getBookingAnalytics(facility_id, period_days = 30) {
  const res = await pool.query(
    `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as active_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status IN ('confirmed', 'completed') THEN total_amount END), 0) as avg_booking_value,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_hours END), 0) as total_hours_booked
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     WHERE c.facility_id = $1 
       AND b.booking_date >= CURRENT_DATE - INTERVAL '${period_days} days'`,
    [facility_id]
  );
  return res.rows[0];
}

// Get revenue analytics
export async function getRevenueAnalytics(facility_id, period_days = 30) {
  const res = await pool.query(
    `SELECT 
        DATE(b.booking_date) as booking_date,
        COUNT(*) as bookings_count,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_amount END), 0) as daily_revenue
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     WHERE c.facility_id = $1 
       AND b.booking_date >= CURRENT_DATE - INTERVAL '${period_days} days'
     GROUP BY DATE(b.booking_date)
     ORDER BY booking_date DESC`,
    [facility_id]
  );
  return res.rows;
}

// Get booking heatmap data
export async function getBookingHeatmap(facility_id, period_days = 7) {
  const res = await pool.query(
    `SELECT 
        EXTRACT(DOW FROM b.booking_date) as day_of_week,
        EXTRACT(HOUR FROM b.start_time) as hour_of_day,
        COUNT(*) as booking_count
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     WHERE c.facility_id = $1 
       AND b.booking_date >= CURRENT_DATE - INTERVAL '${period_days} days'
       AND b.status IN ('confirmed', 'completed')
     GROUP BY EXTRACT(DOW FROM b.booking_date), EXTRACT(HOUR FROM b.start_time)
     ORDER BY day_of_week, hour_of_day`,
    [facility_id]
  );
  return res.rows;
}

// Create slots for a court
export async function createSlots(slotData) {
  const {
    court_id,
    startDate,
    endDate,
    startTime,
    endTime,
    slotDuration,
    daysOfWeek,
    pricing,
  } = slotData;

  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate all slots
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      const startDateTime = new Date(
        `${date.toISOString().split("T")[0]}T${startTime}`
      );
      const endDateTime = new Date(
        `${date.toISOString().split("T")[0]}T${endTime}`
      );

      for (
        let time = new Date(startDateTime);
        time < endDateTime;
        time.setMinutes(time.getMinutes() + slotDuration)
      ) {
        const slotEndTime = new Date(time.getTime() + slotDuration * 60000);
        if (slotEndTime <= endDateTime) {
          const timeString = time.toTimeString().slice(0, 5);
          const isPeak = pricing.peakHours.includes(timeString);
          const price = isPeak ? pricing.peak : pricing.default;

          slots.push({
            court_id,
            date: date.toISOString().split("T")[0],
            start_time: timeString,
            end_time: slotEndTime.toTimeString().slice(0, 5),
            price,
            is_peak: isPeak,
            is_available: true,
          });
        }
      }
    }
  }

  // Insert slots into database (create a slots table if it doesn't exist)
  let slotsCreated = 0;

  try {
    // Create slots table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS court_slots (
        id SERIAL PRIMARY KEY,
        court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        is_peak BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(court_id, slot_date, start_time)
      );
    `);

    // Insert slots
    for (const slot of slots) {
      try {
        await pool.query(
          `INSERT INTO court_slots (court_id, slot_date, start_time, end_time, price, is_peak, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (court_id, slot_date, start_time) DO NOTHING`,
          [
            slot.court_id,
            slot.date,
            slot.start_time,
            slot.end_time,
            slot.price,
            slot.is_peak,
            slot.is_available,
          ]
        );
        slotsCreated++;
      } catch (error) {
        // Skip duplicate slots
        console.log(`Skipping duplicate slot: ${slot.date} ${slot.start_time}`);
      }
    }

    return {
      slotsCreated,
      details: {
        totalSlots: slots.length,
        dateRange: `${startDate} to ${endDate}`,
        timeRange: `${startTime} to ${endTime}`,
        slotDuration: `${slotDuration} minutes`,
        daysOfWeek: daysOfWeek.length,
      },
    };
  } catch (error) {
    console.error("Error creating slots:", error);
    throw error;
  }
}

// Save/update slots for a court
export async function saveSlots(court_id, date, slots) {
  try {
    // Delete existing slots for this court and date
    await pool.query(
      "DELETE FROM court_slots WHERE court_id = $1 AND slot_date = $2",
      [court_id, date]
    );

    let slotsUpdated = 0;

    // Insert new slots
    for (const slot of slots) {
      await pool.query(
        `INSERT INTO court_slots (court_id, slot_date, start_time, end_time, price, is_available)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          court_id,
          date,
          slot.start_time,
          slot.end_time,
          slot.price,
          slot.is_available,
        ]
      );
      slotsUpdated++;
    }

    return { slotsUpdated };
  } catch (error) {
    console.error("Error saving slots:", error);
    throw error;
  }
}

// Get slots for a court on a specific date
export async function getSlotsByCourtAndDate(court_id, date) {
  try {
    const res = await pool.query(
      "SELECT * FROM court_slots WHERE court_id = $1 AND slot_date = $2 ORDER BY start_time ASC",
      [court_id, date]
    );
    // Mark is_booked if needed (if you have a bookings table, join and mark)
    return res.rows;
  } catch (error) {
    console.error("Error fetching slots by court and date:", error);
    return [];
  }
}

// Get bookings by court and date
export async function getBookingsByCourtAndDate(court_id, date) {
  const res = await pool.query(
    `SELECT * FROM bookings 
     WHERE court_id = $1 AND booking_date = $2 AND status NOT IN ('cancelled')
     ORDER BY start_time ASC`,
    [court_id, date]
  );
  return res.rows;
}

// Create maintenance blocks to make slots unavailable
export async function createMaintenanceBlocks(
  court_id,
  date,
  unavailable_slots,
  owner_id
) {
  try {
    // Create maintenance_blocks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_blocks (
        id SERIAL PRIMARY KEY,
        court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
        block_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        reason VARCHAR(255) DEFAULT 'Maintenance',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(court_id, block_date, start_time)
      );
    `);

    let blocksCreated = 0;

    // Insert maintenance blocks for each unavailable slot
    for (const slot of unavailable_slots) {
      try {
        await pool.query(
          `INSERT INTO maintenance_blocks (court_id, block_date, start_time, end_time, reason, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (court_id, block_date, start_time) DO NOTHING`,
          [
            court_id,
            date,
            slot.start_time,
            slot.end_time,
            "Owner blocked slot",
            owner_id,
          ]
        );
        blocksCreated++;
      } catch (error) {
        console.log(
          `Skipping duplicate maintenance block: ${date} ${slot.start_time}`
        );
      }
    }

    return { blocksCreated };
  } catch (error) {
    console.error("Error creating maintenance blocks:", error);
    throw error;
  }
}

// Get maintenance blocks for a court on a specific date
export async function getMaintenanceBlocks(court_id, date) {
  try {
    const res = await pool.query(
      `SELECT * FROM maintenance_blocks 
       WHERE court_id = $1 AND block_date = $2 
       ORDER BY start_time ASC`,
      [court_id, date]
    );
    return res.rows;
  } catch (error) {
    console.error("Error fetching maintenance blocks:", error);
    return [];
  }
}
