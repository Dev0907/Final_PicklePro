import {
  createCourt,
  getCourtsByFacility,
  getCourtById,
  updateCourt,
  deleteCourt,
  getAvailableSlots
} from '../models/courtModel.js';
import { getFacilityById } from '../models/facilityModel.js';

// Create court
export async function createCourtController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const {
      facility_id,
      name,
      sport_type,
      surface_type,
      court_size,
      pricing_per_hour,
      operating_hours_start,
      operating_hours_end
    } = req.body;

    if (!facility_id || !name || !sport_type || !pricing_per_hour || !operating_hours_start || !operating_hours_end) {
      return res.status(400).json({ error: 'Required fields: facility_id, name, sport_type, pricing_per_hour, operating_hours_start, operating_hours_end' });
    }

    // Validate operating hours logic
    const startHour = parseInt(operating_hours_start.split(':')[0]);
    const endHour = parseInt(operating_hours_end.split(':')[0]);
    
    if (startHour >= endHour) {
      return res.status(400).json({ 
        error: 'Invalid operating hours: start time must be before end time. Current: ' + 
               `${operating_hours_start} - ${operating_hours_end}` 
      });
    }
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      return res.status(400).json({ 
        error: 'Invalid operating hours: hours must be between 0-23. Current: ' + 
               `${operating_hours_start} - ${operating_hours_end}` 
      });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const court = await createCourt({
      facility_id,
      name,
      sport_type,
      surface_type,
      court_size,
      pricing_per_hour: parseFloat(pricing_per_hour),
      operating_hours_start,
      operating_hours_end
    });

    res.status(201).json({
      message: 'Court created successfully',
      court
    });
  } catch (error) {
    console.error('Error creating court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get courts by facility
export async function getCourtsByFacilityController(req, res) {
  try {
    const { facility_id } = req.params;
    const courts = await getCourtsByFacility(facility_id);
    res.json({ courts });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get court by ID
export async function getCourtByIdController(req, res) {
  try {
    const { id } = req.params;
    const court = await getCourtById(id);
    
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    res.json({ court });
  } catch (error) {
    console.error('Error fetching court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update court
export async function updateCourtController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if court belongs to owner
    const court = await getCourtById(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const facility = await getFacilityById(court.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = req.body;
    if (updates.pricing_per_hour) {
      updates.pricing_per_hour = parseFloat(updates.pricing_per_hour);
    }

    const updatedCourt = await updateCourt(id, updates);

    res.json({
      message: 'Court updated successfully',
      court: updatedCourt
    });
  } catch (error) {
    console.error('Error updating court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete court
export async function deleteCourtController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if court belongs to owner
    const court = await getCourtById(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const facility = await getFacilityById(court.facility_id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await deleteCourt(id);

    res.json({ message: 'Court deleted successfully' });
  } catch (error) {
    console.error('Error deleting court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get available slots for a court
export async function getAvailableSlotsController(req, res) {
  try {
    const { court_id } = req.params;
    const { date, start_time, end_time } = req.query;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Date, start_time, and end_time are required' });
    }

    const court = await getCourtById(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Generate hourly slots between start_time and end_time
    const slots = [];
    let currentHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);

    while (currentHour < endHour) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(currentHour + 1).toString().padStart(2, '0')}:00`;

      // Check if slot is available
      const isAvailable = await getAvailableSlots(court_id, date).then(existingSlots =>
        !existingSlots.some(s => s.start_time === slotStart && s.end_time === slotEnd)
      );

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        is_available: isAvailable
      });

      currentHour++;
    }

    res.json({
      court,
      date,
      available_slots: slots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}