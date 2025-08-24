import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Clock, CreditCard, User, Phone, Mail, Filter, CheckCircle, XCircle } from 'lucide-react';
import { getToken } from '../utils/auth';

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
  user_name: string;
  user_phone: string;
  user_email: string;
}

interface Facility {
  id: string;
  name: string;
  location: string;
}

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFacilities = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/facilities/owner/facilities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities || []);
        if (data.facilities && data.facilities.length > 0) {
          setSelectedFacility(data.facilities[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!selectedFacility) return;

    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to view bookings');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/bookings/facility/${selectedFacility}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch bookings');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedFacility]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    if (selectedFacility) {
      fetchBookings();
    }
  }, [selectedFacility, fetchBookings]);

  const handleCompleteBooking = async (bookingId: string) => {
    if (!confirm('Mark this booking as completed?')) {
      return;
    }

    setActionLoading(bookingId);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to complete booking');
        setActionLoading(null);
        return;
      }

      alert('Booking marked as completed!');
      fetchBookings(); // Refresh bookings
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked':
        return <Clock className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter && booking.status !== statusFilter) return false;
    if (dateFilter && booking.booking_date !== dateFilter) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalRevenue = () => {
    return filteredBookings
      .filter(booking => booking.status !== 'cancelled')
      .reduce((total, booking) => total + parseFloat(booking.total_amount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">Manage Bookings</h1>
            <p className="text-gray-600">View and manage court bookings for your facilities</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Facility Filter */}
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Select Facility
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">Select a facility</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('');
                    setDateFilter('');
                  }}
                  className="w-full px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Revenue Summary */}
            {filteredBookings.length > 0 && (
              <div className="mt-4 p-4 bg-lemon-zest/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-deep-navy font-medium">
                    Total Bookings: {filteredBookings.length}
                  </span>
                  <span className="text-deep-navy font-bold">
                    Revenue: ₹{getTotalRevenue().toLocaleString()}
                  </span>
                </div>
              </div>
            )}
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

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : !selectedFacility ? (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a facility</h3>
              <p className="text-gray-500">Choose a facility to view its bookings</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookings found</h3>
              <p className="text-gray-500">No bookings match your current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-1">
                        {booking.court_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.sport_type}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-deep-navy">
                      <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
                      {formatDate(booking.booking_date)}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <Clock className="h-4 w-4 mr-3 text-ocean-teal" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      <span className="ml-2 text-gray-500">({booking.total_hours} hour{booking.total_hours !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <CreditCard className="h-4 w-4 mr-3 text-ocean-teal" />
                      ₹{booking.total_amount}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="bg-sky-mist rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-deep-navy mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Customer Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-deep-navy">
                        <User className="h-3 w-3 mr-2" />
                        {booking.user_name}
                      </div>
                      <div className="flex items-center text-deep-navy">
                        <Phone className="h-3 w-3 mr-2" />
                        {booking.user_phone}
                      </div>
                      <div className="flex items-center text-deep-navy">
                        <Mail className="h-3 w-3 mr-2" />
                        {booking.user_email}
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="font-semibold text-deep-navy mb-1 text-sm">Notes:</h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Booked: {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    {booking.status === 'booked' && (
                      <button
                        type="button"
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center disabled:opacity-50"
                      >
                        {actionLoading === booking.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700 mr-2"></div>
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Complete
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
  );
};