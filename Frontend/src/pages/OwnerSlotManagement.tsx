import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getToken } from '../utils/auth';
import { showSlotsUpdated, showCustomError, showCustomSuccess } from '../utils/sweetAlert';

interface Venue {
  id: number;
  name: string;
  location: string;
  operating_hours: string;
}

interface Court {
  id: number;
  facility_id: number;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  description?: string;
  is_active: boolean;
  operating_hours?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
}

interface TimeSlot {
  id?: number;
  court_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  price: number;
  is_available: boolean;
  is_booked: boolean;
  customer_name?: string;
}

const OwnerSlotManagement: React.FC = () => {
  const token = getToken();
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Generate time slots based on court operating hours
  const generateTimeSlots = (court?: Court): Omit<TimeSlot, 'id' | 'court_id' | 'slot_date'>[] => {
    const slots = [];
    
    if (!court) {
      // Fallback to default hours if court not available
      for (let hour = 6; hour < 22; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        const price = hour < 12 ? 500 : hour < 18 ? 600 : 700;
        
        slots.push({
          start_time: startTime,
          end_time: endTime,
          price,
          is_available: false,
          is_booked: false
        });
      }
      return slots;
    }

    // Parse court operating hours - handle both formats
    let startHour, endHour;
    if (court.operating_hours_start && court.operating_hours_end) {
      startHour = parseInt(court.operating_hours_start.split(':')[0]);
      endHour = parseInt(court.operating_hours_end.split(':')[0]);
    } else if (court.operating_hours) {
      startHour = parseInt(court.operating_hours.split('-')[0].trim().split(':')[0]);
      endHour = parseInt(court.operating_hours.split('-')[1].trim().split(':')[0]);
    } else {
      // Default fallback hours if no operating hours defined
      startHour = 6;
      endHour = 22;
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      // Use court's pricing per hour as base price
      const price = court.pricing_per_hour;
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        price,
        is_available: false,
        is_booked: false
      });
    }
    return slots;
  };

  // Fetch venues owned by the user
  const fetchVenues = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/facilities/owner/facilities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVenues(data.facilities || []);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setMessage({ type: 'error', text: 'Failed to load venues' });
    }
  };

  // Fetch courts for selected venue
  const fetchCourts = async (venueId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/courts/facility/${venueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourts(data.courts || []);
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      setMessage({ type: 'error', text: 'Failed to load courts' });
    }
  };

  // Fetch existing slots for selected court and date
  const fetchSlots = async (courtId: number, date: string) => {
    if (!courtId || !date) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/slots/${courtId}?date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Backend now returns slots with booking status
        setSlots(data.slots || []);
      } else {
        // Generate slots if none exist
        const court = courts.find(c => c.id === courtId);
        if (court) {
          const generatedSlots = generateTimeSlots(court);
          const slotsWithMeta = generatedSlots.map(slot => ({
            ...slot,
            court_id: courtId,
            slot_date: date
          }));
          setSlots(slotsWithMeta);
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Fallback to generating slots
      const court = courts.find(c => c.id === courtId);
      if (court) {
        const generatedSlots = generateTimeSlots(court);
        const slotsWithMeta = generatedSlots.map(slot => ({
          ...slot,
          court_id: courtId,
          slot_date: date
        }));
        setSlots(slotsWithMeta);
      }
      setMessage({ type: 'error', text: 'Failed to load slots' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle slot availability
  const toggleSlotAvailability = (index: number) => {
    if (slots[index].is_booked) return; // Can't toggle booked slots
    
    setSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, is_available: !slot.is_available } : slot
    ));
  };

  // Update slot availability
  const updateSlotAvailability = async () => {
    if (!selectedCourt || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select a court and date' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      // Get unavailable slots (slots that are not available)
      const unavailableSlots = slots
        .filter(slot => !slot.is_available)
        .map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time,
          reason: 'Owner blocked'
        }));

      console.log('Sending request to update slot availability:', {
        court_id: selectedCourt,
        date: selectedDate,
        unavailable_slots: unavailableSlots
      });

      const response = await fetch('http://localhost:5000/api/bookings/slots/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: selectedCourt,
          date: selectedDate,
          unavailable_slots: unavailableSlots
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        
        const successMessage = `Slot availability updated successfully! ${data.blocksCreated || 0} slots blocked for maintenance.`;
        setMessage({ type: 'success', text: successMessage });
        
        // Show success alert
        await showCustomSuccess('Slots Updated!', successMessage);
        
        // Refresh slots to show updated status
        fetchSlots(selectedCourt, selectedDate);
      } else {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to update slot availability';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        console.error('Error response:', errorMessage);
        setMessage({ type: 'error', text: errorMessage });
        
        // Show error alert
        await showCustomError('Update Failed!', errorMessage);
      }
    } catch (error) {
      console.error('Error updating slot availability:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setMessage({ type: 'error', text: errorMessage });
      
      // Show network error alert
      await showCustomError('Network Error!', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle venue selection
  const handleVenueChange = (venueId: number) => {
    setSelectedVenue(venueId);
    setSelectedCourt(null);
    setCourts([]);
    setSlots([]);
    setMessage(null);
    fetchCourts(venueId);
  };

  // Handle court selection
  const handleCourtChange = (courtId: number) => {
    setSelectedCourt(courtId);
    setSlots([]);
    setMessage(null);
    if (selectedDate) {
      fetchSlots(courtId, selectedDate);
    }
  };

  // Handle date selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSlots([]);
    setMessage(null);
    if (selectedCourt) {
      fetchSlots(selectedCourt, date);
    }
  };

  useEffect(() => {
    fetchVenues();
    
    // Test debug endpoint
    const testDebugEndpoint = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bookings/debug/test');
        const data = await response.json();
        console.log('Debug endpoint test:', data);
      } catch (error) {
        console.error('Debug endpoint test failed:', error);
      }
    };
    
    testDebugEndpoint();
  }, []);

  // Get tomorrow's date as minimum selectable date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedVenueData = venues.find(v => v.id === selectedVenue);
  const selectedCourtData = courts.find(c => c.id === selectedCourt);

  // Calculate statistics
  const availableSlots = slots.filter(s => s.is_available && !s.is_booked).length;
  const bookedSlots = slots.filter(s => s.is_booked).length;
  const disabledSlots = slots.filter(s => !s.is_available && !s.is_booked).length;
  const totalRevenue = slots.filter(s => s.is_booked).reduce((sum, s) => sum + parseFloat(s.price || 0), 0);

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Slot Management
            </h1>
            <p className="text-gray-600">
              Enable and manage time slots for your courts. Changes sync instantly with player bookings.
            </p>
          </div>

          {/* Step 1: Select Venue */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-deep-navy mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Step 1: Select Venue
            </h2>
            <select
              value={selectedVenue || ''}
              onChange={(e) => handleVenueChange(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
            >
              <option value="">Choose a venue...</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.location}
                </option>
              ))}
            </select>
            
            {selectedVenueData && (
              <div className="mt-4 p-4 bg-sky-mist rounded-lg">
                <h3 className="font-semibold text-deep-navy">{selectedVenueData.name}</h3>
                <p className="text-sm text-gray-700">📍 {selectedVenueData.location}</p>
                <p className="text-sm text-gray-700">🕒 {selectedVenueData.operating_hours}</p>
              </div>
            )}
          </div>

          {/* Step 2: Select Court & Date */}
          {selectedVenue && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-deep-navy mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Step 2: Choose Court & Date
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Court</label>
                  <select
                    value={selectedCourt || ''}
                    onChange={(e) => handleCourtChange(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  >
                    <option value="">Choose a court...</option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.name} - {court.sport_type} (₹{court.pricing_per_hour}/hr)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={getTomorrowDate()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                </div>
              </div>

              {selectedCourtData && (
                <div className="mt-4 p-4 bg-lemon-zest rounded-lg">
                  <h3 className="font-semibold text-deep-navy">{selectedCourtData.name}</h3>
                  <p className="text-sm text-gray-700">🏸 {selectedCourtData.sport_type}</p>
                  <p className="text-sm text-gray-700">💰 ₹{selectedCourtData.pricing_per_hour} per hour</p>
                  <p className="text-sm text-gray-700">🕒 {selectedCourtData.operating_hours}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Manage Slots */}
          {selectedCourt && selectedDate && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Step 3: Enable Time Slots
                </h2>
                <button
                  onClick={() => fetchSlots(selectedCourt, selectedDate)}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Statistics */}
              {slots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#E6FD53]/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#1B263F]">{availableSlots}</div>
                    <div className="text-sm text-[#1B263F]/70">Available</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{bookedSlots}</div>
                    <div className="text-sm text-red-700">Booked</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{disabledSlots}</div>
                    <div className="text-sm text-gray-700">Disabled</div>
                  </div>
                  <div className="bg-[#204F56]/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#204F56]">₹{totalRevenue}</div>
                    <div className="text-sm text-[#204F56]/70">Revenue</div>
                  </div>
                </div>
              )}

              {/* Slots Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading slots...</p>
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {slots.map((slot, index) => (
                    <button
                      key={`${slot.start_time}-${slot.end_time}`}
                      onClick={() => toggleSlotAvailability(index)}
                      disabled={slot.is_booked}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        slot.is_booked
                          ? 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed'
                          : slot.is_available
                          ? 'bg-[#E6FD53]/30 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/50'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {slot.start_time}-{slot.end_time}
                      </div>
                      <div className="text-xs">₹{slot.price}</div>
                      <div className="flex items-center justify-center mt-1">
                        {slot.is_booked ? (
                          <XCircle className="h-4 w-4" />
                        ) : slot.is_available ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      {slot.is_booked && slot.customer_name && (
                        <div className="text-xs mt-1 truncate">
                          {slot.customer_name}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Select a court and date to manage slots</p>
                </div>
              )}

              {/* Legend */}
              {slots.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-[#E6FD53]/30 border-2 border-[#E6FD53] rounded mr-2"></div>
                    <span>Available (Players can book)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded mr-2"></div>
                    <span>Booked (Cannot be changed)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
                    <span>Disabled (Maintenance/Owner blocked)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Save & Publish */}
          {slots.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-deep-navy mb-4 flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Step 4: Save & Publish
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">
                    Ready to publish {availableSlots} available slots for {selectedDate}?
                  </p>
                  <p className="text-sm text-gray-500">
                    Changes will be visible to players immediately.
                  </p>
                </div>
                
                <button
                  onClick={updateSlotAvailability}
                  disabled={saving || slots.length === 0}
                  className="flex items-center px-6 py-3 bg-[#204F56] text-[#FEFFFD] rounded-lg hover:bg-[#1B263F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Availability
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : message.type === 'error' ? (
                  <XCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message.text}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default OwnerSlotManagement;