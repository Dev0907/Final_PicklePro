import React, { useState, useEffect } from "react";
import { Calendar, Clock, CreditCard } from "lucide-react";
import { enhancedBookingAlerts } from "../utils/sweetAlert";

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  owner_name: string;
}

interface SimpleSlotCalendarProps {
  facility: Facility;
  courts: Court[];
  onBookSlot: (
    court: Court,
    date: string,
    startTime: string,
    endTime: string
  ) => void;
}

export const SimpleSlotCalendar: React.FC<SimpleSlotCalendarProps> = ({
  facility,
  courts,
  onBookSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCourt, setSelectedCourt] = useState<string>(
    courts[0]?.id || ""
  );
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slotsData, setSlotsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate time slots from 6 AM to 10 PM
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const displayTime =
      hour > 12
        ? `${hour - 12}:00 PM`
        : hour === 12
        ? "12:00 PM"
        : `${hour}:00 AM`;
    timeSlots.push({
      time: timeString,
      hour: hour,
      display: displayTime,
    });
  }

  // Fetch slots for selected court and date
  const fetchSlots = async () => {
    if (!selectedCourt || !selectedDate) return;

    setLoading(true);
    try {
      console.log(
        `Fetching slots for court ${selectedCourt} on ${selectedDate}`
      );
      const response = await fetch(
        `http://localhost:5000/api/bookings/court/${selectedCourt}/slots?date=${selectedDate}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Slots data received:", data);
        setSlotsData(data.slots || []);
      } else {
        console.error("Failed to fetch slots:", response.status);
        // Create default available slots
        const defaultSlots = timeSlots.map((slot) => ({
          time: slot.time,
          hour: slot.hour,
          available: true,
          booking_id: null,
          user_name: null,
          status: null,
        }));
        setSlotsData(defaultSlots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      // Create default available slots on error
      const defaultSlots = timeSlots.map((slot) => ({
        time: slot.time,
        hour: slot.hour,
        available: true,
        booking_id: null,
        user_name: null,
        status: null,
      }));
      setSlotsData(defaultSlots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedCourt, selectedDate]);

  const handleSlotClick = (timeSlot: string) => {
    const slot = slotsData.find((s) => s.time === timeSlot);
    if (!slot || !slot.available) {
      enhancedBookingAlerts.slotUnavailable();
      return;
    }

    if (selectedSlots.includes(timeSlot)) {
      setSelectedSlots((prev) => prev.filter((t) => t !== timeSlot));
    } else {
      setSelectedSlots((prev) => [...prev, timeSlot].sort());
    }
  };

  const handleBookSelected = () => {
    if (selectedSlots.length === 0) {
      enhancedBookingAlerts.invalidSlotSelection();
      return;
    }

    // Validate consecutive slots
    const sortedSlots = [...selectedSlots].sort();
    for (let i = 1; i < sortedSlots.length; i++) {
      const currentHour = parseInt(sortedSlots[i].split(":")[0]);
      const previousHour = parseInt(sortedSlots[i - 1].split(":")[0]);
      if (currentHour !== previousHour + 1) {
        enhancedBookingAlerts.invalidSlotSelection();
        return;
      }
    }

    const court = courts.find((c) => c.id === selectedCourt);
    if (!court) return;

    const startTime = sortedSlots[0];
    const endHour =
      parseInt(sortedSlots[sortedSlots.length - 1].split(":")[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:00`;

    onBookSlot(court, selectedDate, startTime, endTime);
    setSelectedSlots([]);
  };

  const selectedCourt_data = courts.find((c) => c.id === selectedCourt);
  const totalAmount =
    selectedSlots.length * (selectedCourt_data?.pricing_per_hour || 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-deep-navy mb-2">
          Book Your Slot at {facility.name}
        </h2>
        <p className="text-gray-600">Select date, court, and time slots</p>
      </div>

      {/* Date and Court Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-deep-navy mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlots([]);
            }}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-navy mb-2">
            Select Court
          </label>
          <select
            value={selectedCourt}
            onChange={(e) => {
              setSelectedCourt(e.target.value);
              setSelectedSlots([]);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name} - {court.sport_type} (₹{court.pricing_per_hour}/hr)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available slots...</p>
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
        <p>
          <strong>Debug Info:</strong>
        </p>
        <p>Selected Court: {selectedCourt}</p>
        <p>Selected Date: {selectedDate}</p>
        <p>Slots Data Length: {slotsData.length}</p>
        <p>Available Slots: {slotsData.filter((s) => s.available).length}</p>
      </div>

      {/* Time Slots Grid */}
      {!loading && slotsData.length > 0 && (
        <div className="space-y-6">
          {/* Morning Slots */}
          <div>
            <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Morning (6 AM - 12 PM)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {slotsData
                .filter((slot) => slot.hour >= 6 && slot.hour < 12)
                .map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleSlotClick(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      !slot.available
                        ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed"
                        : selectedSlots.includes(slot.time)
                        ? "bg-ocean-teal border-ocean-teal text-white"
                        : "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                    }`}
                    title={
                      slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour} - Click to select`
                        : `Booked by ${slot.user_name}`
                    }
                  >
                    <div>
                      {timeSlots.find((t) => t.time === slot.time)?.display}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour}`
                        : "Booked"}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Afternoon Slots */}
          <div>
            <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Afternoon (12 PM - 6 PM)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {slotsData
                .filter((slot) => slot.hour >= 12 && slot.hour < 18)
                .map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleSlotClick(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      !slot.available
                        ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed"
                        : selectedSlots.includes(slot.time)
                        ? "bg-ocean-teal border-ocean-teal text-white"
                        : "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                    }`}
                    title={
                      slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour} - Click to select`
                        : `Booked by ${slot.user_name}`
                    }
                  >
                    <div>
                      {timeSlots.find((t) => t.time === slot.time)?.display}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour}`
                        : "Booked"}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Evening Slots */}
          <div>
            <h3 className="text-lg font-semibold text-deep-navy mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-500" />
              Evening (6 PM - 11 PM)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {slotsData
                .filter((slot) => slot.hour >= 18 && slot.hour <= 22)
                .map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleSlotClick(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      !slot.available
                        ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed"
                        : selectedSlots.includes(slot.time)
                        ? "bg-ocean-teal border-ocean-teal text-white"
                        : "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                    }`}
                    title={
                      slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour} - Click to select`
                        : `Booked by ${slot.user_name}`
                    }
                  >
                    <div>
                      {timeSlots.find((t) => t.time === slot.time)?.display}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.available
                        ? `₹${selectedCourt_data?.pricing_per_hour}`
                        : "Booked"}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Booking Summary */}
          {selectedSlots.length > 0 && (
            <div className="bg-sky-mist rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-deep-navy mb-1">
                    Booking Summary
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedSlots.length} slot
                    {selectedSlots.length > 1 ? "s" : ""} selected (
                    {selectedSlots[0]} -{" "}
                    {parseInt(
                      selectedSlots[selectedSlots.length - 1].split(":")[0]
                    ) + 1}
                    :00)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-deep-navy">
                    ₹{totalAmount}
                  </div>
                  <button
                    type="button"
                    onClick={handleBookSelected}
                    className="mt-2 px-6 py-2 bg-lemon-zest text-deep-navy rounded-lg font-medium hover:bg-lemon-zest/90 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-ocean-teal rounded mr-2"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span>Booked</span>
            </div>
          </div>
        </div>
      )}

      {/* No slots message */}
      {!loading && slotsData.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">
            No slots available for the selected date
          </p>
        </div>
      )}
    </div>
  );
};
