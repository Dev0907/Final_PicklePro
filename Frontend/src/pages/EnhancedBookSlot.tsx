import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Clock, Users, Filter, Search, Image as ImageIcon, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { PaymentModal } from '../components/PaymentModal';
import { getToken } from '../utils/auth';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports_supported: string[];
  amenities: string[];
  photos: string[];
  owner_name: string;
  court_count: number;
  active_courts: number;
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
  description?: string;
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
}

const EnhancedBookSlot: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'venues' | 'courts' | 'slots'>('venues');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    totalHours: number;
  } | null>(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/facilities/all');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch facilities');
        return;
      }

      setFacilities(data.facilities || []);
      setFilteredFacilities(data.facilities || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Fetch slots when court or date changes
  useEffect(() => {
    if (selectedCourt && selectedDate && viewMode === 'slots') {
      fetchTimeSlots();
    }
  }, [selectedCourt, selectedDate, viewMode]);

  // Filter facilities based on search and filters
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
        facility.sports_supported.includes(selectedSport) ||
        facility.courts?.some(court => court.sport_type === selectedSport)
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(facility =>
        facility.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredFacilities(filtered);
  }, [facilities, searchTerm, selectedSport, selectedLocation]);

  const fetchTimeSlots = async () => {
    if (!selectedCourt) return;
    
    setSlotsLoading(true);
    try {
      // Always generate slots from court operating hours
      const generatedSlots = generateTimeSlotsFromCourtHours(selectedCourt, selectedDate);
      
      // Fetch existing bookings to mark booked slots
      const response = await fetch(
        `http://localhost:5000/api/bookings/court/${selectedCourt.id}?date=${selectedDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const existingBookings = data.bookings || [];
        
        // Mark slots as booked based on existing bookings
        const slotsWithBookingStatus = generatedSlots.map(slot => {
          const isBooked = existingBookings.some((booking: any) => 
            booking.start_time <= slot.start_time && booking.end_time > slot.start_time
          );
          return {
            ...slot,
            is_booked: isBooked,
            is_available: !isBooked
          };
        });
        
        setTimeSlots(slotsWithBookingStatus);
      } else {
        // If can't fetch bookings, use generated slots as-is
        setTimeSlots(generatedSlots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Always fallback to generated slots based on court hours
      const generatedSlots = generateTimeSlotsFromCourtHours(selectedCourt, selectedDate);
      setTimeSlots(generatedSlots);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Generate time slots based on court operating hours
  const generateTimeSlotsFromCourtHours = (court: Court, date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    // Parse operating hours (format: "HH:MM - HH:MM")
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      slots.push({
        court_id: court.id,
        date,
        start_time: startTime,
        end_time: endTime,
        price: court.pricing_per_hour,
        is_available: true,
        is_booked: false
      });
    }
    
    return slots;
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.is_available && !slot.is_booked) {
      setSelectedSlot(slot);
      setBookingDetails({
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        totalAmount: slot.price,
        totalHours: 1
      });
      setShowPaymentModal(true);
    }
  };

  const handleBookingConfirm = async (paymentDetails: any) => {
    if (!selectedCourt || !bookingDetails) return;

    try {
      const response = await fetch('http://localhost:5000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          court_id: selectedCourt.id,
          booking_date: bookingDetails.date,
          start_time: bookingDetails.startTime,
          end_time: bookingDetails.endTime,
          notes: `Booking for ${selectedCourt.name} - ${selectedFacility?.name}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Booking confirmed successfully!');
        setShowPaymentModal(false);
        setSelectedCourt(null);
        setBookingDetails(null);
        // Refresh slots to show updated booking status
        await fetchTimeSlots();
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
    }
  };

  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedCourt(null);
    setViewMode('courts');
  };

  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court);
    setViewMode('slots');
  };

  // Removed unused handler functions

  const uniqueSports = Array.from(new Set(
    facilities.flatMap(f => [...f.sports_supported, ...f.courts?.map(c => c.sport_type) || []])
  ));

  const uniqueLocations = Array.from(new Set(
    facilities.map(f => f.location.split(',')[0].trim())
  ));

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              {viewMode === 'venues' ? 'Select a Venue' : 'Book Your Slot'}
            </h1>
            <p className="text-gray-600">
              {viewMode === 'venues' 
                ? 'Choose from our premium sports facilities' 
                : `Select your preferred time slot at ${selectedFacility?.name}`
              }
            </p>
          </div>

          {/* Navigation Breadcrumb */}
          {(viewMode === 'courts' || viewMode === 'slots') && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('venues')}
                  className="text-ocean-teal hover:text-ocean-teal/80 transition-colors"
                >
                  Venues
                </button>
                <span className="text-gray-400">→</span>
                {viewMode === 'courts' ? (
                  <span className="text-deep-navy font-medium">Select Court</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewMode('courts')}
                      className="text-ocean-teal hover:text-ocean-teal/80 transition-colors"
                    >
                      {selectedFacility?.name}
                    </button>
                    <span className="text-gray-400">→</span>
                    <span className="text-deep-navy font-medium">Book Slot</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Venue Selection View */}
          {viewMode === 'venues' && (
            <>
              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search facilities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    />
                  </div>

                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    aria-label="Filter by sport"
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
                    aria-label="Filter by location"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSport('');
                      setSelectedLocation('');
                    }}
                    className="px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Venues Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading facilities...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={fetchFacilities}
                    className="bg-ocean-teal text-white px-6 py-2 rounded-lg hover:bg-ocean-teal/90"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredFacilities.map((facility) => (
                    <div key={facility.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                         onClick={() => handleSelectFacility(facility)}>
                      {/* Facility Images */}
                      <div className="relative h-48 bg-gray-200">
                        {facility.photos && facility.photos.length > 0 ? (
                          <img
                            src={facility.photos[0]}
                            alt={facility.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${facility.photos && facility.photos.length > 0 ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gray-100`}>
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-deep-navy">
                          {facility.active_courts} Court{facility.active_courts !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-deep-navy mb-2">
                          {facility.name}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          {facility.location}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                          {facility.description}
                        </p>

                        {/* Sports Supported */}
                        {facility.sports_supported && facility.sports_supported.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {facility.sports_supported.slice(0, 3).map((sport, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-sky-mist text-deep-navy text-xs rounded-full"
                                >
                                  {sport}
                                </span>
                              ))}
                              {facility.sports_supported.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{facility.sports_supported.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {facility.owner_name}
                          </div>
                          <div className="flex items-center text-ocean-teal">
                            <span className="text-sm font-medium">Select Venue</span>
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Court Selection View */}
          {viewMode === 'courts' && selectedFacility && (
            <div className="space-y-6">
              {/* Facility Header */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-deep-navy mb-2">
                      {selectedFacility.name}
                    </h2>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedFacility.location}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('venues')}
                    className="px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 inline" />
                    Back to Venues
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{selectedFacility.description}</p>
                
                {/* Amenities */}
                {selectedFacility.amenities && selectedFacility.amenities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-deep-navy mb-2">Amenities:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFacility.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-sky-mist text-deep-navy text-sm rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Courts Grid */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-deep-navy mb-6">
                  Choose a Court ({selectedFacility.courts?.filter(c => c.is_active).length || 0} available)
                </h3>
                
                {selectedFacility.courts && selectedFacility.courts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedFacility.courts
                      .filter(court => court.is_active)
                      .map((court) => (
                        <div
                          key={court.id}
                          onClick={() => handleSelectCourt(court)}
                          className="border border-gray-200 rounded-xl p-6 hover:border-ocean-teal hover:shadow-lg transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-semibold text-deep-navy">
                              {court.name}
                            </h4>
                            <span className="px-3 py-1 bg-lemon-zest text-deep-navy text-sm rounded-full font-medium">
                              ₹{court.pricing_per_hour}/hr
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Sport:</span>
                              <span className="text-sm font-medium text-deep-navy">{court.sport_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Surface:</span>
                              <span className="text-sm font-medium text-deep-navy">{court.surface_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Size:</span>
                              <span className="text-sm font-medium text-deep-navy">{court.court_size}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Hours:</span>
                              <span className="text-sm font-medium text-deep-navy flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {court.operating_hours_start} - {court.operating_hours_end}
                              </span>
                            </div>
                          </div>
                          
                          <button className="w-full bg-ocean-teal text-white py-2 rounded-lg hover:bg-ocean-teal/90 transition-colors">
                            Select This Court
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No courts available at this facility</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slot Selection View */}
          {viewMode === 'slots' && selectedFacility && selectedCourt && (
            <div className="space-y-6">
              {/* Selected Court Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-deep-navy mb-2">
                      {selectedCourt.name} - {selectedFacility.name}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{selectedCourt.sport_type}</span>
                      <span>•</span>
                      <span>{selectedCourt.surface_type}</span>
                      <span>•</span>
                      <span>{selectedCourt.court_size}</span>
                      <span>•</span>
                      <span className="font-medium text-deep-navy">₹{selectedCourt.pricing_per_hour}/hour</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('courts')}
                    className="px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
                  >
                    Change Court
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-deep-navy mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Select Date
                </h3>
                <div className="max-w-md">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time Slots */}
              {selectedCourt && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-deep-navy flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Choose Time Slot - {new Date(selectedDate).toLocaleDateString()}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={fetchTimeSlots}
                        disabled={slotsLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${slotsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {slotsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading available slots...</p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No slots available for this date</p>
                      <p className="text-sm text-gray-500">Try selecting a different date or court</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Morning Slots */}
                      {timeSlots.filter(slot => {
                        const hour = parseInt(slot.start_time.split(':')[0]);
                        return hour >= 6 && hour < 12;
                      }).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Morning (6 AM - 12 PM)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {timeSlots.filter(slot => {
                              const hour = parseInt(slot.start_time.split(':')[0]);
                              return hour >= 6 && hour < 12;
                            }).map((slot, index) => (
                              <button
                                key={`morning-${index}`}
                                type="button"
                                onClick={() => handleSlotSelect(slot)}
                                disabled={!slot.is_available || slot.is_booked}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                                  slot.is_booked
                                    ? 'bg-red-50 border-red-200 cursor-not-allowed'
                                    : slot.is_available
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                                    : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                <div className="font-medium text-sm text-deep-navy mb-1">
                                  {slot.start_time}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {slot.end_time}
                                </div>
                                <div className="text-sm font-semibold text-deep-navy mb-1">
                                  ₹{slot.price}
                                </div>
                                <div className={`text-xs font-medium ${
                                  slot.is_booked
                                    ? 'text-red-600'
                                    : slot.is_available
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                }`}>
                                  {slot.is_booked ? '🔒 Booked' : slot.is_available ? '✅ Available' : '❌ Unavailable'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Slots */}
                      {timeSlots.filter(slot => {
                        const hour = parseInt(slot.start_time.split(':')[0]);
                        return hour >= 12 && hour < 18;
                      }).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Afternoon (12 PM - 6 PM)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {timeSlots.filter(slot => {
                              const hour = parseInt(slot.start_time.split(':')[0]);
                              return hour >= 12 && hour < 18;
                            }).map((slot, index) => (
                              <button
                                key={`afternoon-${index}`}
                                type="button"
                                onClick={() => handleSlotSelect(slot)}
                                disabled={!slot.is_available || slot.is_booked}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                                  slot.is_booked
                                    ? 'bg-red-50 border-red-200 cursor-not-allowed'
                                    : slot.is_available
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                                    : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                <div className="font-medium text-sm text-deep-navy mb-1">
                                  {slot.start_time}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {slot.end_time}
                                </div>
                                <div className="text-sm font-semibold text-deep-navy mb-1">
                                  ₹{slot.price}
                                </div>
                                <div className={`text-xs font-medium ${
                                  slot.is_booked
                                    ? 'text-red-600'
                                    : slot.is_available
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                }`}>
                                  {slot.is_booked ? '🔒 Booked' : slot.is_available ? '✅ Available' : '❌ Unavailable'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evening Slots */}
                      {timeSlots.filter(slot => {
                        const hour = parseInt(slot.start_time.split(':')[0]);
                        return hour >= 18;
                      }).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Evening (6 PM onwards)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {timeSlots.filter(slot => {
                              const hour = parseInt(slot.start_time.split(':')[0]);
                              return hour >= 18;
                            }).map((slot, index) => (
                              <button
                                key={`evening-${index}`}
                                type="button"
                                onClick={() => handleSlotSelect(slot)}
                                disabled={!slot.is_available || slot.is_booked}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                                  slot.is_booked
                                    ? 'bg-red-50 border-red-200 cursor-not-allowed'
                                    : slot.is_available
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                                    : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                <div className="font-medium text-sm text-deep-navy mb-1">
                                  {slot.start_time}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {slot.end_time}
                                </div>
                                <div className="text-sm font-semibold text-deep-navy mb-1">
                                  ₹{slot.price}
                                </div>
                                <div className={`text-xs font-medium ${
                                  slot.is_booked
                                    ? 'text-red-600'
                                    : slot.is_available
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                }`}>
                                  {slot.is_booked ? '🔒 Booked' : slot.is_available ? '✅ Available' : '❌ Unavailable'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {timeSlots.length > 0 && (
                    <div className="mt-6 p-4 bg-sky-mist rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">
                            {timeSlots.filter(s => s.is_available && !s.is_booked).length} Available Slots
                          </span>
                          <span className="mx-2">•</span>
                          <span className="font-medium">
                            {timeSlots.filter(s => s.is_booked).length} Booked
                          </span>
                        </div>
                        <div className="text-deep-navy font-medium">
                          Court: {selectedCourt.name} ({selectedCourt.sport_type})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCourt && selectedFacility && bookingDetails && (
        <PaymentModal
          court={selectedCourt}
          facility={selectedFacility}
          bookingDate={bookingDetails.date}
          startTime={bookingDetails.startTime}
          endTime={bookingDetails.endTime}
          totalAmount={bookingDetails.totalAmount}
          totalHours={bookingDetails.totalHours}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCourt(null);
            setBookingDetails(null);
          }}
          onSuccess={() => handleBookingConfirm({})}
        />
      )}
    </div>
  );
};

export default EnhancedBookSlot;