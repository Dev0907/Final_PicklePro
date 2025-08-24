import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
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

interface SlotData {
  time: string;
  hour: number;
  available: boolean;
  booking_id: string | null;
  user_name: string | null;
  status: string | null;
}

interface WeeklySlotCalendarProps {
  facility: Facility;
  courts: Court[];
  onBookSlot: (
    court: Court,
    date: string,
    startTime: string,
    endTime: string
  ) => void;
}

export const WeeklySlotCalendar: React.FC<WeeklySlotCalendarProps> = ({
  facility,
  courts,
  onBookSlot,
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<{
    [key: string]: string[];
  }>({});
  const [slotsData, setSlotsData] = useState<{
    [key: string]: { [key: string]: SlotData[] };
  }>({});
  const [loading, setLoading] = useState(false);

  // Generate week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Time slots from 6 AM to 10 PM
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      hour: hour,
      display:
        hour > 12
          ? `${hour - 12}:00 PM`
          : hour === 12
          ? "12:00 PM"
          : `${hour}:00 AM`,
    });
  }

  // Fetch slot data for all courts and dates
  const fetchSlotsData = useCallback(async () => {
    setLoading(true);
    const newSlotsData: { [key: string]: { [key: string]: SlotData[] } } = {};

    try {
      for (const court of courts) {
        newSlotsData[court.id] = {};
        for (const date of weekDates) {
          const dateStr = date.toISOString().split("T")[0];
          try {
            // Fetch both slot availability and existing bookings
            const [slotsResponse, bookingsResponse] = await Promise.all([
              fetch(
                `http://localhost:5000/api/bookings/slots/${court.id}?date=${dateStr}`
              ),
              fetch(
                `http://localhost:5000/api/bookings/court/${court.id}?date=${dateStr}`
              ),
            ]);

            let slots = timeSlots.map((slot) => ({
              time: slot.time,
              hour: slot.hour,
              available: true,
              booking_id: null,
              user_name: null,
              status: null,
            }));

            // If we have booking data, mark slots as unavailable
            if (bookingsResponse.ok) {
              const bookingsData = await bookingsResponse.json();
              const bookings = bookingsData.bookings || [];

              // Mark booked slots as unavailable
              bookings.forEach((booking: any) => {
                if (
                  booking.status === "confirmed" ||
                  booking.status === "completed"
                ) {
                  const startHour = parseInt(booking.start_time.split(":")[0]);
                  const endHour = parseInt(booking.end_time.split(":")[0]);

                  for (let hour = startHour; hour < endHour; hour++) {
                    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                    const slotIndex = slots.findIndex(
                      (s) => s.time === timeStr
                    );
                    if (slotIndex !== -1) {
                      slots[slotIndex] = {
                        ...slots[slotIndex],
                        available: false,
                        booking_id: booking.id,
                        user_name: booking.user_name,
                        status: booking.status,
                      };
                    }
                  }
                }
              });
            }

            newSlotsData[court.id][dateStr] = slots;
          } catch (error) {
            console.error(
              `Error fetching data for court ${court.id} on ${dateStr}:`,
              error
            );
            // Create default available slots on error
            newSlotsData[court.id][dateStr] = timeSlots.map((slot) => ({
              time: slot.time,
              hour: slot.hour,
              available: true,
              booking_id: null,
              user_name: null,
              status: null,
            }));
          }
        }
      }
      setSlotsData(newSlotsData);
    } catch (error) {
      console.error("Error fetching slots data:", error);
    } finally {
      setLoading(false);
    }
  }, [courts, weekDates]);

  useEffect(() => {
    if (courts.length > 0) {
      fetchSlotsData();
    }
  }, [fetchSlotsData]);

  // Auto-refresh slot data every 30 seconds to show real-time availability
  useEffect(() => {
    if (courts.length === 0) return;

    const interval = setInterval(() => {
      fetchSlotsData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [courts, fetchSlotsData]);

  const handleSlotClick = (
    courtId: string,
    date: string,
    timeSlot: string,
    slot: SlotData
  ) => {
    if (!slot.available) return;

    const key = `${courtId}-${date}`;
    const currentSelected = selectedSlots[key] || [];

    if (currentSelected.includes(timeSlot)) {
      // Deselect slot
      setSelectedSlots((prev) => ({
        ...prev,
        [key]: currentSelected.filter((t) => t !== timeSlot),
      }));
    } else {
      // Select slot (allow multiple consecutive slots)
      setSelectedSlots((prev) => ({
        ...prev,
        [key]: [...currentSelected, timeSlot].sort(),
      }));
    }
  };

  const handleBookSelected = async (courtId: string, date: string) => {
    const key = `${courtId}-${date}`;
    const selected = selectedSlots[key];

    if (!selected || selected.length === 0) {
      enhancedBookingAlerts.invalidSlotSelection();
      return;
    }

    // Validate consecutive slots
    const sortedSlots = selected.sort();
    for (let i = 1; i < sortedSlots.length; i++) {
      const currentHour = parseInt(sortedSlots[i].split(":")[0]);
      const previousHour = parseInt(sortedSlots[i - 1].split(":")[0]);
      if (currentHour !== previousHour + 1) {
        enhancedBookingAlerts.invalidSlotSelection();
        return;
      }
    }

    const court = courts.find((c) => c.id === courtId);
    if (!court) return;

    const startTime = sortedSlots[0];
    const endHour =
      parseInt(sortedSlots[sortedSlots.length - 1].split(":")[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:00`;

    // Clear selection immediately to prevent double booking
    setSelectedSlots((prev) => ({
      ...prev,
      [key]: [],
    }));

    try {
      await onBookSlot(court, date, startTime, endTime);

      // Refresh slot data after successful booking
      await fetchSlotsData();

      enhancedBookingAlerts.bookingSuccess();
    } catch (error) {
      console.error("Booking failed:", error);
      enhancedBookingAlerts.bookingError();

      // Refresh slot data to show current availability
      await fetchSlotsData();
    }
  };

  const getSlotPrice = (court: Court, selectedCount: number) => {
    return court.pricing_per_hour * selectedCount;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
    setSelectedSlots({}); // Clear selections when changing week
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-deep-navy mb-1">
            Select Your Preferred Slots
          </h2>
          <p className="text-gray-600">
            Choose date and time for {facility.name}
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigateWeek("prev")}
            className="p-2 text-gray-600 hover:text-ocean-teal transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-medium text-deep-navy">
            {weekDates[0].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {weekDates[6].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <button
            type="button"
            onClick={() => navigateWeek("next")}
            className="p-2 text-gray-600 hover:text-ocean-teal transition-colors"
            title="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={fetchSlotsData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-ocean-teal transition-colors disabled:opacity-50"
            title="Refresh availability"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {courts.map((court) => (
            <div
              key={court.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Court Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-deep-navy">
                      {court.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-ocean-teal text-white rounded-full">
                        {court.sport_type}
                      </span>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />₹
                        {court.pricing_per_hour}/hour
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 border-b border-gray-200">
                    <div className="p-3 text-sm font-medium text-gray-600 bg-gray-50">
                      Time
                    </div>
                    {weekDates.map((date, index) => (
                      <div
                        key={index}
                        className={`p-3 text-center text-sm font-medium border-l border-gray-200 ${
                          isToday(date)
                            ? "bg-ocean-teal text-white"
                            : isPastDate(date)
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        <div>{dayNames[index]}</div>
                        <div className="text-xs mt-1">
                          {date.getDate()}/{date.getMonth() + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots Grid */}
                  {timeSlots.map((timeSlot) => (
                    <div
                      key={timeSlot.time}
                      className="grid grid-cols-8 border-b border-gray-100"
                    >
                      <div className="p-3 text-sm text-gray-600 bg-gray-50 border-r border-gray-200">
                        {timeSlot.display}
                      </div>
                      {weekDates.map((date, dateIndex) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const slot = slotsData[court.id]?.[dateStr]?.find(
                          (s) => s.time === timeSlot.time
                        );
                        const key = `${court.id}-${dateStr}`;
                        const isSelected = selectedSlots[key]?.includes(
                          timeSlot.time
                        );
                        const isDatePast = isPastDate(date);

                        return (
                          <div
                            key={`${court.id}-${dateStr}-${timeSlot.time}`}
                            className="border-l border-gray-200"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleSlotClick(
                                  court.id,
                                  dateStr,
                                  timeSlot.time,
                                  slot || {
                                    time: timeSlot.time,
                                    hour: timeSlot.hour,
                                    available: true,
                                    booking_id: null,
                                    user_name: null,
                                    status: null,
                                  }
                                )
                              }
                              disabled={!slot?.available || isDatePast}
                              className={`w-full h-12 text-xs transition-all duration-200 ${
                                isDatePast
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : !slot?.available
                                  ? "bg-red-100 text-red-600 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-ocean-teal text-white"
                                  : "bg-white hover:bg-sky-mist text-gray-700"
                              }`}
                              title={
                                isDatePast
                                  ? "Past date - Cannot book"
                                  : !slot?.available
                                  ? `Booked by ${
                                      slot?.user_name || "Another user"
                                    } - Status: ${slot?.status || "confirmed"}`
                                  : isSelected
                                  ? "Selected - Click to deselect"
                                  : `Available - ₹${court.pricing_per_hour}/hour - Click to select`
                              }
                            >
                              {isDatePast
                                ? "—"
                                : !slot?.available
                                ? "Booked"
                                : isSelected
                                ? "✓"
                                : "₹" + court.pricing_per_hour}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Summary for this court */}
              {Object.keys(selectedSlots).some(
                (key) =>
                  key.startsWith(court.id) && selectedSlots[key].length > 0
              ) && (
                <div className="bg-sky-mist p-4 border-t border-gray-200">
                  {Object.entries(selectedSlots)
                    .filter(
                      ([key, slots]) =>
                        key.startsWith(court.id) && slots.length > 0
                    )
                    .map(([key, slots]) => {
                      const date = key.split("-")[1];
                      const dateObj = new Date(date);
                      const totalPrice = getSlotPrice(court, slots.length);

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div className="text-sm text-deep-navy">
                            <strong>
                              {dateObj.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </strong>
                            <span className="ml-2">
                              {slots.length} slot{slots.length > 1 ? "s" : ""}{" "}
                              selected
                            </span>
                            <span className="ml-2 text-gray-600">
                              ({slots[0]} -{" "}
                              {parseInt(slots[slots.length - 1].split(":")[0]) +
                                1}
                              :00)
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold text-deep-navy">
                              ₹{totalPrice}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleBookSelected(court.id, date)}
                              className="px-4 py-2 bg-lemon-zest text-deep-navy rounded-lg font-medium hover:bg-lemon-zest/90 transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend and Info */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-center space-x-6 text-sm bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
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
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
            <span>Past</span>
          </div>
        </div>

        <div className="flex items-center justify-center text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>
            Slot availability updates automatically every 30 seconds. Click
            refresh for instant updates.
          </span>
        </div>
      </div>
    </div>
  );
};
