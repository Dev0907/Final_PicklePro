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

  const fetchExistingBookings = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/slots/${court.id}?date=${formData.booking_date}`);
      if (response.ok) {
        const data = await response.json();
        // Update to handle the new slot format that includes booking status
        const bookedSlots = data.slots?.filter((slot: any) => slot.is_booked || !slot.is_available) || [];
        setExistingBookings(bookedSlots);
      }
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    }
  };

  const isTimeSlotBooked = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return existingBookings.some(slot => {
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
    });
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

    // Check if selected slots are consecutive
    const sortedSlots = [...selectedSlots].sort();
    for (let i = 1; i < sortedSlots.length; i++) {
      const currentHour = parseInt(sortedSlots[i].split(':')[0]);
      const previousHour = parseInt(sortedSlots[i - 1].split(':')[0]);
      if (currentHour !== previousHour + 1) {
        setError('Please select consecutive time slots');
        return false;
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
      
      if (!response.ok) {
        setError(data.error || 'Booking failed');
        setLoading(false);
        return;
      }

      alert(`Booking confirmed! Total amount: ₹${totalAmount}`);
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
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#1B263F]">Book Court Slot</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close booking form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Court & Facility Info */}
        <div className="p-6 bg-[#E6FD53]/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1B263F] mb-2">{court.name}</h3>
              <p className="text-sm text-[#1B263F]">
                <strong>Sport:</strong> {court.sport_type}
              </p>
              <p className="text-sm text-[#1B263F]">
                <strong>Rate:</strong> ₹{court.pricing_per_hour}/hour
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#1B263F] mb-1">{facility.name}</h4>
              <div className="flex items-center text-sm text-[#1B263F]">
                <MapPin className="h-4 w-4 mr-1" />
                {facility.location}
              </div>
              <p className="text-sm text-[#1B263F] mt-1">
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
            <label className="flex items-center text-sm font-medium text-[#1B263F] mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              Booking Date *
            </label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204F56] focus:border-transparent"
              required
            />
          </div>

          {/* Interactive Slot Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-[#1B263F] mb-4">
              <Clock className="h-4 w-4 mr-2" />
              Select Time Slots * (Click to select/deselect)
            </label>
            
            {timeSlots.length > 0 ? (
              <div className="space-y-6">
                {/* Morning slots */}
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 6 && hour < 12;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Morning (6 AM - 12 PM)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 6 && hour < 12;
                      }).map((time) => {
                        const isBooked = isTimeSlotBooked(time);
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
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Afternoon (12 PM - 6 PM)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 12 && hour < 18;
                      }).map((time) => {
                        const isBooked = isTimeSlotBooked(time);
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
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Evening (6 PM onwards)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {timeSlots.filter(time => {
                        const hour = parseInt(time.split(':')[0]);
                        return hour >= 18;
                      }).map((time) => {
                        const isBooked = isTimeSlotBooked(time);
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
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 text-xs bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center">
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
            <label className="block text-sm font-medium text-[#1B263F] mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204F56] focus:border-transparent"
              placeholder="Any special requirements or notes..."
            />
          </div>

          {/* Booking Summary */}
          {totalHours > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-[#1B263F] mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Booking Summary
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{totalHours} hour{totalHours !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate per hour:</span>
                  <span>₹{court.pricing_per_hour}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1B263F] border-t border-gray-200 pt-2">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || totalHours === 0}
              className="flex-1 bg-[#204F56] text-[#FEFFFD] px-6 py-3 rounded-lg font-semibold hover:bg-[#1B263F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : `Book Slot - ₹${totalAmount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};