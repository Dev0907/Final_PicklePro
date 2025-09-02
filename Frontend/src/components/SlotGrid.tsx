import React, { useEffect, useState, useCallback } from 'react';
import { Clock, User, XCircle, Lock, Unlock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Slot {
  id: string;
  court_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  price: number;
  is_available: boolean;
  is_booked: boolean;
  is_blocked: boolean;
  booked_by?: string;
  is_own_booking?: boolean;
}

interface SlotGridProps {
  courtId: string;
  date: string;
  isOwner?: boolean;
  onSlotUpdate?: () => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({ courtId, date, isOwner = false, onSlotUpdate }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Listen for slot updates
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (updatedSlot: Slot) => {
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === updatedSlot.id ? { ...slot, ...updatedSlot } : slot
        )
      );
      onSlotUpdate?.();
    };

    const handleSlotBlocked = (data: { court_id: string; date: string; slots: Slot[] }) => {
      if (data.court_id === courtId && data.date === date) {
        setSlots(prevSlots => 
          prevSlots.map(slot => {
            const updatedSlot = data.slots.find(s => s.id === slot.id);
            return updatedSlot ? { ...slot, ...updatedSlot } : slot;
          })
        );
        onSlotUpdate?.();
      }
    };

    socket.on('slotBooked', handleSlotUpdate);
    socket.on('slotFreed', handleSlotUpdate);
    socket.on('slotBlocked', handleSlotBlocked);
    socket.on('slotUnblocked', handleSlotBlocked);

    return () => {
      socket.off('slotBooked', handleSlotUpdate);
      socket.off('slotFreed', handleSlotUpdate);
      socket.off('slotBlocked', handleSlotBlocked);
      socket.off('slotUnblocked', handleSlotBlocked);
    };
  }, [socket, courtId, date, onSlotUpdate]);

  // Fetch slots when courtId or date changes
  const fetchSlots = useCallback(async () => {
    if (!courtId || !date) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/slots/${courtId}?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch slots');
      }

      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message || 'Failed to load slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [courtId, date]);

  // Initial fetch
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const getSlotColor = (slot: Slot) => {
    if (slot.is_booked) {
      return 'bg-red-100 border-2 border-red-500 text-red-900';
    } else if (slot.is_blocked) {
      return 'bg-yellow-100 border-2 border-yellow-500 text-yellow-900';
    } else if (selectedSlots.has(slot.id)) {
      return 'bg-blue-100 border-2 border-blue-500 text-blue-900';
    } else if (slot.is_available) {
      return 'bg-white border-2 border-green-500 text-[#1B263F] hover:bg-green-50';
    } else {
      return 'bg-gray-100 border-2 border-gray-300 text-gray-500';
    }
  };

  const handleSlotClick = async (slot: Slot) => {
    if (isOwner) {
      // Toggle selection for owner
      const newSelectedSlots = new Set(selectedSlots);
      if (newSelectedSlots.has(slot.id)) {
        newSelectedSlots.delete(slot.id);
      } else {
        newSelectedSlots.add(slot.id);
      }
      setSelectedSlots(newSelectedSlots);
      return;
    }

    // Regular user booking flow
    if (slot.is_booked || !slot.is_available || slot.is_blocked) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to book a slot');
        return;
      }

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slot_id: slot.id,
          court_id: courtId,
          booking_date: date,
          start_time: slot.start_time,
          end_time: slot.end_time
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book slot');
      }

      // Refresh slots after successful booking
      fetchSlots();
    } catch (error) {
      setError(error.message || 'Failed to book slot. Please try again.');
      console.error('Booking error:', error);
    }
  };

  const handleBlockSlots = async (block: boolean) => {
    if (!selectedSlots.size) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to update slots');
        return;
      }

      const slotsToUpdate = slots.filter(slot => selectedSlots.has(slot.id));
      
      const response = await fetch('http://localhost:5000/api/bookings/block-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: courtId,
          date,
          slots: slotsToUpdate.map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time
          })),
          is_blocked: block
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${block ? 'block' : 'unblock'} slots`);
      }

      // Clear selection
      setSelectedSlots(new Set());
      // Refresh slots
      fetchSlots();
    } catch (error) {
      setError(error.message || `Failed to ${block ? 'block' : 'unblock'} slots. Please try again.`);
      console.error('Slot update error:', error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchSlots}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
        >
          <span className="sr-only">Retry</span>
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOwner && selectedSlots.size > 0 && (
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => handleBlockSlots(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center space-x-2"
          >
            <Lock size={16} />
            <span>Block Selected Slots</span>
          </button>
          <button
            onClick={() => handleBlockSlots(false)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-2"
          >
            <Unlock size={16} />
            <span>Unblock Selected Slots</span>
          </button>
          <button
            onClick={() => setSelectedSlots(new Set())}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slots.map((slot) => (
          <div
            key={`${slot.id}-${slot.start_time}`}
            onClick={() => handleSlotClick(slot)}
            className={`p-4 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer ${getSlotColor(slot)} ${
              (!isOwner && (slot.is_booked || !slot.is_available || slot.is_blocked)) ? 'cursor-not-allowed' : ''
            }`}
            title={
              slot.is_booked 
                ? 'Booked' 
                : slot.is_blocked 
                  ? 'Blocked for maintenance' 
                  : 'Available for booking'
            }
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </span>
              {slot.is_booked ? (
                <User className="h-4 w-4 text-red-700" />
              ) : slot.is_blocked ? (
                <Lock className="h-4 w-4 text-yellow-700" />
              ) : (
                <Clock className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div className="text-sm">
              {slot.is_booked 
                ? slot.is_own_booking ? 'Your Booking' : 'Booked'
                : slot.is_blocked 
                  ? 'Maintenance' 
                  : 'Available'}
            </div>
            {slot.price > 0 && (
              <div className="mt-2 text-sm font-medium">
                ₹{slot.price.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};