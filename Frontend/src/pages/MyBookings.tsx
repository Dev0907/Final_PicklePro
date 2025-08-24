import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { getToken } from "../utils/auth";

interface Booking {
  id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  court_name: string;
  sport_type: string;
  facility_name: string;
  facility_location: string;
}

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) {
        setError("Please log in to view your bookings");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/bookings/user/bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch bookings");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to cancel booking");
        setCancellingId(null);
        return;
      }

      alert("Booking cancelled successfully!");
      fetchBookings(); // Refresh bookings
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isUpcoming = (date: string, startTime: string) => {
    const bookingDateTime = new Date(`${date}T${startTime}`);
    return bookingDateTime > new Date();
  };

  const canCancel = (booking: Booking) => {
    return (
      booking.status === "booked" &&
      isUpcoming(booking.booking_date, booking.start_time)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">
              Manage your court bookings and view booking history
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
              <button
                type="button"
                onClick={fetchBookings}
                className="ml-2 text-red-800 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't made any court bookings yet
              </p>
              <button
                type="button"
                className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
                onClick={() => (window.location.href = "/book-slot")}
              >
                Book a Court
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-1">
                        {booking.court_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.facility_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">
                          {booking.status}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {booking.sport_type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-deep-navy">
                      <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
                      {formatDate(booking.booking_date)}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <Clock className="h-4 w-4 mr-3 text-ocean-teal" />
                      {formatTime(booking.start_time)} -{" "}
                      {formatTime(booking.end_time)}
                      <span className="ml-2 text-gray-500">
                        ({booking.total_hours} hour
                        {booking.total_hours !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <MapPin className="h-4 w-4 mr-3 text-ocean-teal" />
                      {booking.facility_location}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <CreditCard className="h-4 w-4 mr-3 text-ocean-teal" />₹
                      {booking.total_amount}
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-sky-mist rounded-lg p-3 mb-4">
                      <h4 className="font-semibold text-deep-navy mb-1 text-sm">
                        Notes:
                      </h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Booked:{" "}
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    {canCancel(booking) && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-2"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel Booking
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
