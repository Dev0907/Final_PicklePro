import React, { useEffect, useState, useCallback } from 'react';
import { Clock, User, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { getToken } from '../utils/auth';
import { 
  showCustomSuccess, 
  showCustomError, 
  showConfirmAlert, 
  showLoadingAlert, 
  closeLoadingAlert 
} from '../utils/sweetAlert';

interface Slot {
  court_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  price: number;
  is_available: boolean;
  is_booked: boolean;
  is_blocked: boolean;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  booking_status?: string;
  maintenance_reason?: string;
  booking_id?: number;
}

interface OwnerSlotGridProps {
  courtId: string;
  date: string;
  onSlotUpdate?: () => void;
}

export const OwnerSlotGrid: React.FC<OwnerSlotGridProps> = ({ 
  courtId, 
  date, 
  onSlotUpdate 
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!courtId || !date) return;

    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/bookings/owner/slots/${courtId}?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // Refresh slots periodically for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (courtId && date) {
        fetchSlots();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [courtId, date, fetchSlots]);

  const getSlotColor = (slot: Slot) => {
    if (slot.is_booked) {
      // Green for booked slots (with player details)
      return 'bg-green-100 border-green-400 text-green-800';
    } else if (slot.is_blocked) {
      // Yellow for maintenance slots
      return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    } else if (slot.is_available) {
      // White for available slots
      return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer';
    } else {
      // Red for unavailable slots
      return 'bg-red-100 border-red-400 text-red-800';
    }
  };

  const getSlotIcon = (slot: Slot) => {
    if (slot.is_booked) {
      return <CheckCircle className="h-4 w-4 text-green-700" />;
    } else if (slot.is_blocked) {
      return <AlertTriangle className="h-4 w-4 text-yellow-700" />;
    } else if (slot.is_available) {
      return <Clock className="h-4 w-4 text-gray-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-700" />;
    }
  };

  const getSlotStatus = (slot: Slot) => {
    if (slot.is_booked) {
      return 'Booked';
    } else if (slot.is_blocked) {
      return 'Maintenance';
    } else if (slot.is_available) {
      return 'Available';
    } else {
      return 'Unavailable';
    }
  };

  const toggleSlotMaintenance = async (slot: Slot) => {
    if (slot.is_booked) {
      await showCustomError(
        'Cannot Modify Booked Slot',
        'This slot is currently booked by a player and cannot be modified. Please wait for the booking to complete or be cancelled.'
      );
      return;
    }

    // Show confirmation dialog
    const action = slot.is_available ? 'block' : 'make available';
    const confirmResult = await showConfirmAlert(
      `${slot.is_available ? 'Block' : 'Unblock'} Time Slot`,
      `Are you sure you want to ${action} the ${formatTime(slot.start_time)} slot?`,
      `Yes, ${slot.is_available ? 'Block' : 'Unblock'}`,
      'Cancel'
    );

    if (!confirmResult.isConfirmed) return;

    // Show loading alert
    showLoadingAlert(
      'Updating Slot...',
      `${slot.is_available ? 'Blocking' : 'Unblocking'} the ${formatTime(slot.start_time)} slot`
    );

    setUpdating(true);
    try {
      const token = getToken();
      
      const requestBody = {
        court_id: parseInt(courtId),
        date: date,
        unavailable_slots: slot.is_available ? [{
          start_time: slot.start_time,
          end_time: slot.end_time,
          reason: 'Owner marked for maintenance'
        }] : [],
        available_slots: !slot.is_available && slot.is_blocked ? [{
          start_time: slot.start_time,
          end_time: slot.end_time
        }] : []
      };

      const response = await fetch('http://localhost:5000/api/bookings/slots/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      closeLoadingAlert();

      if (response.ok) {
        const data = await response.json();
        
        // Show success message
        const successMessage = slot.is_available 
          ? `${formatTime(slot.start_time)} slot has been blocked for maintenance. Players can no longer book this slot.`
          : `${formatTime(slot.start_time)} slot is now available for booking. Players can book this slot immediately.`;
        
        await showCustomSuccess(
          slot.is_available ? 'Slot Blocked Successfully!' : 'Slot Made Available!',
          successMessage
        );

        fetchSlots();
        onSlotUpdate?.();
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to update slot availability';
        setError(errorMessage);
        
        await showCustomError(
          'Update Failed',
          errorMessage
        );
      }
    } catch (error) {
      closeLoadingAlert();
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      
      await showCustomError(
        'Network Error',
        errorMessage
      );
    } finally {
      setUpdating(false);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Slot Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {slots.map((slot) => (
          <div
            key={`${slot.start_time}-${slot.end_time}`}
            onClick={() => !updating && toggleSlotMaintenance(slot)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${getSlotColor(slot)} ${
              slot.is_booked ? '' : 'cursor-pointer hover:shadow-md'
            }`}
            title={slot.is_booked ? `Booked by ${slot.user_name}` : getSlotStatus(slot)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getSlotIcon(slot)}
                <span className="text-sm font-medium">
                  {formatTime(slot.start_time)}
                </span>
              </div>
            </div>

            {/* Player Details for Booked Slots */}
            {slot.is_booked && slot.user_name && (
              <div className="mt-2 text-xs">
                <div className="font-medium truncate" title={slot.user_name}>
                  {slot.user_name}
                </div>
                {slot.user_phone && (
                  <div className="text-xs opacity-75" title={slot.user_phone}>
                    📞 {slot.user_phone}
                  </div>
                )}
                <div className="text-xs font-medium mt-1 capitalize">
                  {slot.booking_status}
                </div>
                <div className="text-xs text-green-700 font-medium">
                  ₹{slot.price}
                </div>
              </div>
            )}

            {/* Maintenance Reason for Blocked Slots */}
            {slot.is_blocked && (
              <div className="mt-2 text-xs">
                <div className="font-medium">Maintenance</div>
                {slot.maintenance_reason && (
                  <div className="text-xs opacity-75 truncate" title={slot.maintenance_reason}>
                    {slot.maintenance_reason}
                  </div>
                )}
                <div className="text-xs text-yellow-700 mt-1">
                  Click to make available
                </div>
              </div>
            )}

            {/* Status for Available/Unavailable Slots */}
            {!slot.is_booked && !slot.is_blocked && (
              <div className="mt-2 text-xs">
                <div className="font-medium">{getSlotStatus(slot)}</div>
                <div className="text-xs text-gray-600">₹{slot.price}</div>
                {slot.is_available && (
                  <div className="text-xs text-gray-500 mt-1">
                    Click to mark maintenance
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Owner Dashboard Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded mr-2"></div>
            <span>Booked (with player details)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded mr-2"></div>
            <span>Under Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2"></div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-700">
              {slots.filter(slot => slot.is_available && !slot.is_booked && !slot.is_blocked).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {slots.filter(slot => slot.is_booked).length}
            </div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {slots.filter(slot => slot.is_blocked).length}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{slots.filter(slot => slot.is_booked).reduce((sum, slot) => sum + (slot.price || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
        </div>
      </div>

      {updating && (
        <div className="text-center text-blue-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Updating slot availability...</p>
        </div>
      )}
    </div>
  );
};