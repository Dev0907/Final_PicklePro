import React, { useEffect, useState, useCallback } from "react";
import { Clock, User, XCircle, CheckCircle, Users, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { getToken, getCurrentUser } from "../utils/auth";

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
  slot_status?: string;
}

interface Match {
  id: string;
  title: string;
  level: 'Beginner' | 'Advanced';
  organizer: string;
  date: string;
  time: string;
  location: string;
  playersJoined: number;
  playersNeeded: number;
  status: 'available' | 'full' | 'pending';
  description?: string;
}

interface PlayerSlotGridProps {
  courtId: string;
  date: string;
  onSlotBooked?: () => void;
}

export const PlayerSlotGrid: React.FC<PlayerSlotGridProps> = ({
  courtId,
  date,
  onSlotBooked,
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'slots' | 'matches'>('slots');

  const currentUser = getCurrentUser();

  const fetchSlots = useCallback(async () => {
    if (!courtId || !date) return;

    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:5000/api/bookings/slots/${courtId}?date=${date}`,
        { headers }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch slots");
        return;
      }

      const data = await response.json();
      console.log('Fetched slots data:', data); // Debug log
      
      // Debug: Log slot status breakdown
      if (data.slots && data.slots.length > 0) {
        const available = data.slots.filter((s: any) => s.is_available && !s.is_booked && !s.is_blocked);
        const booked = data.slots.filter((s: any) => s.is_booked);
        const blocked = data.slots.filter((s: any) => s.is_blocked);
        console.log(`Slot breakdown - Available: ${available.length}, Booked: ${booked.length}, Blocked: ${blocked.length}`);
        
        // Log first few booked slots
        if (booked.length > 0) {
          console.log('Booked slots:', booked.map((s: any) => `${s.start_time}-${s.end_time}`));
        }
      }
      
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [courtId, date]);

  const fetchUserBookings = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = getToken();
      const response = await fetch(
        "http://localhost:5000/api/bookings/user/bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  }, [currentUser]);

  const fetchMatches = useCallback(async () => {
    // Mock data for matches - replace with actual API call
    const mockMatches: Match[] = [
      {
        id: '1',
        title: 'Advanced Match',
        level: 'Advanced',
        organizer: 'Aashray',
        date: '9/2/2025',
        time: '01:21 AM',
        location: 'Nadiad, Gujarat',
        playersJoined: 2,
        playersNeeded: 2,
        status: 'full',
        description: 'Match creator: Aashray\nPlayers joined: Sarthi, Shiv'
      },
      {
        id: '2',
        title: 'Beginner Match',
        level: 'Beginner',
        organizer: 'Aashray',
        date: '9/5/2025',
        time: '08:08 AM',
        location: 'Vadodara, India',
        playersJoined: 0,
        playersNeeded: 2,
        status: 'available',
        description: 'Match creator: Aashray'
      }
    ];
    setMatches(mockMatches);
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchUserBookings();
    fetchMatches();
  }, [fetchSlots, fetchUserBookings, fetchMatches]);

  // Auto-refresh slots every 30 seconds to show real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (courtId && date) {
        fetchSlots();
        fetchUserBookings();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [courtId, date, fetchSlots, fetchUserBookings]);

  const getSlotColor = (slot: Slot) => {
    const isMyBooking = userBookings.some(
      (booking) =>
        booking.court_id === slot.court_id &&
        booking.booking_date === slot.slot_date &&
        booking.start_time === slot.start_time &&
        booking.status !== "cancelled"
    );

    if (isMyBooking) {
      // Dark Green for my bookings
      return "bg-[#1B3F2E] border-[#1B3F2E] text-white shadow-lg";
    } else if (slot.is_booked && !isMyBooking) {
      // Red for slots booked by others - CANNOT BE CLICKED
      return "bg-red-100 border-red-400 text-red-800 cursor-not-allowed opacity-75";
    } else if (slot.is_blocked) {
      // Muted Grey for maintenance/blocked slots
      return "bg-[#C4C4C4] border-[#C4C4C4] text-[#1E1F26] cursor-not-allowed opacity-75";
    } else if (selectedSlots.includes(slot.start_time)) {
      // Highlight Yellow for selected available slots
      return "bg-[#F5FF9F] border-[#EFFF4F] text-[#1E1F26] shadow-lg cursor-pointer font-semibold transform scale-105";
    } else if (slot.is_available && !slot.is_booked && !slot.is_blocked) {
      // Light Olive for available slots - CAN BE CLICKED
      return "bg-[#F0F7B1] border-[#F0F7B1] text-[#1E1F26] hover:bg-[#F5FF9F] hover:border-[#EFFF4F] cursor-pointer transition-all duration-200 hover:shadow-md";
    } else {
      // Default for unavailable slots
      return "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-75";
    }
  };

  const getMatchStatusColor = (match: Match) => {
    switch (match.status) {
      case 'full':
        return 'bg-gray-100 border-gray-300';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'available':
      default:
        return 'bg-white border-gray-200 hover:border-gray-300';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    return level === 'Advanced' 
      ? 'bg-[#1B3F2E] text-white' 
      : 'bg-[#F0F7B1] text-[#1B3F2E]';
  };

  const getSlotIcon = (slot: Slot) => {
    const isMyBooking = userBookings.some(
      (booking) =>
        booking.court_id === slot.court_id &&
        booking.booking_date === slot.slot_date &&
        booking.start_time === slot.start_time &&
        booking.status !== "cancelled"
    );

    if (isMyBooking) {
      return <CheckCircle className="h-4 w-4 text-white" />;
    } else if (slot.is_available && !slot.is_booked && !slot.is_blocked) {
      return <Clock className="h-4 w-4 text-[#1B3F2E]" />;
    } else if (slot.is_blocked) {
      return <AlertTriangle className="h-4 w-4 text-[#1E1F26]" />;
    } else if (slot.is_booked) {
      return <User className="h-4 w-4 text-red-700" />;
    } else {
      return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSlotStatus = (slot: Slot) => {
    const isMyBooking = userBookings.some(
      (booking) =>
        booking.court_id === slot.court_id &&
        booking.booking_date === slot.slot_date &&
        booking.start_time === slot.start_time &&
        booking.status !== "cancelled"
    );

    if (isMyBooking) {
      return "My Booking";
    } else if (slot.is_booked && !isMyBooking) {
      return "Booked by Others";
    } else if (slot.is_blocked) {
      return slot.maintenance_reason || "Maintenance";
    } else if (!slot.is_available) {
      return "Unavailable";
    } else {
      return "Available";
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (!currentUser) {
      alert("Please log in to book a slot");
      return;
    }

    const isMyBooking = userBookings.some(
      (booking) =>
        booking.court_id === slot.court_id &&
        booking.booking_date === slot.slot_date &&
        booking.start_time === slot.start_time &&
        booking.status !== "cancelled"
    );

    // Provide specific feedback for different unavailable slot types
    if (isMyBooking) {
      alert("This slot is already booked by you!");
      return;
    }
    
    if (slot.is_booked && !isMyBooking) {
      alert("This slot has been booked by another player and is not available.");
      return;
    }
    
    if (slot.is_blocked) {
      alert("This slot is under maintenance and cannot be booked.");
      return;
    }
    
    if (!slot.is_available) {
      alert("This slot is not available for booking.");
      return;
    }

    // Only allow selection of truly available slots
    setSelectedSlots((prev) =>
      prev.includes(slot.start_time)
        ? prev.filter((time) => time !== slot.start_time)
        : [...prev, slot.start_time].sort()
    );
  };

  const handleBookSlots = async () => {
    if (selectedSlots.length === 0 || !currentUser) return;

    setBooking(true);
    try {
      const token = getToken();
      let totalAmount = 0;
      let successfulBookings = 0;
      let failedBookings = 0;

      // Book each selected slot individually
      for (const slotTime of selectedSlots) {
        const slot = slots.find((s) => s.start_time === slotTime);
        if (!slot) continue;

        try {
          console.log(`Booking slot: ${slotTime}`, {
            court_id: courtId,
            booking_date: date,
            start_time: slot.start_time,
            end_time: slot.end_time,
          });

          const response = await fetch(
            "http://localhost:5000/api/bookings/create",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                court_id: courtId,
                booking_date: date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                notes: "",
              }),
            }
          );

          const data = await response.json();
          console.log(`Booking response for ${slotTime}:`, data);

          if (response.ok) {
            totalAmount += slot.price;
            successfulBookings++;
          } else {
            console.error(`Failed to book slot ${slotTime}:`, data.error);
            failedBookings++;
            if (data.code === 'SLOT_UNAVAILABLE' || data.code === 'SLOT_CONFLICT') {
              setError(`Slot ${slotTime} is no longer available. Please refresh and try again.`);
            }
          }
        } catch (error) {
          console.error(`Error booking slot ${slotTime}:`, error);
          failedBookings++;
        }
      }

      if (successfulBookings > 0) {
        alert(
          `${successfulBookings} slot(s) booked successfully! Total amount: ₹${totalAmount}`
        );
        setSelectedSlots([]);
        fetchSlots(); // Refresh slots to show updated availability
        fetchUserBookings(); // Refresh user bookings
        onSlotBooked?.(); // Notify parent component
      } 
      
      if (failedBookings > 0 && successfulBookings === 0) {
        setError("Failed to book any slots. Some slots may have been taken by other players. Please refresh and try again.");
      } else if (failedBookings > 0) {
        setError(`${failedBookings} slot(s) could not be booked. They may have been taken by other players.`);
      }
    } catch (error) {
      console.error('Error in handleBookSlots:', error);
      setError("Network error. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    const period = hour >= 12 ? "PM" : "AM";
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-[#1B3F2E]" />
          <h1 className="text-2xl font-bold text-[#1E1F26]">Available Matches</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchSlots();
            fetchUserBookings();
            fetchMatches();
          }}
          disabled={loading}
          className="px-4 py-2 bg-[#EFFF4F] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <p className="text-[#1E1F26] mb-8">Browse and request to join matches in your area</p>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-[#F0F7B1]/30 p-1 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'matches'
              ? 'bg-[#EFFF4F] text-[#1E1F26] shadow-sm'
              : 'text-[#1E1F26] hover:text-[#1B3F2E]'
          }`}
        >
          Available Matches
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('slots')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'slots'
              ? 'bg-[#EFFF4F] text-[#1E1F26] shadow-sm'
              : 'text-[#1E1F26] hover:text-[#1B3F2E]'
          }`}
        >
          Book Individual Slots
        </button>
      </div>

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className={`border-2 rounded-xl p-6 transition-all duration-200 ${getMatchStatusColor(match)}`}
            >
              {/* Match Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{match.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelBadgeColor(match.level)}`}>
                      {match.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Organized by {match.organizer}</p>
                </div>
              </div>

              {/* Match Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-[#1E1F26]">
                  <Calendar className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  {match.date} at {match.time}
                </div>
                <div className="flex items-center text-sm text-[#1E1F26]">
                  <MapPin className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  {match.location}
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  <span className={match.status === 'full' ? 'text-[#1B3F2E] font-medium' : 'text-[#1E1F26]'}>
                    {match.status === 'full' ? '● Match Full' : `● ${match.playersNeeded - match.playersJoined} players needed`}
                  </span>
                  <span className="text-[#1E1F26] ml-1">
                    ({match.playersJoined}/{match.playersJoined + match.playersNeeded} joined)
                  </span>
                </div>
              </div>

              {/* Match Description */}
              {match.description && (
                <div className="bg-[#F0F7B1]/20 rounded-lg p-3 mb-4">
                  <div className="text-sm text-[#1E1F26] whitespace-pre-line">
                    {match.description}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {match.status === 'full' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Request accepted! This match now appears in My Matches. Open chat from there.
                  </div>
                </div>
              )}

              {match.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center text-sm text-yellow-800">
                    <Clock className="h-4 w-4 mr-2" />
                    Request pending - waiting for creator's response
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {match.status === 'full' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Match Full
                  </button>
                ) : match.status === 'pending' ? (
                  <button
                    type="button"
                    className="w-full bg-yellow-100 text-yellow-800 py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Request Pending
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full bg-[#EFFF4F] hover:bg-[#F5FF9F] text-[#1E1F26] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Request to Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {/* Time Slot Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => (
              <div
                key={`${slot.start_time}-${slot.end_time}`}
                onClick={() => handleSlotClick(slot)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${getSlotColor(
                  slot
                )} relative`}
                title={getSlotStatus(slot)}
              >
                {/* Status overlay for visual emphasis */}
                {slot.is_booked && !userBookings.some(
                  (booking) =>
                    booking.court_id === slot.court_id &&
                    booking.booking_date === slot.slot_date &&
                    booking.start_time === slot.start_time &&
                    booking.status !== "cancelled"
                ) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-red-800 font-bold text-xs transform rotate-12">BOOKED</span>
                  </div>
                )}
                
                {slot.is_blocked && (
                  <div className="absolute inset-0 bg-[#C4C4C4] bg-opacity-30 rounded-lg flex items-center justify-center">
                    <span className="text-[#1E1F26] font-bold text-xs transform rotate-12">MAINTENANCE</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getSlotIcon(slot)}
                    <span className="text-sm font-medium">
                      {formatTime(slot.start_time)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-center">
                  <div className="font-medium">{getSlotStatus(slot)}</div>
                  <div className={slot.is_booked ? "text-red-700 font-semibold" : "text-[#1E1F26]"}>
                    ₹{slot.price}
                  </div>
                  {slot.user_name && slot.is_booked && !userBookings.some(
                    (booking) =>
                      booking.court_id === slot.court_id &&
                      booking.booking_date === slot.slot_date &&
                      booking.start_time === slot.start_time &&
                      booking.status !== "cancelled"
                  ) && (
                    <div className="text-xs text-red-700 mt-1 truncate">
                      by {slot.user_name}
                    </div>
                  )}
                  {slot.maintenance_reason && slot.is_blocked && (
                    <div className="text-xs text-[#1E1F26] mt-1 truncate">
                      {slot.maintenance_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Booking Button */}
          {selectedSlots.length > 0 && (
            <div className="bg-[#F0F7B1]/30 border border-[#F0F7B1] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#1E1F26]">Selected Slots ({selectedSlots.length})</h4>
                  <p className="text-sm text-[#1E1F26]">
                    {selectedSlots.length === 1 
                      ? `${formatTime(selectedSlots[0])} - ${formatTime(`${parseInt(selectedSlots[0].split(":")[0]) + 1}:00`)}`
                      : `${selectedSlots.length} slots selected`
                    }
                  </p>
                  <p className="text-sm text-[#1E1F26]">
                    Total: ₹{selectedSlots.reduce((total, slotTime) => {
                      const slot = slots.find(s => s.start_time === slotTime);
                      return total + (slot?.price || 0);
                    }, 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBookSlots}
                  disabled={booking}
                  className="px-6 py-2 bg-[#EFFF4F] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? "Booking..." : "Book Slots"}
                </button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-[#F0F7B1]/20 rounded-lg p-4">
            <h4 className="font-semibold text-[#1E1F26] mb-3">Slot Status Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-[#1E1F26]">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#F0F7B1] border-2 border-[#F0F7B1] rounded mr-2"></div>
                <span>✅ Available (Click to book)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#F5FF9F] border-2 border-[#EFFF4F] rounded mr-2"></div>
                <span>🔵 Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#1B3F2E] border-2 border-[#1B3F2E] rounded mr-2"></div>
                <span>🟢 My Booking</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2 relative">
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded"></div>
                </div>
                <span>🔴 Booked by Others (Cannot book)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#C4C4C4] border-2 border-[#C4C4C4] rounded mr-2"></div>
                <span>🟡 Maintenance (Cannot book)</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white border border-[#C4C4C4] rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#1E1F26]">
                  {
                    slots.filter(
                      (slot) =>
                        slot.is_available && !slot.is_booked && !slot.is_blocked
                    ).length
                  }
                </div>
                <div className="text-sm text-[#1E1F26]">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1B3F2E]">
                  {
                    userBookings.filter(
                      (booking) =>
                        booking.court_id === parseInt(courtId) &&
                        booking.booking_date === date &&
                        booking.status !== "cancelled"
                    ).length
                  }
                </div>
                <div className="text-sm text-[#1E1F26]">My Bookings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {slots.filter((slot) => slot.is_booked).length}
                </div>
                <div className="text-sm text-[#1E1F26]">Booked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {slots.filter((slot) => slot.is_blocked).length}
                </div>
                <div className="text-sm text-[#1E1F26]">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
