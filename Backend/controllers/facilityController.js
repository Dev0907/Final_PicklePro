import {
  createFacility,
  getFacilitiesByOwner,
  getAllFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility
} from '../models/facilityModel.js';

// Create facility
export async function createFacilityController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const {
      name,
      location,
      description,
      sports_supported,
      amenities,
      photos
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required.' });
    }

    const facility = await createFacility({
      owner_id,
      name,
      location,
      description,
      sports_supported: sports_supported || [],
      amenities: amenities || [],
      photos: photos || []
    });

    res.status(201).json({
      message: 'Facility created successfully',
      facility
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get owner's facilities
export async function getOwnerFacilitiesController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    const facilities = await getFacilitiesByOwner(owner_id);
    res.json({ facilities });
  } catch (error) {
    console.error('Error fetching owner facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all facilities (public)
export async function getAllFacilitiesController(req, res) {
  try {
    const facilities = await getAllFacilities();
    res.json({ facilities });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get facility by ID
export async function getFacilityByIdController(req, res) {
  try {
    const { id } = req.params;
    const facility = await getFacilityById(id);
    
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json({ facility });
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update facility
export async function updateFacilityController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = req.body;
    const updatedFacility = await updateFacility(id, updates);

    res.json({
      message: 'Facility updated successfully',
      facility: updatedFacility
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete facility
export async function deleteFacilityController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: 'Unauthorized. Owner ID missing.' });
    }

    // Check if facility belongs to owner
    const facility = await getFacilityById(id);
    if (!facility || facility.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await deleteFacility(id);

    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}