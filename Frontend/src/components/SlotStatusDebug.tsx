import React, { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

interface SlotStatusDebugProps {
  courtId: string;
  date: string;
}

export const SlotStatusDebug: React.FC<SlotStatusDebugProps> = ({ courtId, date }) => {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);

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

      const data = await response.json();
      console.log('Raw API Response:', data);
      setRawData(data);
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courtId && date) {
      fetchSlots();
    }
  }, [courtId, date]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Slot Status Debug</h2>
        <button
          onClick={fetchSlots}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4">
        <p><strong>Court ID:</strong> {courtId}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Total Slots:</strong> {slots.length}</p>
      </div>

      {/* Slot Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-green-600">
            {slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked).length}
          </div>
          <div className="text-sm text-green-700">Available</div>
        </div>
        <div className="bg-red-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-red-600">
            {slots.filter(s => s.is_booked).length}
          </div>
          <div className="text-sm text-red-700">Booked</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {slots.filter(s => s.is_blocked).length}
          </div>
          <div className="text-sm text-yellow-700">Blocked</div>
        </div>
        <div className="bg-blue-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-blue-600">
            {slots.filter(s => s.is_own_booking).length}
          </div>
          <div className="text-sm text-blue-700">My Bookings</div>
        </div>
      </div>

      {/* Detailed Slot List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Detailed Slot Status:</h3>
        {slots.map((slot, index) => (
          <div
            key={index}
            className={`p-3 rounded border-l-4 ${
              slot.is_own_booking
                ? 'border-blue-500 bg-blue-50'
                : slot.is_booked
                ? 'border-red-500 bg-red-50'
                : slot.is_blocked
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {slot.start_time} - {slot.end_time}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  ₹{slot.price}
                </span>
              </div>
              <div className="text-right text-sm">
                <div className={`font-medium ${
                  slot.is_own_booking
                    ? 'text-blue-700'
                    : slot.is_booked
                    ? 'text-red-700'
                    : slot.is_blocked
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}>
                  {slot.is_own_booking
                    ? 'My Booking'
                    : slot.is_booked
                    ? 'Booked by Others'
                    : slot.is_blocked
                    ? 'Maintenance'
                    : 'Available'}
                </div>
                <div className="text-xs text-gray-500">
                  Available: {slot.is_available ? 'Yes' : 'No'} |
                  Booked: {slot.is_booked ? 'Yes' : 'No'} |
                  Blocked: {slot.is_blocked ? 'Yes' : 'No'}
                </div>
                {slot.user_name && (
                  <div className="text-xs text-gray-600">
                    Booked by: {slot.user_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw Data Display */}
      <details className="mt-6">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          Show Raw API Response
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </details>
    </div>
  );
};