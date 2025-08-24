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
  getBookingsByCourtAndDate,
  createMaintenanceBlocks,
  getMaintenanceBlocks
} from '../models/bookingModel.js';
import { getCourtById } from '../models/courtModel.js';
import { getFacilityById } from '../models/facilityModel.js';
import { createNotification } from '../models/notificationModel.js';

// Create booking
export async function createBookingController(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const {
      court_id,
      booking_date,
      start_time,
      end_time,
      notes
    } = req.body;

    if (!court_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Court ID, booking date, start time, and end time are required.' });
    }

    // Validate booking date (not in the past)
    const bookingDate = new Date(booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Cannot book slots for past dates' });
    }

    // Get court details
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Double-check slot availability with a more robust check
    const available = await isSlotAvailable(court_id, booking_date, start_time, end_time);
    if (!available) {
      return res.status(409).json({ 
        error: 'Selected time slot is no longer available. Please refresh and select a different slot.',
        code: 'SLOT_UNAVAILABLE'
      });
    }

    // Calculate total hours and amount
    const startHour = parseInt(start_time.split(':')[0]);
    const startMinute = parseInt(start_time.split(':')[1] || '0');
    const endHour = parseInt(end_time.split(':')[0]);
    const endMinute = parseInt(end_time.split(':')[1] || '0');
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const total_hours = (endTotalMinutes - startTotalMinutes) / 60;
    const total_amount = total_hours * parseFloat(court.pricing_per_hour);

    // Create booking with status 'booked'
    const booking = await createBooking({
      court_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      total_hours,
      total_amount,
      notes,
      status: 'booked'
    });

    // Create notification for successful booking
    try {
      await createNotification({
        user_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: `Your court booking for ${booking_date} from ${start_time} to ${end_time} has been confirmed. Total amount: ₹${total_amount}`,
        related_id: booking.id,
        related_type: 'booking'
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    // Get booking with details
    const bookingDetails = await getBookingById(booking.id);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingDetails,
      success: true
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle specific database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'This time slot has just been booked by another user. Please select a different slot.',
        code: 'SLOT_CONFLICT'
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user's bookings
export async function getUserBookingsController(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const bookings = await getBookingsByUser(user_id);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get facility bookings (for owners)
export async function getFacilityBookingsController(req, res) {
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
}

// Get court bookings
export async function getCourtBookingsController(req, res) {
  try {
    const { court_id } = req.params;
    const { date } = req.query;
    const bookings = await getBookingsByCourt(court_id, date);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching court bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get booking by ID
export async function getBookingByIdController(req, res) {
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
}

// Cancel booking
export async function cancelBookingController(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns the booking or is the facility owner
    const facility = await getFacilityById(booking.facility_id);
    if (booking.user_id !== user_id && (!facility || facility.owner_id !== user_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelledBooking = await cancelBooking(id);

    res.json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Complete booking (for owners)
export async function completeBookingController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if owner owns the facility
    const facility = await getFacilityById(booking.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
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
}

// Get upcoming bookings for user
export async function getUpcomingBookingsController(req, res) {
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
}

// Get slot availability for a court on a specific date
export async function getSlotAvailabilityController(req, res) {
  try {
    const { court_id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const slots = await getSlotAvailability(court_id, date);
    res.json({ slots });
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get booking analytics for owner
export async function getBookingAnalyticsController(req, res) {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    const { period = '30' } = req.query; // days
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await getBookingAnalytics(facility_id, parseInt(period));
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get revenue analytics for owner
export async function getRevenueAnalyticsController(req, res) {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    const { period = '30' } = req.query; // days
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const revenue = await getRevenueAnalytics(facility_id, parseInt(period));
    res.json({ revenue });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get booking heatmap for owner
export async function getBookingHeatmapController(req, res) {
  try {
    const { facility_id } = req.params;
    const owner_id = req.user?.id;
    const { period = '7' } = req.query; // days
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const heatmap = await getBookingHeatmap(facility_id, parseInt(period));
    res.json({ heatmap });
  } catch (error) {
    console.error('Error fetching booking heatmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create slots for a court (Owner only)
export async function createSlotsController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const {
      court_id,
      startDate,
      endDate,
      startTime,
      endTime,
      slotDuration,
      daysOfWeek,
      pricing
    } = req.body;

    if (!court_id || !startDate || !endDate || !startTime || !endTime || !slotDuration || !daysOfWeek || !pricing) {
      return res.status(400).json({ error: 'All fields are required for slot creation.' });
    }

    // Get court details and verify ownership
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const facility = await getFacilityById(court.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied. You can only create slots for your own courts.' });
    }

    // Create slots
    const result = await createSlots({
      court_id,
      startDate,
      endDate,
      startTime,
      endTime,
      slotDuration,
      daysOfWeek,
      pricing
    });

    res.status(201).json({
      message: 'Slots created successfully',
      slotsCreated: result.slotsCreated,
      details: result.details
    });

  } catch (error) {
    console.error('Error creating slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update slot availability for a court (Owner only)
export async function updateSlotAvailabilityController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const { court_id, date, unavailable_slots } = req.body;

    if (!court_id || !date || !Array.isArray(unavailable_slots)) {
      return res.status(400).json({ error: 'Court ID, date, and unavailable_slots array are required.' });
    }

    // Verify court ownership
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const facility = await getFacilityById(court.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied. You can only manage slots for your own courts.' });
    }

    // Create maintenance blocks for unavailable slots
    const result = await createMaintenanceBlocks(court_id, date, unavailable_slots, owner_id);

    res.status(200).json({
      message: 'Slot availability updated successfully',
      blocksCreated: result.blocksCreated
    });

  } catch (error) {
    console.error('Error updating slot availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Save/update slots for a court (Owner only)
export async function saveSlotsController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const { court_id, date, slots } = req.body;

    if (!court_id || !date || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Court ID, date, and slots array are required.' });
    }

    // Verify court ownership
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const facility = await getFacilityById(court.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied. You can only manage slots for your own courts.' });
    }

    // Save slots using the model function
    const result = await saveSlots(court_id, date, slots);

    res.status(200).json({
      message: 'Slots saved successfully',
      slotsUpdated: result.slotsUpdated
    });

  } catch (error) {
    console.error('Error saving slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get slots for a court on a specific date (Public)
export async function getSlotsController(req, res) {
  try {
    const { court_id } = req.params;
    const { date } = req.query;

    if (!court_id || !date) {
      return res.status(400).json({ error: 'Court ID and date are required.' });
    }

    // Get court details to generate slots from operating hours
    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Generate slots dynamically from court operating hours
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);
    const pricing = court.pricing_per_hour;

    // Get existing bookings and maintenance blocks for this court and date
    const existingBookings = await getBookingsByCourtAndDate(court_id, date);
    const maintenanceBlocks = await getMaintenanceBlocks(court_id, date);
    
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot is booked
      const isBooked = existingBookings.some(booking => 
        booking.start_time <= startTime && booking.end_time > startTime
      );
      
      // Check if this slot is blocked by maintenance
      const isBlocked = maintenanceBlocks.some(block => 
        block.start_time <= startTime && block.end_time > startTime
      );
      
      slots.push({
        court_id: parseInt(court_id),
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        price: pricing,
        is_available: !isBooked && !isBlocked,
        is_booked: isBooked,
        is_blocked: isBlocked
      });
    }

    res.status(200).json({
      slots: slots
    });

  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}