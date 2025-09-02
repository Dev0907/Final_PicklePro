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
       AND status IN ('booked', 'confirmed', 'completed')
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
  try {
    // Get court details to generate slots from operating hours
    const courtRes = await pool.query(
      'SELECT operating_hours_start, operating_hours_end, pricing_per_hour FROM courts WHERE id = $1',
      [court_id]
    );

    if (courtRes.rows.length === 0) {
      return [];
    }

    const court = courtRes.rows[0];
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);

    // Get existing bookings for this court and date
    const bookingsRes = await pool.query(
      `SELECT b.*, u.fullname as user_name, u.phone_no as user_phone, u.email as user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.court_id = $1 AND b.booking_date = $2 AND b.status IN ('booked', 'confirmed', 'completed')
       ORDER BY b.start_time ASC`,
      [court_id, date]
    );

    // Get maintenance blocks for this court and date
    const maintenanceRes = await pool.query(
      `SELECT * FROM maintenance_blocks 
       WHERE court_id = $1 AND block_date = $2 
       ORDER BY start_time ASC`,
      [court_id, date]
    );

    const bookings = bookingsRes.rows;
    const maintenanceBlocks = maintenanceRes.rows;

    // Generate slots dynamically
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot is booked
      const booking = bookings.find(b => {
        const bookingStart = b.start_time;
        const bookingEnd = b.end_time;
        return (startTime >= bookingStart && startTime < bookingEnd) ||
               (endTime > bookingStart && endTime <= bookingEnd) ||
               (startTime <= bookingStart && endTime >= bookingEnd);
      });
      
      // Check if this slot is blocked by maintenance
      const maintenance = maintenanceBlocks.find(m => {
        const maintenanceStart = m.start_time;
        const maintenanceEnd = m.end_time;
        return (startTime >= maintenanceStart && startTime < maintenanceEnd) ||
               (endTime > maintenanceStart && endTime <= maintenanceEnd) ||
               (startTime <= maintenanceStart && endTime >= maintenanceEnd);
      });
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        price: court.pricing_per_hour,
        is_available: !booking && !maintenance,
        is_booked: !!booking,
        is_blocked: !!maintenance,
        booking_id: booking?.id || null,
        user_name: booking?.user_name || null,
        user_phone: booking?.user_phone || null,
        user_email: booking?.user_email || null,
        booking_status: booking?.status || null,
        maintenance_reason: maintenance?.reason || null,
        slot_status: booking ? 'booked' : maintenance ? 'maintenance' : 'available'
      });
    }

    return slots;
  } catch (error) {
    console.error("Error fetching slot availability:", error);
    return [];
  }
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

// Create slots for a court (Owner only)
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

  try {
    // For now, we'll use the dynamic slot generation approach
    // This ensures slots are always available without needing to pre-create them
    console.log('Slots will be generated dynamically for each request');
    
    return {
      slotsCreated: 0,
      details: {
        message: 'Slots are generated dynamically based on court operating hours',
        dateRange: `${startDate} to ${endDate}`,
        timeRange: `${startTime} to ${endTime}`,
        slotDuration: `${slotDuration} minutes`,
        daysOfWeek: daysOfWeek.length,
      },
    };
  } catch (error) {
    console.error("Error in createSlots:", error);
    throw error;
  }
}

// Save/update slots for a court (Owner only)
export async function saveSlots(court_id, date, slots) {
  try {
    // Since we're using dynamic slot generation, this function now handles maintenance blocks
    // instead of individual slot management
    
    let blocksCreated = 0;
    let blocksRemoved = 0;

    // Handle maintenance blocks
    for (const slot of slots) {
      if (slot.is_blocked) {
        // Create maintenance block
        await pool.query(
          `INSERT INTO maintenance_blocks (court_id, block_date, start_time, end_time, reason, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (court_id, block_date, start_time, end_time) DO NOTHING`,
          [court_id, date, slot.start_time, slot.end_time, slot.maintenance_reason || 'Maintenance', 'owner']
        );
        blocksCreated++;
      } else if (!slot.is_blocked && slot.maintenance_reason) {
        // Remove maintenance block
        await pool.query(
          `DELETE FROM maintenance_blocks 
           WHERE court_id = $1 AND block_date = $2 AND start_time = $3 AND end_time = $4`,
          [court_id, date, slot.start_time, slot.end_time]
        );
        blocksRemoved++;
      }
    }

    return { 
      slotsUpdated: 0,
      blocksCreated,
      blocksRemoved,
      message: 'Maintenance blocks updated successfully'
    };
  } catch (error) {
    console.error("Error saving slots:", error);
    throw error;
  }
}

// Get slots for a court on a specific date with booking information
export async function getSlotsByCourtAndDate(court_id, date, current_user_id = null) {
  try {
    // Get court details to generate slots from operating hours
    const courtRes = await pool.query(
      'SELECT operating_hours_start, operating_hours_end, pricing_per_hour FROM courts WHERE id = $1',
      [court_id]
    );

    if (courtRes.rows.length === 0) {
      return [];
    }

    const court = courtRes.rows[0];
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);

    // Validate operating hours to prevent invalid slot generation
    if (startHour >= endHour) {
      console.error(`Invalid operating hours for court ${court_id}: ${startHour}:00 - ${endHour}:00`);
      return [];
    }

    // Get existing bookings for this court and date (including all active statuses)
    const bookingsRes = await pool.query(
      `SELECT b.*, u.fullname as user_name, u.phone_no as user_phone, u.email as user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.court_id = $1 AND b.booking_date = $2 AND b.status IN ('booked', 'confirmed', 'completed')
       ORDER BY b.start_time ASC`,
      [court_id, date]
    );

    // Get maintenance blocks for this court and date
    const maintenanceRes = await pool.query(
      `SELECT * FROM maintenance_blocks 
       WHERE court_id = $1 AND block_date = $2 
       ORDER BY start_time ASC`,
      [court_id, date]
    );

    const bookings = bookingsRes.rows;
    const maintenanceBlocks = maintenanceRes.rows;

    // Generate slots dynamically for all future dates (no need for daily publishing)
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot is booked (more precise overlap detection)
      const booking = bookings.find(b => {
        const bookingStart = b.start_time;
        const bookingEnd = b.end_time;
        // Check if the slot time overlaps with booking time
        return (startTime >= bookingStart && startTime < bookingEnd) ||
               (endTime > bookingStart && endTime <= bookingEnd) ||
               (startTime <= bookingStart && endTime >= bookingEnd);
      });
      
      // Check if this slot is blocked by maintenance (more precise overlap detection)
      const maintenance = maintenanceBlocks.find(m => {
        const maintenanceStart = m.start_time;
        const maintenanceEnd = m.end_time;
        // Check if the slot time overlaps with maintenance time
        return (startTime >= maintenanceStart && startTime < maintenanceEnd) ||
               (endTime > maintenanceStart && endTime <= maintenanceEnd) ||
               (startTime <= maintenanceStart && endTime >= maintenanceEnd);
      });
      
      slots.push({
        court_id: parseInt(court_id),
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        price: court.pricing_per_hour,
        is_available: !booking && !maintenance, // Available only if not booked and not under maintenance
        is_booked: !!booking,
        is_blocked: !!maintenance,
        booking_id: booking?.id || null,
        user_id: booking?.user_id || null,
        user_name: booking?.user_name || null,
        user_phone: booking?.user_phone || null,
        user_email: booking?.user_email || null,
        booking_status: booking?.status || null,
        maintenance_reason: maintenance?.reason || null,
        is_own_booking: current_user_id && booking?.user_id === current_user_id
      });
    }

    return slots;
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

// Remove maintenance blocks to make slots available again
export async function removeMaintenanceBlocks(court_id, date, available_slots, owner_id) {
  try {
    let blocksRemoved = 0;

    // Remove maintenance blocks for each slot that should be available
    for (const slot of available_slots) {
      try {
        const result = await pool.query(
          `DELETE FROM maintenance_blocks 
           WHERE court_id = $1 AND block_date = $2 AND start_time = $3 AND end_time = $4
           RETURNING id`,
          [court_id, date, slot.start_time, slot.end_time]
        );
        if (result.rows.length > 0) {
          blocksRemoved++;
        }
      } catch (error) {
        console.log(`Error removing maintenance block: ${date} ${slot.start_time}`);
      }
    }

    return { blocksRemoved };
  } catch (error) {
    console.error("Error removing maintenance blocks:", error);
    throw error;
  }
}
