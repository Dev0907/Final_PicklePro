import React, { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

interface SlotBookingTestProps {
  courtId: string;
  date: string;
}

export const SlotBookingTest: React.FC<SlotBookingTestProps> = ({ courtId, date }) => {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching slots for court ${courtId} on ${date}`);
      const response = await fetch(`http://localhost:5000/api/bookings/slots/${courtId}?date=${date}`, {
        headers
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSlots(data.slots || []);
      } else {
        setError(data.error || 'Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (slot: any) => {
    setBooking(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to book a slot');
        return;
      }

      console.log('Booking slot:', slot);
      const response = await fetch('http://localhost:5000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: courtId,
          booking_date: date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          notes: 'Test booking'
        })
      });

      const data = await response.json();
      console.log('Booking response:', data);

      if (response.ok) {
        alert(`Slot booked successfully! Amount: ₹${slot.price}`);
        fetchSlots(); // Refresh slots
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      setError('Network error');
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    if (courtId && date) {
      fetchSlots();
    }
  }, [courtId, date]);

  const getSlotColor = (slot: any) => {
    if (slot.is_own_booking) return 'bg-green-100 border-green-500 text-green-800';
    if (slot.is_booked) return 'bg-red-100 border-red-500 text-red-800';
    if (slot.is_blocked) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
  };

  const getSlotStatus = (slot: any) => {
    if (slot.is_own_booking) return 'Your Booking';
    if (slot.is_booked) return 'Booked by Others';
    if (slot.is_blocked) return 'Maintenance';
    return 'Available';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Slot Booking Test</h2>
      <p className="mb-4">Court ID: {courtId}, Date: {date}</p>
      
      <button 
        onClick={fetchSlots} 
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Refresh Slots'}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot, index) => (
          <div
            key={index}
            className={`p-3 border-2 rounded-lg ${getSlotColor(slot)}`}
          >
            <div className="text-sm font-medium">
              {slot.start_time} - {slot.end_time}
            </div>
            <div className="text-xs">{getSlotStatus(slot)}</div>
            <div className="text-xs">₹{slot.price}</div>
            {slot.is_available && !slot.is_booked && !slot.is_blocked && (
              <button
                onClick={() => bookSlot(slot)}
                disabled={booking}
                className="mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {booking ? 'Booking...' : 'Book'}
              </button>
            )}
            {slot.user_name && (
              <div className="text-xs mt-1 text-gray-600">
                Booked by: {slot.user_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {slots.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No slots available for this date
        </div>
      )}
    </div>
  );
};