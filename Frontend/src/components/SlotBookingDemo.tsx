import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getToken, getCurrentUser } from '../utils/auth';

interface SlotBookingDemoProps {
  courtId?: string;
  facilityName?: string;
  courtName?: string;
}

export const SlotBookingDemo: React.FC<SlotBookingDemoProps> = ({
  courtId = '1',
  facilityName = 'Demo Facility',
  courtName = 'Court A1'
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = getCurrentUser();

  const fetchSlots = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setLoading(!showRefreshing);
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

      const data = await response.json();
      console.log('Slots response:', data);

      if (response.ok) {
        setSlots(data.slots || []);
      } else {
        setError(data.error || 'Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const bookSlot = async (slot: any) => {
    if (!currentUser) {
      alert('Please log in to book a slot');
      return;
    }

    setBooking(true);
    setError('');
    
    try {
      const token = getToken();
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
          notes: 'Demo booking'
        })
      });

      const data = await response.json();
      console.log('Booking response:', data);

      if (response.ok) {
        alert(`✅ Slot booked successfully!\nTime: ${slot.start_time} - ${slot.end_time}\nAmount: ₹${slot.price}`);
        setSelectedSlots([]);
        fetchSlots(); // Refresh to show updated availability
      } else {
        if (data.code === 'SLOT_UNAVAILABLE' || data.code === 'SLOT_CONFLICT') {
          setError('This slot has been booked by another player. Refreshing slots...');
          fetchSlots();
        } else {
          setError(data.error || 'Booking failed');
        }
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      setError('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const bookMultipleSlots = async () => {
    if (selectedSlots.length === 0 || !currentUser) return;

    setBooking(true);
    setError('');
    
    let successCount = 0;
    let totalAmount = 0;

    for (const slotTime of selectedSlots) {
      const slot = slots.find(s => s.start_time === slotTime);
      if (!slot || !slot.is_available) continue;

      try {
        const token = getToken();
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
            notes: 'Multiple slot booking'
          })
        });

        if (response.ok) {
          successCount++;
          totalAmount += slot.price;
        }
      } catch (error) {
        console.error(`Error booking slot ${slotTime}:`, error);
      }
    }

    if (successCount > 0) {
      alert(`✅ ${successCount} slot(s) booked successfully!\nTotal amount: ₹${totalAmount}`);
      setSelectedSlots([]);
      fetchSlots();
    } else {
      setError('Failed to book any slots. Please try again.');
    }

    setBooking(false);
  };

  useEffect(() => {
    fetchSlots();
  }, [date, courtId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSlots();
    }, 30000);

    return () => clearInterval(interval);
  }, [date, courtId]);

  const getSlotColor = (slot: any) => {
    if (slot.is_own_booking) return 'bg-green-100 border-green-500 text-green-800';
    if (slot.is_booked) return 'bg-red-100 border-red-500 text-red-800';
    if (slot.is_blocked) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    if (selectedSlots.includes(slot.start_time)) return 'bg-blue-100 border-blue-500 text-blue-800';
    return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer';
  };

  const getSlotIcon = (slot: any) => {
    if (slot.is_own_booking) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (slot.is_booked) return <User className="h-4 w-4 text-red-600" />;
    if (slot.is_blocked) return <XCircle className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getSlotStatus = (slot: any) => {
    if (slot.is_own_booking) return 'Your Booking';
    if (slot.is_booked) return 'Booked';
    if (slot.is_blocked) return 'Maintenance';
    return 'Available';
  };

  const handleSlotClick = (slot: any) => {
    if (slot.is_booked || slot.is_blocked) return;
    
    if (selectedSlots.includes(slot.start_time)) {
      setSelectedSlots(prev => prev.filter(time => time !== slot.start_time));
    } else {
      setSelectedSlots(prev => [...prev, slot.start_time].sort());
    }
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Slot Booking Demo</h1>
            <p className="text-gray-600">{facilityName} - {courtName}</p>
          </div>
          <button
            onClick={() => fetchSlots(true)}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-600" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {currentUser ? (
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{currentUser.fullname}</span>
            </div>
          ) : (
            <div className="text-sm text-red-600">
              Please log in to book slots
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading slots...</span>
        </div>
      )}

      {/* Slots Grid */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Available Time Slots</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {slots.map((slot, index) => (
              <div
                key={index}
                onClick={() => handleSlotClick(slot)}
                className={`p-3 border-2 rounded-lg transition-all duration-200 ${getSlotColor(slot)}`}
                title={`${getSlotStatus(slot)} - ₹${slot.price}`}
              >
                <div className="flex items-center justify-between mb-2">
                  {getSlotIcon(slot)}
                  <span className="text-xs font-medium">₹{slot.price}</span>
                </div>
                <div className="text-sm font-medium">
                  {formatTime(slot.start_time)}
                </div>
                <div className="text-xs text-center mt-1">
                  {getSlotStatus(slot)}
                </div>
                {slot.user_name && (
                  <div className="text-xs text-center mt-1 truncate">
                    {slot.user_name}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Booking Actions */}
          {selectedSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Selected Slots ({selectedSlots.length})</h3>
                  <p className="text-sm text-blue-700">
                    Total: ₹{selectedSlots.reduce((total, slotTime) => {
                      const slot = slots.find(s => s.start_time === slotTime);
                      return total + (slot?.price || 0);
                    }, 0)}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedSlots([])}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={bookMultipleSlots}
                    disabled={booking || !currentUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {booking ? 'Booking...' : 'Book Selected'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded mr-2"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                <span>Your Booking</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
                <span>Booked by Others</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked).length}
              </div>
              <div className="text-sm text-green-700">Available</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {slots.filter(s => s.is_own_booking).length}
              </div>
              <div className="text-sm text-blue-700">Your Bookings</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {slots.filter(s => s.is_booked && !s.is_own_booking).length}
              </div>
              <div className="text-sm text-red-700">Booked by Others</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {slots.filter(s => s.is_blocked).length}
              </div>
              <div className="text-sm text-yellow-700">Maintenance</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked).slice(0, 3).map((slot, index) => (
            <button
              key={index}
              onClick={() => bookSlot(slot)}
              disabled={booking || !currentUser}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 text-left"
            >
              <div className="font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
              <div className="text-sm text-gray-600">₹{slot.price}</div>
              <div className="text-xs text-blue-600 mt-1">Click to book instantly</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};