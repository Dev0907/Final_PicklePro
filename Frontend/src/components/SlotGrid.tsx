import React, { useEffect, useState, useCallback } from 'react';
import { Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface Slot {
  time: string;
  hour: number;
  available: boolean;
  booking_id: string | null;
  user_name: string | null;
  status: string | null;
}

interface SlotGridProps {
  courtId: string;
  date: string;
}

export const SlotGrid: React.FC<SlotGridProps> = ({ courtId, date }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSlots = useCallback(async () => {
    if (!courtId || !date) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/court/${courtId}/slots?date=${date}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch slots');
        return;
      }

      const data = await response.json();
      setSlots(data.slots || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courtId, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const getSlotColor = (slot: Slot) => {
    if (slot.available) {
      return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
    } else if (slot.status === 'completed') {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else if (slot.status === 'cancelled') {
      return 'bg-gray-100 border-gray-300 text-gray-600';
    } else {
      return 'bg-red-100 border-red-300 text-red-800';
    }
  };

  const getSlotIcon = (slot: Slot) => {
    if (slot.available) {
      return <Clock className="h-4 w-4" />;
    } else if (slot.status === 'completed') {
      return <CheckCircle className="h-4 w-4" />;
    } else if (slot.status === 'cancelled') {
      return <XCircle className="h-4 w-4" />;
    } else {
      return <User className="h-4 w-4" />;
    }
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchSlots}
          className="mt-2 px-4 py-2 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Period Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Morning Slots */}
        <div>
          <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-500" />
            Morning (6 AM - 12 PM)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {slots.filter(slot => slot.hour >= 6 && slot.hour < 12).map((slot) => (
              <div
                key={slot.time}
                className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getSlotColor(slot)}`}
                title={slot.available ? 'Available' : `Booked by ${slot.user_name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSlotIcon(slot)}
                    <span className="text-sm font-medium">
                      {formatTime(slot.time)}
                    </span>
                  </div>
                </div>
                {!slot.available && slot.user_name && (
                  <div className="mt-1 text-xs opacity-75">
                    {slot.user_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Afternoon Slots */}
        <div>
          <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Afternoon (12 PM - 6 PM)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {slots.filter(slot => slot.hour >= 12 && slot.hour < 18).map((slot) => (
              <div
                key={slot.time}
                className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getSlotColor(slot)}`}
                title={slot.available ? 'Available' : `Booked by ${slot.user_name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSlotIcon(slot)}
                    <span className="text-sm font-medium">
                      {formatTime(slot.time)}
                    </span>
                  </div>
                </div>
                {!slot.available && slot.user_name && (
                  <div className="mt-1 text-xs opacity-75">
                    {slot.user_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evening Slots */}
        <div>
          <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-500" />
            Evening (6 PM - 11 PM)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {slots.filter(slot => slot.hour >= 18 && slot.hour <= 22).map((slot) => (
              <div
                key={slot.time}
                className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getSlotColor(slot)}`}
                title={slot.available ? 'Available' : `Booked by ${slot.user_name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSlotIcon(slot)}
                    <span className="text-sm font-medium">
                      {formatTime(slot.time)}
                    </span>
                  </div>
                </div>
                {!slot.available && slot.user_name && (
                  <div className="mt-1 text-xs opacity-75">
                    {slot.user_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {slots.filter(slot => slot.available).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {slots.filter(slot => !slot.available && slot.status === 'booked').length}
            </div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {slots.filter(slot => slot.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {slots.filter(slot => slot.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
      </div>
    </div>
  );
};