import React, { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

interface SlotHighlightTestProps {
  courtId?: string;
  date?: string;
}

export const SlotHighlightTest: React.FC<SlotHighlightTestProps> = ({
  courtId = '1',
  date = new Date().toISOString().split('T')[0]
}) => {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/bookings/slots/${courtId}?date=${date}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
        console.log('Slot data for highlighting test:', data.slots);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [courtId, date]);

  const getSlotColor = (slot: any) => {
    if (slot.is_own_booking) {
      return "bg-green-100 border-green-500 text-green-800 font-semibold";
    } else if (slot.is_booked) {
      return "bg-red-200 border-red-500 text-red-900 font-semibold";
    } else if (slot.is_blocked) {
      return "bg-yellow-200 border-yellow-500 text-yellow-900 font-semibold";
    } else {
      return "bg-white border-green-300 text-green-700";
    }
  };

  const getStatusText = (slot: any) => {
    if (slot.is_own_booking) return "MY BOOKING";
    if (slot.is_booked) return "BOOKED BY OTHERS";
    if (slot.is_blocked) return "MAINTENANCE";
    return "AVAILABLE";
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Slot Highlighting Test</h2>
        <button
          onClick={fetchSlots}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <p>Court ID: {courtId} | Date: {date}</p>
        <p>This test shows how slots should be highlighted based on their booking status.</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-center">
        <div className="bg-green-50 p-3 rounded">
          <div className="text-2xl font-bold text-green-600">
            {slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked).length}
          </div>
          <div className="text-sm text-green-700">Available</div>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <div className="text-2xl font-bold text-red-600">
            {slots.filter(s => s.is_booked && !s.is_own_booking).length}
          </div>
          <div className="text-sm text-red-700">Booked by Others</div>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-2xl font-bold text-blue-600">
            {slots.filter(s => s.is_own_booking).length}
          </div>
          <div className="text-sm text-blue-700">My Bookings</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded">
          <div className="text-2xl font-bold text-yellow-600">
            {slots.filter(s => s.is_blocked).length}
          </div>
          <div className="text-sm text-yellow-700">Maintenance</div>
        </div>
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {slots.map((slot, index) => (
          <div
            key={index}
            className={`p-2 rounded border-2 text-center relative ${getSlotColor(slot)}`}
          >
            {/* Booked overlay */}
            {slot.is_booked && !slot.is_own_booking && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded flex items-center justify-center">
                <span className="text-red-800 font-bold text-xs transform rotate-12">BOOKED</span>
              </div>
            )}
            
            <div className="text-xs font-medium">
              {slot.start_time.slice(0, 5)}
            </div>
            <div className="text-xs mt-1">
              {getStatusText(slot)}
            </div>
            <div className="text-xs text-gray-600">
              ₹{slot.price}
            </div>
            {slot.user_name && (
              <div className="text-xs mt-1 truncate">
                {slot.user_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expected Results */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Expected Visual Results:</h3>
        <ul className="text-sm space-y-1">
          <li>🟢 <strong>Available slots:</strong> White background with green border</li>
          <li>🔴 <strong>Booked by others:</strong> Red background with "BOOKED" overlay - CANNOT CLICK</li>
          <li>🟢 <strong>Your bookings:</strong> Green background - shows "MY BOOKING"</li>
          <li>🟡 <strong>Maintenance:</strong> Yellow background - CANNOT CLICK</li>
        </ul>
      </div>
    </div>
  );
};