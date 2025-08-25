import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getCurrentUser, getToken } from '../utils/auth';

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  facility_name: string;
  facility_location: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  duration: number;
}

const BookCourt: React.FC = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  const currentUser = getCurrentUser();

  const fetchCourtDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courts/${courtId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourt(data.court);
      } else {
        setError(data.error || 'Failed to fetch court details');
      }
    } catch (error) {
      setError('Network error');
    }
  }, [courtId]);

  const fetchAvailableSlots = useCallback(async () => {
    if (!courtId || !selectedDate) return;

    try {
      const response = await fetch(`http://localhost:5000/api/courts/${courtId}/slots?date=${selectedDate}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableSlots(data.available_slots);
      } else {
        setError(data.error || 'Failed to fetch available slots');
      }
    } catch (error) {
      setError('Network error');
    }
  }, [courtId, selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCourtDetails();
      await fetchAvailableSlots();
      setLoading(false);
    };

    loadData();
  }, [fetchCourtDetails, fetchAvailableSlots]);

  const handleSlotToggle = (slot: TimeSlot) => {
    setSelectedSlots(prev => {
      const isSelected = prev.some(s => s.start_time === slot.start_time);
      if (isSelected) {
        return prev.filter(s => s.start_time !== slot.start_time);
      } else {
        return [...prev, slot].sort((a, b) => a.start_time.localeCompare(b.start_time));
      }
    });
  };

  const calculateTotal = () => {
    if (!court || selectedSlots.length === 0) return 0;
    return selectedSlots.length * court.pricing_per_hour;
  };

  const handleBooking = async () => {
    if (!currentUser) {
      alert('Please log in to book a court');
      return;
    }

    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    setBookingLoading(true);
    try {
      const token = getToken();
      
      // Create booking for each selected slot
      const bookingPromises = selectedSlots.map(slot => 
        fetch('http://localhost:5000/api/bookings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            court_id: courtId,
            booking_date: selectedDate,
            start_time: slot.start_time,
            end_time: slot.end_time,
            notes
          })
        })
      );

      const responses = await Promise.all(bookingPromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        alert('Booking successful! You can view your bookings in the dashboard.');
        navigate('/player-dashboard');
      } else {
        alert('Some bookings failed. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-whisper">
        <Sidebar />
        <div className="ml-64 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p>Loading court details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen bg-ivory-whisper">
        <Sidebar />
        <div className="ml-64 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error || 'Court not found'}</p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFFFD] via-[#E6FD53]/5 to-[#FEFFFD]">
      <Sidebar />
      <div className="ml-64 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center text-[#204F56] hover:text-[#1B263F] mb-6 font-semibold transition-all duration-200 hover:scale-105"
            >
              <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-2">
                <ArrowLeft className="h-5 w-5" />
              </div>
              Back to Facilities
            </button>
            
            <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-8 border-2 border-[#E6FD53]/30">
              <div className="flex items-center mb-6">
                <div className="bg-[#E6FD53]/30 p-3 rounded-full mr-4">
                  <Calendar className="h-8 w-8 text-[#204F56]" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1B263F] to-[#204F56] bg-clip-text text-transparent">
                  Book Court
                </h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#1B263F] mb-4">{court.name}</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <Users className="h-4 w-4 text-[#204F56]" />
                      </div>
                      <span>{court.sport_type}</span>
                    </div>
                    <div className="flex items-center text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <MapPin className="h-4 w-4 text-[#204F56]" />
                      </div>
                      <span>{court.facility_name}, {court.facility_location}</span>
                    </div>
                    <div className="flex items-center text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-[#204F56]" />
                      </div>
                      <span>{court.operating_hours_start} - {court.operating_hours_end}</span>
                    </div>
                    <div className="flex items-center text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <DollarSign className="h-4 w-4 text-[#204F56]" />
                      </div>
                      <span className="bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] px-3 py-1 rounded-full font-bold">
                        ₹{court.pricing_per_hour}/hour
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-[#1B263F] mb-4">Select Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlots([]);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-[#E6FD53]/40 rounded-xl focus:ring-2 focus:ring-[#204F56] focus:border-[#204F56] bg-[#FEFFFD] text-[#1B263F] font-medium shadow-inner"
                    title="Select booking date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-8 mb-8 border-2 border-[#E6FD53]/30">
            <div className="flex items-center mb-6">
              <div className="bg-[#E6FD53]/30 p-2 rounded-full mr-3">
                <Clock className="h-6 w-6 text-[#204F56]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1B263F]">Available Time Slots</h3>
            </div>
            
            {availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-[#E6FD53]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-[#204F56]" />
                </div>
                <p className="text-[#1B263F]/70 font-medium text-lg">No available slots for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => handleSlotToggle(slot)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        isSelected
                          ? 'border-[#204F56] bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD]'
                          : 'border-[#E6FD53]/50 hover:border-[#204F56] hover:bg-[#E6FD53]/20 bg-[#FEFFFD] text-[#1B263F]'
                      }`}
                    >
                      <div className="text-sm font-bold">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'opacity-70'} font-semibold`}>
                        ₹{court.pricing_per_hour}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          {selectedSlots.length > 0 && (
            <div className="bg-gradient-to-br from-[#E6FD53]/20 to-[#E6FD53]/10 rounded-xl shadow-xl p-8 mb-8 border-2 border-[#E6FD53]/50">
              <div className="flex items-center mb-6">
                <div className="bg-[#E6FD53] p-2 rounded-full mr-3 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-[#1B263F]" />
                </div>
                <h3 className="text-2xl font-bold text-[#1B263F]">Booking Summary</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-[#E6FD53]/30">
                  <span className="text-[#1B263F] font-medium">Court:</span>
                  <span className="font-bold text-[#204F56]">{court.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#E6FD53]/30">
                  <span className="text-[#1B263F] font-medium">Date:</span>
                  <span className="font-bold text-[#204F56]">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#E6FD53]/30">
                  <span className="text-[#1B263F] font-medium">Time Slots:</span>
                  <span className="font-bold text-[#204F56] text-right">
                    {selectedSlots.map(slot => `${slot.start_time}-${slot.end_time}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#E6FD53]/30">
                  <span className="text-[#1B263F] font-medium">Duration:</span>
                  <span className="font-bold text-[#204F56]">{selectedSlots.length} hour(s)</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-[#204F56]/30">
                  <span className="text-xl font-bold text-[#1B263F]">Total Amount:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#204F56] to-[#1B263F] bg-clip-text text-transparent">
                    ₹{calculateTotal()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1B263F] mb-3">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[#E6FD53]/40 rounded-xl focus:ring-2 focus:ring-[#204F56] focus:border-[#204F56] resize-none bg-[#FEFFFD] text-[#1B263F] font-medium shadow-inner"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <button
                type="button"
                onClick={handleBooking}
                disabled={bookingLoading || selectedSlots.length === 0}
                className="w-full bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] py-4 px-8 rounded-xl font-bold hover:from-[#1B263F] hover:to-[#204F56] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl"
              >
                {bookingLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6 mr-3" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCourt;