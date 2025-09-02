import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, RefreshCw, AlertCircle, CheckCircle, XCircle, Settings, AlertTriangle, User } from 'lucide-react';
import { getToken, getCurrentUser } from '../utils/auth';

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
  booking_id?: number;
  booking_status?: string;
  maintenance_reason?: string;
}

interface OwnerSlotManagerProps {
  courtId: string;
  courtName?: string;
  facilityName?: string;
}

export const OwnerSlotManager: React.FC<OwnerSlotManagerProps> = ({
  courtId,
  courtName = 'Court',
  facilityName = 'Facility'
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modifiedSlots, setModifiedSlots] = useState<Set<string>>(new Set());
  const [maintenanceReason, setMaintenanceReason] = useState('');

  const currentUser = getCurrentUser();

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/bookings/owner/slots/${courtId}?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
        setModifiedSlots(new Set()); // Reset modifications
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courtId && date) {
      fetchSlots();
    }
  }, [courtId, date]);

  const getSlotColor = (slot: Slot) => {
    if (slot.is_booked) {
      // Red for booked slots - cannot be modified
      return "bg-red-100 border-red-400 text-red-800 cursor-not-allowed opacity-75";
    } else if (slot.is_blocked) {
      // Muted Grey for maintenance/blocked slots
      return "bg-[#C4C4C4] border-[#C4C4C4] text-[#1E1F26] cursor-pointer hover:bg-[#F0F7B1] hover:border-[#EFFF4F]";
    } else if (slot.is_available) {
      // Light Olive for available slots
      return "bg-[#F0F7B1] border-[#F0F7B1] text-[#1E1F26] cursor-pointer hover:bg-[#F5FF9F] hover:border-[#EFFF4F]";
    } else {
      // Default for unavailable slots
      return "bg-gray-100 border-gray-300 text-gray-500 cursor-pointer hover:bg-[#F0F7B1] hover:border-[#EFFF4F]";
    }
  };

  const getSlotIcon = (slot: Slot) => {
    if (slot.is_booked) {
      return <User className="h-4 w-4 text-red-700" />;
    } else if (slot.is_blocked) {
      return <AlertTriangle className="h-4 w-4 text-[#1E1F26]" />;
    } else if (slot.is_available) {
      return <CheckCircle className="h-4 w-4 text-[#1B3F2E]" />;
    } else {
      return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSlotStatus = (slot: Slot) => {
    if (slot.is_booked) {
      return `Booked by ${slot.user_name || 'Unknown'}`;
    } else if (slot.is_blocked) {
      return slot.maintenance_reason || "Maintenance";
    } else if (slot.is_available) {
      return "Available";
    } else {
      return "Unavailable";
    }
  };

  const toggleSlotAvailability = (slotIndex: number) => {
    const slot = slots[slotIndex];
    
    // Don't allow modification of booked slots
    if (slot.is_booked) {
      alert('Cannot modify availability of booked slots. Cancel the booking first.');
      return;
    }

    setSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const updatedSlot = { ...newSlots[slotIndex] };
      
      if (updatedSlot.is_blocked) {
        // If currently blocked, make it available
        updatedSlot.is_blocked = false;
        updatedSlot.is_available = true;
        updatedSlot.maintenance_reason = '';
      } else if (updatedSlot.is_available) {
        // If currently available, block it
        updatedSlot.is_blocked = true;
        updatedSlot.is_available = false;
        updatedSlot.maintenance_reason = maintenanceReason || 'Maintenance';
      } else {
        // If unavailable for other reasons, make it available
        updatedSlot.is_available = true;
        updatedSlot.is_blocked = false;
        updatedSlot.maintenance_reason = '';
      }
      
      newSlots[slotIndex] = updatedSlot;
      return newSlots;
    });

    // Track modifications
    setModifiedSlots(prev => new Set(prev).add(slot.start_time));
  };

  const saveSlotChanges = async () => {
    if (modifiedSlots.size === 0) {
      setSuccess('No changes to save');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      const modifiedSlotsData = slots.filter(slot => 
        modifiedSlots.has(slot.start_time)
      );

      const unavailable_slots = modifiedSlotsData
        .filter(slot => slot.is_blocked)
        .map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time,
          reason: slot.maintenance_reason || 'Maintenance'
        }));

      const available_slots = modifiedSlotsData
        .filter(slot => slot.is_available && !slot.is_blocked)
        .map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time
        }));

      const response = await fetch(`http://localhost:5000/api/bookings/update-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: courtId,
          date: date,
          unavailable_slots,
          available_slots
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully updated ${data.blocksCreated || 0} maintenance blocks and ${data.blocksRemoved || 0} available slots`);
        setModifiedSlots(new Set()); // Reset modifications
        await fetchSlots(); // Refresh slots
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update slot availability');
      }
    } catch (error) {
      console.error('Error saving slot changes:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const blockMultipleSlots = async (isBlocked: boolean) => {
    if (modifiedSlots.size === 0) {
      setError('No slots selected for blocking/unblocking');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      const selectedSlots = slots.filter(slot => 
        modifiedSlots.has(slot.start_time)
      );

      const response = await fetch(`http://localhost:5000/api/bookings/block-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: courtId,
          date: date,
          slots: selectedSlots.map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time
          })),
          is_blocked: isBlocked
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setModifiedSlots(new Set()); // Reset modifications
        await fetchSlots(); // Refresh slots
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update slot block status');
      }
    } catch (error) {
      console.error('Error blocking/unblocking slots:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FFFFF7] min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E1F26]">Slot Management</h1>
              <p className="text-[#1E1F26] opacity-75">
                {facilityName} • {courtName} • {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-[#C4C4C4] rounded-lg text-[#1E1F26] focus:outline-none focus:ring-2 focus:ring-[#EFFF4F]"
              />
              <button
                onClick={fetchSlots}
                disabled={loading}
                className="px-4 py-2 bg-[#EFFF4F] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] disabled:opacity-50 flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Maintenance Reason Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1E1F26] mb-2">
              Maintenance Reason (for blocked slots):
            </label>
            <input
              type="text"
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              placeholder="Enter maintenance reason..."
              className="w-full px-3 py-2 border border-[#C4C4C4] rounded-lg text-[#1E1F26] focus:outline-none focus:ring-2 focus:ring-[#EFFF4F]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={saveSlotChanges}
              disabled={saving || modifiedSlots.size === 0}
              className="px-6 py-2 bg-[#EFFF4F] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Update Availability'}
            </button>
            
            {modifiedSlots.size > 0 && (
              <>
                <button
                  onClick={() => blockMultipleSlots(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-[#C4C4C4] text-[#1E1F26] rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Block Selected ({modifiedSlots.size})
                </button>
                <button
                  onClick={() => blockMultipleSlots(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-[#F0F7B1] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unblock Selected ({modifiedSlots.size})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {/* Slot Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1E1F26]">Time Slots</h2>
            <div className="text-sm text-[#1E1F26] opacity-75">
              {modifiedSlots.size > 0 && `${modifiedSlots.size} slot(s) modified`}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[#1B3F2E]" />
              <span className="ml-3 text-[#1E1F26]">Loading slots...</span>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm text-[#1E1F26]">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#F0F7B1] border-2 border-[#F0F7B1] rounded mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#C4C4C4] border-2 border-[#C4C4C4] rounded mr-2"></div>
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2"></div>
                  <span>Booked (Cannot modify)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#F5FF9F] border-2 border-[#EFFF4F] rounded mr-2"></div>
                  <span>Modified (Click to save)</span>
                </div>
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {slots.map((slot, index) => (
                  <div
                    key={`${slot.start_time}-${slot.end_time}`}
                    onClick={() => toggleSlotAvailability(index)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${getSlotColor(slot)} relative ${
                      modifiedSlots.has(slot.start_time) ? 'ring-2 ring-[#EFFF4F] ring-opacity-75' : ''
                    }`}
                    title={getSlotStatus(slot)}
                  >
                    {/* Status overlay for modified slots */}
                    {modifiedSlots.has(slot.start_time) && (
                      <div className="absolute inset-0 bg-[#F5FF9F] bg-opacity-30 rounded-lg flex items-center justify-center">
                        <span className="text-[#1E1F26] font-bold text-xs transform rotate-12">MODIFIED</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getSlotIcon(slot)}
                        <span className="text-sm font-medium">
                          {slot.start_time}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-center">
                      <div className="font-medium">{getSlotStatus(slot)}</div>
                      <div className="text-[#1E1F26]">
                        ₹{slot.price}
                      </div>
                      {slot.maintenance_reason && slot.is_blocked && (
                        <div className="text-xs text-[#1E1F26] mt-1 truncate">
                          {slot.maintenance_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};