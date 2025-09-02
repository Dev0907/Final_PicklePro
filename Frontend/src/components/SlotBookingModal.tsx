import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { getToken } from '../utils/auth';

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  description?: string;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  owner_name: string;
}

interface SlotBookingModalProps {
  court: Court;
  facility: Facility;
  onClose: () => void;
  onSuccess: () => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  court,
  facility,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Generate time slots based on court operating hours
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    if (!court) return slots;
    
    const startHour = parseInt(court.operating_hours_start.split(':')[0]);
    const endHour = parseInt(court.operating_hours_end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, booking_date: today }));
  }, []);

  // Fetch existing bookings for the selected date
  useEffect(() => {
    if (formData.booking_date) {
      fetchExistingBookings();
    }
  }, [formData.booking_date]);

  // Refresh bookings periodically for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.booking_date) {
        fetchExistingBookings();
      }
    }, 15000); // Refresh every 15 seconds for better real-time updates

    return () => clearInterval(interval);
  }, [formData.booking_date]);

  // Calculate total amount when selected slots change
  useEffect(() => {
    const hours = selectedSlots.length;
    setTotalHours(hours);
    setTotalAmount(hours * court.pricing_per_hour);
    
    // Update form data based on selected slots
    if (selectedSlots.length > 0) {
      const sortedSlots = [...selectedSlots].sort();
      setFormData(prev => ({
        ...prev,
        start_time: sortedSlots[0],
        end_time: `${parseInt(sortedSlots[sortedSlots.length - 1].split(':')[0]) + 1}:00`
      }));
    }
  }, [selectedSlots, court.pricing_per_hour]);

  const fetchExistingBookings = async (showRefreshing = false) => {
    try {
<<<<<<< HEAD
      if (showRefreshing) setRefreshing(true);
      
      const token = getToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:5000/api/bookings/slots/${court.id}?date=${formData.booking_date}`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched slots:', data.slots?.length || 0);
        // Store all slots with their status
        setExistingBookings(data.slots || []);
      } else {
        console.error('Failed to fetch slots:', response.status);
        setExistingBookings([]);
=======
      const response = await fetch(`http://localhost:5000/api/bookings/slots/${court.id}?date=${formData.booking_date}`);
      if (response.ok) {
        const data = await response.json();
        // Update to handle the new slot format that includes booking status
        const bookedSlots = data.slots?.filter((slot: any) => slot.is_booked || !slot.is_available) || [];
        setExistingBookings(bookedSlots);
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      }
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
      setExistingBookings([]);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  const isTimeSlotBooked = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return existingBookings.some(slot => {
<<<<<<< HEAD
      // Handle new slot format with booking status
      if (slot.start_time && slot.end_time) {
        const slotStart = parseInt(slot.start_time.split(':')[0]);
        const slotEnd = parseInt(slot.end_time.split(':')[0]);
        return hour >= slotStart && hour < slotEnd && (slot.is_booked || slot.is_blocked || !slot.is_available);
      }
      return false;
=======
      // Handle both old booking format and new slot format
      if (slot.start_time && slot.end_time) {
        const slotStart = parseInt(slot.start_time.split(':')[0]);
        const slotEnd = parseInt(slot.end_time.split(':')[0]);
        return hour >= slotStart && hour < slotEnd && (slot.is_booked || !slot.is_available);
      }
      // Fallback for old booking format
      if (slot.booking_date !== formData.booking_date || slot.status === 'cancelled') {
        return false;
      }
      const bookingStart = parseInt(slot.start_time.split(':')[0]);
      const bookingEnd = parseInt(slot.end_time.split(':')[0]);
      return hour >= bookingStart && hour < bookingEnd;
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
    });
  };

  const getSlotStatus = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const slot = existingBookings.find(slot => {
      if (slot.start_time && slot.end_time) {
        const slotStart = parseInt(slot.start_time.split(':')[0]);
        const slotEnd = parseInt(slot.end_time.split(':')[0]);
        return hour >= slotStart && hour < slotEnd;
      }
      return false;
    });

    if (!slot) return { available: true, reason: '', isOwnBooking: false };
    
    if (slot.is_booked) {
      if (slot.is_own_booking) {
        return { available: false, reason: 'Your booking', isOwnBooking: true };
      } else {
        return { available: false, reason: 'Booked by another player', isOwnBooking: false };
      }
    }
    if (slot.is_blocked) return { available: false, reason: 'Under maintenance', isOwnBooking: false };
    if (!slot.is_available) return { available: false, reason: 'Unavailable', isOwnBooking: false };
    
    return { available: true, reason: '', isOwnBooking: false };
  };

  const getSlotStyling = (time: string) => {
    const slotStatus = getSlotStatus(time);
    const isBooked = !slotStatus.available;
    const isOwnBooking = slotStatus.isOwnBooking;
    
    if (isBooked) {
      if (isOwnBooking) {
        return 'bg-green-100 border-green-500 text-green-800 cursor-not-allowed opacity-90 font-semibold shadow-sm';
      } else {
        return 'bg-red-100 border-red-500 text-red-800 cursor-not-allowed opacity-90 font-semibold shadow-sm';
      }
    } else if (selectedSlots.includes(time)) {
      return 'bg-[#1B3F2E] border-[#1B3F2E] text-white shadow-md';
    } else {
      return 'bg-[#EFFF4F]/30 border-[#EFFF4F] text-[#1E1F26] hover:bg-[#F5FF9F]/50 hover:border-[#1B3F2E]/30';
    }
  };

  const validateForm = () => {
    if (!formData.booking_date) {
      setError('Please select a booking date');
      return false;
    }

    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot');
      return false;
    }

    // Check if selected slots are consecutive (if multiple slots selected)
    if (selectedSlots.length > 1) {
      const sortedSlots = [...selectedSlots].sort();
      for (let i = 1; i < sortedSlots.length; i++) {
        const currentHour = parseInt(sortedSlots[i].split(':')[0]);
        const previousHour = parseInt(sortedSlots[i - 1].split(':')[0]);
        if (currentHour !== previousHour + 1) {
          setError('Please select consecutive time slots');
          return false;
        }
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to book a slot');
        setLoading(false);
        return;
      }

      console.log('Creating booking with data:', {
        court_id: court.id,
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes
      });

      const response = await fetch('http://localhost:5000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: court.id,
          booking_date: formData.booking_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          notes: formData.notes
        })
      });

      const data = await response.json();
      console.log('Booking response:', data);
      
      if (!response.ok) {
        console.error('Booking failed:', data);
        if (data.code === 'SLOT_UNAVAILABLE' || data.code === 'SLOT_CONFLICT') {
          setError('This slot has been booked by another player. Please refresh and select a different slot.');
          // Refresh slots to show updated availability
          fetchExistingBookings();
        } else {
          setError(data.error || 'Booking failed');
        }
        setLoading(false);
        return;
      }

      alert(`Booking confirmed! Total amount: ₹${totalAmount}`);
      // Refresh slots to show the new booking
      fetchExistingBookings();
      onSuccess();
    } catch (error) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
<<<<<<< HEAD
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-[#FFFFF7]">
          <h2 className="text-2xl font-bold text-[#1E1F26]">Book Court Slot</h2>
=======
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#1B263F]">Book Court Slot</h2>
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1F26] transition-colors"
            aria-label="Close booking form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Court & Facility Info */}
<<<<<<< HEAD
        <div className="p-6 bg-[#F0F7B1]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1E1F26] mb-2">{court.name}</h3>
              <p className="text-sm text-[#1E1F26]">
                <strong>Sport:</strong> {court.sport_type}
              </p>
              <p className="text-sm text-[#1E1F26]">
=======
        <div className="p-6 bg-[#E6FD53]/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1B263F] mb-2">{court.name}</h3>
              <p className="text-sm text-[#1B263F]">
                <strong>Sport:</strong> {court.sport_type}
              </p>
              <p className="text-sm text-[#1B263F]">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                <strong>Rate:</strong> ₹{court.pricing_per_hour}/hour
              </p>
            </div>
            <div>
<<<<<<< HEAD
              <h4 className="font-semibold text-[#1E1F26] mb-1">{facility.name}</h4>
              <div className="flex items-center text-sm text-[#1E1F26]">
                <MapPin className="h-4 w-4 mr-1 text-[#1B3F2E]" />
                {facility.location}
              </div>
              <p className="text-sm text-[#1E1F26] mt-1">
=======
              <h4 className="font-semibold text-[#1B263F] mb-1">{facility.name}</h4>
              <div className="flex items-center text-sm text-[#1B263F]">
                <MapPin className="h-4 w-4 mr-1" />
                {facility.location}
              </div>
              <p className="text-sm text-[#1B263F] mt-1">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                <strong>Managed by:</strong> {facility.owner_name}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Date Selection */}
          <div>
<<<<<<< HEAD
            <label className="flex items-center text-sm font-medium text-[#1E1F26] mb-2">
              <Calendar className="h-4 w-4 mr-2 text-[#1B3F2E]" />
=======
            <label className="flex items-center text-sm font-medium text-[#1B263F] mb-2">
              <Calendar className="h-4 w-4 mr-2" />
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
              Booking Date *
            </label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
<<<<<<< HEAD
              className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E]"
=======
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204F56] focus:border-transparent"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
              required
            />
          </div>

          {/* Interactive Slot Selection */}
          <div>
<<<<<<< HEAD
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center text-sm font-medium text-[#1E1F26]">
                <Clock className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                Select Time Slots * (Click to select/deselect)
              </label>
              <div className="flex items-center space-x-2">
                {refreshing && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                    Updating...
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fetchExistingBookings(true)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                >
                  Refresh
                </button>
              </div>
            </div>
=======
            <label className="flex items-center text-sm font-medium text-[#1B263F] mb-4">
              <Clock className="h-4 w-4 mr-2" />
              Select Time Slots * (Click to select/deselect)
            </label>
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
            
            {timeSlots.length > 0 ? (
              <div className="space-y-6">
                {/* Morning slots */}
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 6 && hour < 12;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#1E1F26] mb-3">Morning (6 AM - 12 PM)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 6 && hour < 12;
                      }).map((time) => {
                        const slotStatus = getSlotStatus(time);
                        const isBooked = !slotStatus.available;
                        const isOwnBooking = slotStatus.isOwnBooking;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!isBooked) {
                                setSelectedSlots(prev => 
                                  prev.includes(time) 
                                    ? prev.filter(t => t !== time)
                                    : [...prev, time].sort()
                                );
                              }
                            }}
                            disabled={isBooked}
<<<<<<< HEAD
                            title={isBooked ? slotStatus.reason : 'Available for booking'}
                            className={`p-2 text-xs rounded-lg border-2 transition-all duration-200 ${getSlotStyling(time)}`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1 font-medium">{isOwnBooking ? 'Your Booking' : 'Booked'}</div>}
=======
                            className={`p-2 text-xs rounded-lg border-2 transition-all duration-200 ${
                              isBooked
                                ? 'bg-red-100 border-red-300 text-red-600 cursor-not-allowed'
                                : selectedSlots.includes(time)
                                ? 'bg-[#204F56] border-[#204F56] text-[#FEFFFD]'
                                : 'bg-[#E6FD53]/20 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/30'
                            }`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1">Unavailable</div>}
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 12 && hour < 18;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#1E1F26] mb-3">Afternoon (12 PM - 6 PM)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 12 && hour < 18;
                      }).map((time) => {
                        const slotStatus = getSlotStatus(time);
                        const isBooked = !slotStatus.available;
                        const isOwnBooking = slotStatus.isOwnBooking;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!isBooked) {
                                setSelectedSlots(prev => 
                                  prev.includes(time) 
                                    ? prev.filter(t => t !== time)
                                    : [...prev, time].sort()
                                );
                              }
                            }}
                            disabled={isBooked}
                            title={isBooked ? slotStatus.reason : 'Available for booking'}
                            className={`p-2 text-xs rounded-lg border-2 transition-all duration-200 ${
                              isBooked
                                ? 'bg-red-100 border-red-500 text-red-800 cursor-not-allowed opacity-90 font-semibold shadow-sm'
                                : selectedSlots.includes(time)
<<<<<<< HEAD
                                ? 'bg-[#204F56] border-[#204F56] text-[#FEFFFD] shadow-md'
                                : 'bg-[#E6FD53]/30 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/50 hover:border-[#204F56]/30'
                            }`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1 font-medium">Booked</div>}
=======
                                ? 'bg-[#204F56] border-[#204F56] text-[#FEFFFD]'
                                : 'bg-[#E6FD53]/20 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/30'
                            }`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1">Unavailable</div>}
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 18;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#1E1F26] mb-3">Evening (6 PM onwards)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 18;
                      }).map((time) => {
                        const slotStatus = getSlotStatus(time);
                        const isBooked = !slotStatus.available;
                        const isOwnBooking = slotStatus.isOwnBooking;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!isBooked) {
                                setSelectedSlots(prev => 
                                  prev.includes(time) 
                                    ? prev.filter(t => t !== time)
                                    : [...prev, time].sort()
                                );
                              }
                            }}
                            disabled={isBooked}
                            title={isBooked ? slotStatus.reason : 'Available for booking'}
                            className={`p-2 text-xs rounded-lg border-2 transition-all duration-200 ${
                              isBooked
                                ? 'bg-red-100 border-red-500 text-red-800 cursor-not-allowed opacity-90 font-semibold shadow-sm'
                                : selectedSlots.includes(time)
<<<<<<< HEAD
                                ? 'bg-[#204F56] border-[#204F56] text-[#FEFFFD] shadow-md'
                                : 'bg-[#E6FD53]/30 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/50 hover:border-[#204F56]/30'
                            }`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1 font-medium">Booked</div>}
=======
                                ? 'bg-[#204F56] border-[#204F56] text-[#FEFFFD]'
                                : 'bg-[#E6FD53]/20 border-[#E6FD53] text-[#1B263F] hover:bg-[#E6FD53]/30'
                            }`}
                          >
                            {time.slice(0, 5)}
                            {isBooked && <div className="text-xs mt-1">Unavailable</div>}
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center space-x-3 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center">
<<<<<<< HEAD
                    <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
                    <span className="text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-[#1B3F2E] border-2 border-[#1B3F2E] rounded mr-2"></div>
                    <span className="text-gray-700">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                    <span className="text-gray-700">Your Booking</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
                    <span className="text-gray-700">Booked by Others</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded mr-2"></div>
                    <span className="text-gray-700">Maintenance</span>
=======
                    <div className="w-4 h-4 bg-[#E6FD53]/20 border border-[#E6FD53] rounded mr-2"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-[#204F56] rounded mr-2"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
                    <span>Unavailable</span>
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Loading available slots...</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-[#1E1F26] mb-2">
=======
            <label className="block text-sm font-medium text-[#1B263F] mb-2">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
<<<<<<< HEAD
              className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E]"
=======
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204F56] focus:border-transparent"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
              placeholder="Any special requirements or notes..."
            />
          </div>

          {/* Booking Summary */}
          {totalHours > 0 && (
<<<<<<< HEAD
            <div className="bg-[#F0F7B1]/30 border border-[#F0F7B1] rounded-lg p-4">
              <h4 className="font-semibold text-[#1E1F26] mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-[#1B3F2E]" />
=======
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-[#1B263F] mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                Booking Summary
              </h4>
              <div className="space-y-1 text-sm text-[#1E1F26]">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{totalHours} hour{totalHours !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate per hour:</span>
                  <span className="font-medium">₹{court.pricing_per_hour}</span>
                </div>
<<<<<<< HEAD
                <div className="flex justify-between font-bold text-[#1E1F26] border-t border-[#F0F7B1] pt-2 text-base">
=======
                <div className="flex justify-between font-semibold text-[#1B263F] border-t border-gray-200 pt-2">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                  <span>Total Amount:</span>
                  <span className="text-[#1B3F2E]">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[#C4C4C4] text-[#1E1F26] bg-white rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || totalHours === 0}
<<<<<<< HEAD
              className="flex-1 bg-[#EFFF4F] text-[#1E1F26] px-6 py-3 rounded-lg font-semibold hover:bg-[#F5FF9F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
=======
              className="flex-1 bg-[#204F56] text-[#FEFFFD] px-6 py-3 rounded-lg font-semibold hover:bg-[#1B263F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
            >
              {loading ? 'Booking...' : `Book Slot - ₹${totalAmount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};