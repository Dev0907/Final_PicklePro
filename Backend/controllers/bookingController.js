import pool from '../db.js';
import { getIO } from '../config/socket-redis.js';
import {
  createBooking,
  getBookingsByUser,
  getBookingsByFacility,
  getBookingsByCourt,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  completeBooking,
  isSlotAvailable,
  getUpcomingBookings,
  getSlotAvailability,
  getBookingAnalytics,
  getRevenueAnalytics,
  getBookingHeatmap,
  createSlots,
  saveSlots,
  getSlotsByCourtAndDate,
  getBookingsByCourtAndDate,
  createMaintenanceBlocks,
  getMaintenanceBlocks,
  removeMaintenanceBlocks
} from '../models/bookingModel.js';
import { getCourtById } from '../models/courtModel.js';
import { getFacilityById } from '../models/facilityModel.js';
import { createNotification } from '../models/notificationModel.js';

// Helper function to validate time format and logic
const validateTimeSlot = (booking_date, start_time, end_time) => {
  // Check if booking date is in the future
  const bookingDate = new Date(booking_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  bookingDate.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    return { valid: false, message: 'Cannot book slots for past dates' };
  }
  
  // Validate time format (HH:MM)
  const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeFormat.test(start_time) || !timeFormat.test(end_time)) {
    return { valid: false, message: 'Invalid time format. Use HH:MM format' };
  }
  
  // Check if start time is before end time
  const [startHour, startMin] = start_time.split(':').map(Number);
  const [endHour, endMin] = end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes >= endMinutes) {
    return { valid: false, message: 'Start time must be before end time' };
  }
  
  // Check minimum slot duration (e.g., 30 minutes)
  if (endMinutes - startMinutes < 30) {
    return { valid: false, message: 'Minimum booking duration is 30 minutes' };
  }
  
  // Check if booking is too far in advance (e.g., max 90 days)
  const maxAdvanceDays = 90;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  
  if (bookingDate > maxDate) {
    return { valid: false, message: `Cannot book more than ${maxAdvanceDays} days in advance` };
  }
  
  return { valid: true };
};

// Create booking with proper transaction handling and race condition prevention
const createBookingController = async (req, res) => {
  const client = await pool.connect();
  let io = null;
  
  try {
    // Try to get Socket.IO instance
    try {
      io = getIO();
    } catch (socketError) {
      console.log('Socket.IO not available, continuing without real-time updates:', socketError.message);
    }

    await client.query('BEGIN');

    const user_id = req.user?.id;
    if (!user_id) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const {
      court_id,
      booking_date,
      start_time,
      end_time,
      notes
    } = req.body;

    // Validate required fields
    if (!court_id || !booking_date || !start_time || !end_time) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Missing required fields: court_id, booking_date, start_time, end_time' });
    }

    // Validate time slot
    const timeValidation = validateTimeSlot(booking_date, start_time, end_time);
    if (!timeValidation.valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: timeValidation.message });
    }

    // Check if the court exists and is active
    const court = await getCourtById(court_id, client);
    if (!court || !court.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Court is not available for booking' });
    }

    // Check facility operating hours
    const facility = await getFacilityById(court.facility_id, client);
    if (!facility || !facility.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Facility is not active' });
    }

    // Validate booking time against facility operating hours
    if (facility.opening_time && facility.closing_time) {
      const [openHour, openMin] = facility.opening_time.split(':').map(Number);
      const [closeHour, closeMin] = facility.closing_time.split(':').map(Number);
      const [startHour, startMin] = start_time.split(':').map(Number);
      const [endHour, endMin] = end_time.split(':').map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (startMinutes < openMinutes || endMinutes > closeMinutes) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Booking time must be within facility hours: ${facility.opening_time} - ${facility.closing_time}` 
        });
      }
    }

    // Check for user's existing overlapping bookings
    const userConflictCheck = await client.query(
      `SELECT id FROM bookings 
       WHERE user_id = $1 
         AND booking_date = $2 
         AND status IN ('confirmed', 'in_progress')
         AND (
           (start_time <= $3 AND end_time > $3) OR
           (start_time < $4 AND end_time >= $4) OR
           (start_time >= $3 AND end_time <= $4)
         )`,
      [user_id, booking_date, start_time, end_time]
    );

    if (userConflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have a booking at this time' });
    }

    // Check for maximum bookings per day limit
    const dailyBookingCount = await client.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE user_id = $1 
         AND booking_date = $2 
         AND status IN ('confirmed', 'in_progress')`,
      [user_id, booking_date]
    );

    const maxBookingsPerDay = facility.max_bookings_per_user_per_day || 3;
    if (parseInt(dailyBookingCount.rows[0].count) >= maxBookingsPerDay) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Maximum ${maxBookingsPerDay} bookings per day allowed` 
      });
    }

    // Lock and check slot availability with proper race condition handling
    const slotLockQuery = `
      INSERT INTO slots (court_id, slot_date, start_time, end_time, is_available, is_booked, is_blocked, created_at, updated_at)
      VALUES ($1, $2, $3, $4, false, false, false, NOW(), NOW())
      ON CONFLICT (court_id, slot_date, start_time, end_time) 
      DO UPDATE SET updated_at = NOW()
      RETURNING id, is_booked, is_blocked, is_available
    `;

    const slotResult = await client.query(slotLockQuery, [court_id, booking_date, start_time, end_time]);
    
    if (slotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create or lock slot' });
    }

    // Now lock the slot for update to prevent race conditions
    const lockedSlot = await client.query(
      `SELECT id, is_booked, is_blocked, is_available 
       FROM slots 
       WHERE court_id = $1 
         AND slot_date = $2 
         AND start_time = $3 
         AND end_time = $4
       FOR UPDATE NOWAIT`,
      [court_id, booking_date, start_time, end_time]
    );

    if (lockedSlot.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to lock slot for booking' });
    }

    const slot = lockedSlot.rows[0];

    // Final availability check
    if (slot.is_booked || slot.is_blocked || !slot.is_available) {
      await client.query('ROLLBACK');
      const errorMsg = slot.is_booked 
        ? 'This slot has been booked by another player' 
        : slot.is_blocked 
        ? 'This slot is currently blocked for maintenance'
        : 'This slot is not available for booking';
      return res.status(409).json({ error: errorMsg });
    }

    // Check for maintenance blocks
    const maintenanceCheck = await client.query(
      `SELECT id FROM maintenance_blocks 
       WHERE court_id = $1 
         AND block_date = $2 
         AND (
           (start_time <= $3 AND end_time > $3) OR
           (start_time < $4 AND end_time >= $4) OR
           (start_time >= $3 AND end_time <= $4)
         )`,
      [court_id, booking_date, start_time, end_time]
    );

    if (maintenanceCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time slot is blocked for maintenance' });
    }

    // Calculate pricing
    const slotDurationMinutes = (() => {
      const [startHour, startMin] = start_time.split(':').map(Number);
      const [endHour, endMin] = end_time.split(':').map(Number);
      return (endHour * 60 + endMin) - (startHour * 60 + startMin);
    })();

    const pricePerHour = court.pricing_per_hour || 0;
    const totalAmount = (pricePerHour * slotDurationMinutes) / 60;

    // Create the booking
    const booking = await createBooking(
      {
        user_id,
        court_id,
        facility_id: court.facility_id,
        booking_date,
        start_time,
        end_time,
        status: 'confirmed',
        total_amount: totalAmount,
        notes: notes || null
      },
      client
    );

    if (!booking || !booking.id) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Update the slot to mark it as booked
    await client.query(
      `UPDATE slots 
       SET is_booked = true, 
           is_available = false,
           booked_by = $1,
           booking_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [user_id, booking.id, slot.id]
    );

    await client.query('COMMIT');

    // Emit socket event for real-time update
    if (io) {
      io.emit('slotBooked', {
        court_id,
        date: booking_date,
        start_time,
        end_time,
        user_id,
        booking_id: booking.id,
        facility_id: court.facility_id
      });
    }

    // Create notification for facility owner
    try {
      await createNotification({
        user_id: facility.owner_id,
        type: 'new_booking',
        title: 'New Booking Received',
        message: `New booking for ${court.name} on ${booking_date} from ${start_time} to ${end_time}`,
        related_entity_type: 'booking',
        related_entity_id: booking.id
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the booking creation for notification errors
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        court_id: booking.court_id,
        court_name: court.name,
        facility_id: booking.facility_id,
        facility_name: facility.name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        total_amount: booking.total_amount,
        created_at: booking.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', error);
    
    // Handle specific database errors
    if (error.code === '55P03') { // Lock not available
      return res.status(409).json({ 
        error: 'This slot is currently being booked by another user. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  } finally {
    client.release();
  }
};

// Get user's bookings with proper filtering
const getUserBookingsController = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
    const bookings = await getBookingsByUser(user_id, {
      status,
      date_from,
      date_to,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ 
      success: true,
      bookings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: bookings.length
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Cancel booking with proper validation and refund logic
const cancelBookingController = async (req, res) => {
  const client = await pool.connect();
  let io = null;
  
  try {
    io = getIO();
  } catch (socketError) {
    console.log('Socket.IO not available:', socketError.message);
  }

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const user_id = req.user?.id;
    const { reason } = req.body;
    
    if (!user_id) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const booking = await getBookingById(id, client);
    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns the booking or is the facility owner
    const facility = await getFacilityById(booking.facility_id, client);
    const isOwner = booking.user_id === user_id;
    const isFacilityOwner = facility && facility.owner_id === user_id;
    
    if (!isOwner && !isFacilityOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }

    // Check if booking can be cancelled (not already completed or cancelled)
    if (booking.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }

    // Check cancellation policy (e.g., must cancel at least 2 hours before)
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const minCancellationHours = facility?.cancellation_hours || 2;
    
    if (hoursUntilBooking < minCancellationHours && !isFacilityOwner) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Bookings must be cancelled at least ${minCancellationHours} hours in advance` 
      });
    }

    // Calculate refund amount based on cancellation policy
    let refundAmount = 0;
    if (isOwner && hoursUntilBooking >= minCancellationHours) {
      refundAmount = booking.total_amount;
    }

    // Cancel the booking
    const cancelledBooking = await cancelBooking(id, {
      cancelled_by: user_id,
      cancellation_reason: reason,
      refund_amount: refundAmount
    }, client);

    // Free up the slot
    await client.query(
      `UPDATE slots 
       SET is_booked = false, 
           is_available = true,
           booked_by = NULL,
           booking_id = NULL,
           updated_at = NOW()
       WHERE court_id = $1 
         AND slot_date = $2 
         AND start_time = $3 
         AND end_time = $4`,
      [booking.court_id, booking.booking_date, booking.start_time, booking.end_time]
    );

    await client.query('COMMIT');

    // Emit socket event
    if (io) {
      io.emit('bookingCancelled', {
        booking_id: booking.id,
        court_id: booking.court_id,
        date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time
      });
    }

    // Create notifications
    try {
      const notificationMessage = isOwner 
        ? `Your booking for ${booking.court_name} on ${booking.booking_date} has been cancelled`
        : `Booking for ${booking.court_name} on ${booking.booking_date} was cancelled by facility owner`;
      
      await createNotification({
        user_id: isOwner ? facility.owner_id : booking.user_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: notificationMessage,
        related_entity_type: 'booking',
        related_entity_id: booking.id
      });
    } catch (notificationError) {
      console.error('Failed to create cancellation notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: cancelledBooking,
      refund_amount: refundAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    client.release();
  }
};

// Get slot availability with proper filtering
const getSlotAvailabilityController = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { date, date_from, date_to } = req.query;
    
    if (!court_id) {
      return res.status(400).json({ error: 'Court ID is required' });
    }

    if (!date && (!date_from || !date_to)) {
      return res.status(400).json({ 
        error: 'Either date or date_from and date_to parameters are required' 
      });
    }

    // Verify court exists
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    let slots;
    if (date) {
      slots = await getSlotAvailability(court_id, date);
    } else {
      slots = await getSlotAvailability(court_id, null, { date_from, date_to });
    }

    res.json({ 
      success: true,
      slots,
      court: {
        id: court.id,
        name: court.name,
        sport_type: court.sport_type
      }
    });
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    res.status(500).json({ error: 'Failed to fetch slot availability' });
  }
};

// Get facility bookings (for owners)
const getFacilityBookingsController = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bookings = await getBookingsByFacility(facility_id);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching facility bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get court bookings
const getCourtBookingsController = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { date } = req.query;
    const bookings = await getBookingsByCourt(court_id, date);
    return res.json({ bookings });
  } catch (error) {
    console.error('Error fetching court bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get booking by ID
const getBookingByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete booking (for owners)
const completeBookingController = async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const completedBooking = await completeBooking(id);
    res.json({
      message: 'Booking completed successfully',
      booking: completedBooking
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get upcoming bookings
const getUpcomingBookingsController = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const bookings = await getUpcomingBookings(user_id);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get booking analytics for owner
const getBookingAnalyticsController = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const analytics = await getBookingAnalytics(facility_id);
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get revenue analytics
const getRevenueAnalyticsController = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const analytics = await getRevenueAnalytics(facility_id);
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get booking heatmap data
const getBookingHeatmapController = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const heatmap = await getBookingHeatmap(facility_id);
    res.json({ heatmap });
  } catch (error) {
    console.error('Error fetching booking heatmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create slots for a court (Owner only)
const createSlotsController = async (req, res) => {
  try {
    const { court_id, slots } = req.body;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const result = await createSlots({ court_id, slots });
    res.json({ message: 'Slots created successfully', result });
  } catch (error) {
    console.error('Error creating slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save/update slots for a court (Owner only)
const saveSlotsController = async (req, res) => {
  try {
    const { court_id, date, slots } = req.body;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const result = await saveSlots(court_id, date, slots);
    res.json({ message: 'Slots saved successfully', result });
  } catch (error) {
    console.error('Error saving slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get slots for a court
const getSlotsController = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { date } = req.query;
    const user_id = req.user?.id;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const slots = await getSlotsByCourtAndDate(court_id, date, user_id);
    res.json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get owner slots for a court
const getOwnerSlotsController = async (req, res) => {
  try {
    const { court_id } = req.params;
    const { date } = req.query;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const slots = await getSlotsByCourtAndDate(court_id, date, owner_id);
    res.json({ slots });
  } catch (error) {
    console.error('Error fetching owner slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update slot availability (Owner only)
const updateSlotAvailabilityController = async (req, res) => {
  try {
    const { court_id, date, slots } = req.body;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const result = await saveSlots(court_id, date, slots);
    res.json({ message: 'Slot availability updated successfully', result });
  } catch (error) {
    console.error('Error updating slot availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Block/Unblock slots (Owner only)
const blockSlotsController = async (req, res) => {
  try {
    const { court_id, date, slots, is_blocked } = req.body;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const result = await saveSlots(court_id, date, slots);
    res.json({ 
      message: `Slots ${is_blocked ? 'blocked' : 'unblocked'} successfully`, 
      result 
    });
  } catch (error) {
    console.error('Error blocking/unblocking slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export all controllers with consistent error handling
export {
  createBookingController,
  getUserBookingsController,
  getFacilityBookingsController,
  getCourtBookingsController,
  getBookingByIdController,
  cancelBookingController,
  completeBookingController,
  getUpcomingBookingsController,
  getSlotAvailabilityController,
  getBookingAnalyticsController,
  getRevenueAnalyticsController,
  getBookingHeatmapController,
  createSlotsController,
  saveSlotsController,
  getSlotsController,
  getOwnerSlotsController,
  updateSlotAvailabilityController,
  blockSlotsController
};