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
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center text-ocean-teal hover:text-ocean-teal/80 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Facilities
            </button>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-deep-navy mb-4">Book Court</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-deep-navy mb-2">{court.name}</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{court.sport_type}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{court.facility_name}, {court.facility_location}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{court.operating_hours_start} - {court.operating_hours_end}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>₹{court.pricing_per_hour}/hour</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-2">Select Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlots([]);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-deep-navy mb-4">Available Time Slots</h3>
            
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No available slots for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => handleSlotToggle(slot)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-ocean-teal bg-ocean-teal text-white'
                          : 'border-gray-300 hover:border-ocean-teal hover:bg-sky-mist'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div className="text-xs opacity-75">
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
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-deep-navy mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Court:</span>
                  <span className="font-medium">{court.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Slots:</span>
                  <span className="font-medium">
                    {selectedSlots.map(slot => `${slot.start_time}-${slot.end_time}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{selectedSlots.length} hour(s)</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total Amount:</span>
                  <span className="text-ocean-teal">₹{calculateTotal()}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent resize-none"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <button
                type="button"
                onClick={handleBooking}
                disabled={bookingLoading || selectedSlots.length === 0}
                className="w-full bg-ocean-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {bookingLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
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