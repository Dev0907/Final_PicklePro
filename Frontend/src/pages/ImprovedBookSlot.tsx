import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { BookingSystemDiagnostic } from '../components/BookingSystemDiagnostic';
import { getCurrentUser, getToken } from '../utils/auth';

// TypeScript Interfaces
interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports_supported: string[];
  amenities: string[];
  photos: string[];
  owner_name: string;
  courts: Court[];
}

interface Court {
  id: string;
  name: string;
  sport_type: string;
  surface_type: string;
  court_size: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
}

interface TimeSlot {
  id?: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  is_available: boolean;
  is_booked: boolean;
  selected?: boolean;
}

interface SelectedSlot extends TimeSlot {
  selected: boolean;
}

// Component
const ImprovedBookSlot: React.FC = () => {
  // State Management
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [viewMode, setViewMode] = useState<'venues' | 'courts' | 'slots'>('venues');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  
  const currentUser = getCurrentUser();
  const token = getToken();

  // New state for start and end time
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');

  // Derived Data
  const uniqueSports = Array.from(new Set(facilities.flatMap(f => f.sports_supported)));
  const uniqueLocations = Array.from(new Set(facilities.map(f => f.location)));

  // Enhanced Notification Handler
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number = 5000) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
    }`;
    
    // Add icon based on type
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2 text-lg">${icon}</span>
        <span class="flex-1">${message}</span>
        <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  };

  // Fetch Facilities
  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching facilities from:', 'http://localhost:5000/api/facilities/all');
      const response = await fetch('http://localhost:5000/api/facilities/all');
      const data = await response.json();
      console.log('Facilities response:', data);
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch facilities');
        return;
      }
      
      const facilities = data.facilities || [];
      console.log('Parsed facilities:', facilities.length);
      setFacilities(facilities);
      setFilteredFacilities(facilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Time Slots
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedCourt || !selectedDate) return;
    setSlotsLoading(true);
    try {
      const url = `http://localhost:5000/api/bookings/court/${selectedCourt.id}/slots?date=${selectedDate}`;
      console.log('Fetching slots from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('Slots response:', data);
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch slots');
      const bookedSlots = data.slots || [];
      const generatedSlots = generateTimeSlots(selectedCourt, selectedDate, bookedSlots);
      console.log('Generated slots:', generatedSlots.length);
      setTimeSlots(generatedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      showNotification('error', 'Error fetching slots: ' + error.message);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedCourt, selectedDate]);

  // Generate Time Slots
  const generateTimeSlots = (court: Court, date: string, bookedSlots: any[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);
    
    // Check if the selected date is today
    const isToday = date === new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if slot is booked
      const isBooked = bookedSlots.some(
        s => s.booking_date === date && s.start_time === startTime && s.end_time === endTime
      );
      
      // Check if slot is in the past (for today only)
      const isPastSlot = isToday && hour <= currentHour;
      
      slots.push({
        court_id: court.id,
        date,
        start_time: startTime,
        end_time: endTime,
        price: court.pricing_per_hour,
        is_available: !isBooked && !isPastSlot,
        is_booked: isBooked,
      });
    }
    return slots;
  };

  // Handle Slot Toggle
  const handleSlotToggle = (slotIndex: number) => {
    const updatedSlots = [...timeSlots];
    if (!updatedSlots[slotIndex].is_available || updatedSlots[slotIndex].is_booked) return;
    
    updatedSlots[slotIndex].selected = !updatedSlots[slotIndex].selected;
    const newSelectedSlots = updatedSlots.filter(slot => slot.selected) as SelectedSlot[];
    setTimeSlots(updatedSlots);
    setSelectedSlots(newSelectedSlots);
  };

  // Clear Selected Slots
  const clearSelectedSlots = () => {
    setSelectedSlots([]);
    setTimeSlots(timeSlots.map(slot => ({ ...slot, selected: false })));
  };

  // Calculate Total Amount and Hours
  const getTotalAmount = () => selectedSlots.reduce((total, slot) => total + parseFloat(slot.price || 0), 0);
  const getTotalHours = () => selectedSlots.length;

  // Calculate proper start and end time for multiple slots
  const getBookingTimeRange = () => {
    if (selectedSlots.length === 0) return { startTime: '', endTime: '', duration: 0, isConsecutive: true };
    
    // Sort slots by start time to ensure proper order
    const sortedSlots = [...selectedSlots].sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );
    
    const startTime = sortedSlots[0].start_time;
    const endTime = sortedSlots[sortedSlots.length - 1].end_time;
    
    // Calculate total duration in hours
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1] || '0');
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1] || '0');
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const duration = (endTotalMinutes - startTotalMinutes) / 60;
    
    // Check if slots are consecutive
    let isConsecutive = true;
    for (let i = 1; i < sortedSlots.length; i++) {
      const prevEndTime = sortedSlots[i - 1].end_time;
      const currentStartTime = sortedSlots[i].start_time;
      if (prevEndTime !== currentStartTime) {
        isConsecutive = false;
        break;
      }
    }
    
    return { startTime, endTime, duration, isConsecutive, sortedSlots };
  };

  // Handle Proceed to Payment
  const handleProceedToPayment = () => {
    if (!currentUser) {
      showNotification('error', 'Please log in to book slots');
      return;
    }
    if (selectedSlots.length === 0) {
      showNotification('error', 'Please select at least one time slot');
      return;
    }
    setShowPaymentModal(true);
  };

  // Handle Booking Confirmation
  const handleBookConfirm = async () => {
    if (!currentUser) {
      showNotification('error', 'Please log in to book slots');
      return;
    }
    
    if (selectedSlots.length === 0) {
      showNotification('error', 'No slots selected');
      return;
    }

    setBookingInProgress(true);
    try {
      const { startTime: bookingStartTime, endTime: bookingEndTime, duration } = getBookingTimeRange();
      
      // Create individual bookings for each slot but with proper time calculation
      const bookingPromises = selectedSlots.map(async (slot) => {
        const response = await fetch('http://localhost:5000/api/bookings/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            court_id: selectedCourt?.id,
            booking_date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            total_hours: 1, // Each slot is 1 hour
            total_amount: parseFloat(slot.price || 0),
            notes: `Booking for ${selectedFacility?.name} - ${selectedCourt?.name} (${bookingStartTime} - ${bookingEndTime}, ${duration} hours total)`,
          }),
        });
        
        const data = await response.json();
        return { response, data, slot };
      });

      const results = await Promise.all(bookingPromises);
      const failedBookings = results.filter(r => !r.response.ok);
      const successfulBookings = results.filter(r => r.response.ok);

      if (failedBookings.length === 0) {
        showNotification('success', `🎉 All ${results.length} slot(s) booked successfully! Redirecting to your bookings...`);
        clearSelectedSlots();
        setShowPaymentModal(false);
        fetchTimeSlots();
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/my-bookings';
        }, 2000);
      } else {
        // Show detailed error information
        const errorMessages = failedBookings.map(booking => 
          `${booking.slot.start_time}-${booking.slot.end_time}: ${booking.data.error || 'Unknown error'}`
        ).join(', ');
        
        if (successfulBookings.length > 0) {
          showNotification('warning', 
            `${successfulBookings.length} slot(s) booked successfully. ${failedBookings.length} failed: ${errorMessages}`
          );
        } else {
          showNotification('error', `All bookings failed: ${errorMessages}`);
        }
        
        fetchTimeSlots(); // Refresh to show updated availability
      }
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('error', 'Network error occurred. Please check your connection and try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Handle Facility Selection
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setViewMode('courts');
  };

  // Handle Court Selection
  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court);
    setViewMode('slots');
  };

  // Filter Facilities
  useEffect(() => {
    let filtered = facilities;
    if (searchTerm) {
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedSport) {
      filtered = filtered.filter(facility =>
        facility.sports_supported.includes(selectedSport)
      );
    }
    if (selectedLocation) {
      filtered = filtered.filter(facility =>
        facility.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    setFilteredFacilities(filtered);
  }, [searchTerm, selectedSport, selectedLocation, facilities]);

  // Fetch Facilities on Mount
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Auto-refresh Slots
  useEffect(() => {
    if (viewMode === 'slots' && selectedCourt && selectedDate) {
      fetchTimeSlots();
      const interval = setInterval(fetchTimeSlots, 30000);
      return () => clearInterval(interval);
    }
  }, [viewMode, selectedCourt, selectedDate, fetchTimeSlots]);

  // Fetch available slots for owner
  const fetchAvailableSlots = async (courtId: string, date: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `http://localhost:5000/api/courts/${courtId}/available-slots?date=${date}&start_time=${startTime}&end_time=${endTime}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to fetch slots');
        setLoading(false);
        return;
      }
      setTimeSlots(data.available_slots || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              {viewMode === 'venues' ? 'Select a Venue' :
               viewMode === 'courts' ? 'Choose Your Court' :
               'Book Your Slots'}
            </h1>
            <p className="text-gray-600">
              {viewMode === 'venues' ? 'Choose from our premium sports facilities' :
               viewMode === 'courts' ? `Select a court at ${selectedFacility?.name}` :
               `Select one or more time slots for ${selectedCourt?.name} at ${selectedFacility?.name}`}
            </p>
          </div>

          {/* Navigation Breadcrumb */}
          {(viewMode === 'courts' || viewMode === 'slots') && (
            <div className="flex items-center text-sm mb-6">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
                  onClick={() => setViewMode('venues')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 inline" /> Venues
                </button>
                <span className="text-gray-400">→</span>
                {viewMode === 'slots' && (
                  <>
                    <button
                      type="button"
                      className="text-ocean-teal"
                      onClick={() => setViewMode('courts')}
                    >
                      Select Court
                    </button>
                    <span className="text-gray-400">→</span>
                  </>
                )}
                <span className="text-deep-navy font-medium">Book Slots</span>
              </div>
            </div>
          )}

          {/* Diagnostic Component - Show only when there are errors */}
          {viewMode === 'venues' && (error || facilities.length === 0) && (
            <BookingSystemDiagnostic />
          )}

          {/* Search and Filter */}
          {viewMode === 'venues' && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search facilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">All Sports</option>
                  {uniqueSports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSport('');
                    setSelectedLocation('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Quick Booking Summary - Shows when slots are selected */}
          {selectedSlots.length > 0 && viewMode === 'slots' && (
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow-lg p-4 mb-6 sticky top-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSlots.length}</div>
                    <div className="text-xs opacity-90">Slots Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{getBookingTimeRange().startTime} - {getBookingTimeRange().endTime}</div>
                    <div className="text-xs opacity-90">Time Range</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{getBookingTimeRange().duration}h</div>
                    <div className="text-xs opacity-90">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">₹{getTotalAmount()}</div>
                    <div className="text-xs opacity-90">Total Amount</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                    onClick={clearSelectedSlots}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                    onClick={handleProceedToPayment}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Venues Grid */}
          {viewMode === 'venues' && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading facilities...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Unable to Load Facilities</h3>
                  <p className="text-red-500 mb-4">{error}</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Please check:</p>
                    <ul className="text-sm text-gray-500 list-disc list-inside">
                      <li>Backend server is running on port 5000</li>
                      <li>Database connection is working</li>
                      <li>Network connection is stable</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="mt-4 px-6 py-2 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
                    onClick={fetchFacilities}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredFacilities.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No facilities found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFacilities.map(facility => (
                    <div
                      key={facility.id}
                      className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => handleSelectFacility(facility)}
                    >
                      <div className="relative">
                        {facility.photos.length > 0 ? (
                          <img
                            src={facility.photos[0]}
                            alt={facility.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                            <Users className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm font-medium text-deep-navy shadow-md">
                          {facility.courts.filter(c => c.is_active).length} Court{facility.courts.filter(c => c.is_active).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-2">{facility.name}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {facility.location}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{facility.description}</p>
                      {facility.sports_supported.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-deep-navy mb-2">Sports:</h4>
                          <div className="flex flex-wrap gap-x-2">
                            {facility.sports_supported.slice(0, 3).map((sport, index) => (
                              <span key={index} className="px-2 py-1 bg-sky-mist text-deep-navy rounded-full text-xs">
                                {sport}
                              </span>
                            ))}
                            {facility.sports_supported.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{facility.sports_supported.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {facility.amenities.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-deep-navy mb-2">Amenities:</h4>
                          <div className="flex flex-wrap gap-2">
                            {facility.amenities.map((amenity, index) => (
                              <span key={index} className="px-3 py-1 bg-sky-mist text-deep-navy rounded-full text-xs">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Court Selection View */}
          {viewMode === 'courts' && selectedFacility && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-deep-navy mb-6">
                Choose a Court ({selectedFacility.courts.filter(c => c.is_active).length} available)
              </h3>
              {selectedFacility.courts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No courts available at this facility</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedFacility.courts.filter(court => court.is_active).map(court => (
                    <div
                      key={court.id}
                      className="p-6 border border-gray-200 rounded-lg hover:border-ocean-teal hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => handleSelectCourt(court)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-semibold text-deep-navy group-hover:text-ocean-teal transition-colors">
                          {court.name}
                        </h4>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">₹{court.pricing_per_hour}</div>
                          <div className="text-xs text-gray-500">per hour</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sport:</span>
                          <span className="text-sm font-medium text-deep-navy bg-blue-50 px-2 py-1 rounded">
                            {court.sport_type}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Surface:</span>
                          <span className="text-sm font-medium text-deep-navy">{court.surface_type || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Size:</span>
                          <span className="text-sm font-medium text-deep-navy">{court.court_size || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Operating Hours:</span>
                          <div className="flex items-center text-sm text-deep-navy">
                            <Clock className="h-3 w-3 mr-1" />
                            {court.operating_hours_start} - {court.operating_hours_end}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          className="w-full py-2 px-4 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCourt(court);
                          }}
                        >
                          Select This Court
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Slot Selection View */}
          {viewMode === 'slots' && selectedCourt && selectedFacility && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-deep-navy">
                  <Clock className="h-5 w-5 mr-2 inline" />
                  Select Time Slots - {new Date(selectedDate).toLocaleDateString()}
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={fetchTimeSlots}
                    disabled={slotsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${slotsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  {selectedSlots.length === 0 && (
                    <div className="text-sm text-gray-500">
                      Select slots to proceed with booking
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-deep-navy mb-3">Date Selection</h3>
                <div className="max-w-md">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 30 days from now
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can book slots up to 30 days in advance
                  </p>
                </div>
              </div>
              
              {slotsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available slots...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">No slots available for this date</p>
                  <p className="text-gray-500">Try selecting a different court or date</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-200 border border-green-400 rounded mr-2"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded mr-2"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-200 border border-red-400 rounded mr-2"></div>
                      <span>Booked</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={!slot.is_available || slot.is_booked}
                        onClick={() => handleSlotToggle(index)}
                        className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
                          slot.is_booked ? 'bg-red-200 border-red-500 opacity-60 cursor-not-allowed' :
                          slot.selected ? 'bg-blue-50 border-blue-400 shadow-md scale-105' :
                          slot.is_available ? 'bg-green-50 border-green-400 hover:border-green-300 hover:bg-green-100' :
                          'bg-gray-200 border-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {slot.selected && (
                          <div className="absolute -right-2 -top-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-deep-navy mb-2">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">₹{slot.price}</div>
                        <div className={`text-xs font-medium ${
                          slot.is_booked ? 'text-red-600' :
                          slot.selected ? 'text-blue-600' :
                          slot.is_available ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {slot.is_booked ? 'Booked' :
                           slot.selected ? 'Selected' :
                           slot.is_available ? 'Available' : 'Unavailable'}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedSlots.length > 0 && (
                    <div className="bg-gradient-to-r from-ocean-teal to-blue-600 text-white rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-3">Selected Slots Summary</h3>
                      {!getBookingTimeRange().isConsecutive && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                          <div className="flex items-center text-yellow-800">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Non-consecutive slots selected</span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            You have selected slots that are not consecutive. Each slot will be booked separately.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="opacity-80">Facility:</span>
                          <div className="font-medium">{selectedFacility.name}</div>
                        </div>
                        <div>
                          <span className="opacity-80">Court:</span>
                          <div className="font-medium">{selectedCourt.name}</div>
                        </div>
                        <div>
                          <span className="opacity-80">Date:</span>
                          <div className="font-medium">{new Date(selectedDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="opacity-80">Time Range:</span>
                          <div className="font-medium">{getBookingTimeRange().startTime} - {getBookingTimeRange().endTime}</div>
                        </div>
                        <div>
                          <span className="opacity-80">Selected Slots:</span>
                          <div className="font-medium">{selectedSlots.length}</div>
                        </div>
                        <div>
                          <span className="opacity-80">Duration:</span>
                          <div className="font-semibold text-lg">{getBookingTimeRange().duration} hours</div>
                        </div>
                        <div>
                          <span className="opacity-80">Total Amount:</span>
                          <div className="font-semibold text-lg">₹{getTotalAmount()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Payment Confirmation Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-deep-navy">Confirm Your Booking</h2>
                  <p className="text-gray-600">Review your slot selection and proceed with payment</p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-deep-navy mb-3">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Facility:</span>
                        <div className="font-medium text-deep-navy">{selectedFacility?.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Court:</span>
                        <div className="font-medium text-deep-navy">{selectedCourt?.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <div className="font-medium text-deep-navy">{new Date(selectedDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Time Range:</span>
                        <div className="font-medium text-deep-navy">{getBookingTimeRange().startTime} - {getBookingTimeRange().endTime}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Slots:</span>
                        <div className="font-medium text-deep-navy">{selectedSlots.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-semibold text-lg text-deep-navy">{getBookingTimeRange().duration} hours</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <div className="font-semibold text-lg text-green-600">₹{getTotalAmount()}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-deep-navy mb-3">Selected Time Slots</h3>
                    <div className="space-y-2">
                      {selectedSlots.map((slot, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                          </div>
                          <span className="font-semibold text-deep-navy">₹{slot.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-yellow-600">
                    <AlertCircle className="h-5 w-5 mr-2 inline" />
                    <strong>Payment Notice:</strong> This is a demo booking system. Integrate with payment gateways like Stripe, PayPal, or Razorpay.
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
                      onClick={handleBookConfirm}
                      disabled={bookingInProgress}
                    >
                      {bookingInProgress ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedBookSlot;