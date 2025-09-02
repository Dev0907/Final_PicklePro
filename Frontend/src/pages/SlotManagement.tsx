import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, TrendingUp, DollarSign, Users, BarChart3, Activity, Filter, Plus, Settings } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { SlotGrid } from '../components/SlotGrid';
import { RevenueChart } from '../components/RevenueChart';
import { BookingHeatmap } from '../components/BookingHeatmap';
import { getToken } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

interface Facility {
  id: string;
  name: string;
  location: string;
  courts: Court[];
}

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
}

interface Analytics {
  summary: {
    total_bookings: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    avg_booking_value: number;
    total_hours_booked: number;
  };
  daily_data: Array<{
    booking_date: string;
    bookings_count: number;
    daily_revenue: number;
  }>;
}

export const SlotManagement: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showSlotCreator, setShowSlotCreator] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.userType === 'owner';

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
        const facilitiesWithCourts = await Promise.all(
          data.facilities.map(async (facility: any) => {
            const facilityResponse = await fetch(`http://localhost:5000/api/facilities/${facility.id}`);
            if (facilityResponse.ok) {
              const facilityData = await facilityResponse.json();
              return { ...facility, courts: facilityData.facility.courts || [] };
            }
            return { ...facility, courts: [] };
          })
        );
        
        setFacilities(facilitiesWithCourts);
        if (facilitiesWithCourts.length > 0) {
          setSelectedFacility(facilitiesWithCourts[0].id);
          if (facilitiesWithCourts[0].courts.length > 0) {
            setSelectedCourt(facilitiesWithCourts[0].courts[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedFacility) return;

    setAnalyticsLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/bookings/facility/${selectedFacility}/analytics?period=30`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedFacility]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    if (selectedFacility) {
      fetchAnalytics();
    }
  }, [selectedFacility, fetchAnalytics]);

  const selectedFacilityData = facilities.find(f => f.id === selectedFacility);
  const selectedCourtData = selectedFacilityData?.courts.find(c => c.id === selectedCourt);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy mb-2">Slot Management Dashboard</h1>
              <p className="text-gray-600">Monitor bookings, manage slots, and track revenue analytics</p>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowSlotCreator(true)}
                className="px-6 py-3 bg-[#EFFF4F] text-[#1E1F26] rounded-lg hover:bg-[#F5FF9F] transition-colors flex items-center"
                disabled={!selectedCourt}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Slots
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/court-management'}
                className="px-6 py-3 bg-lemon-zest text-deep-navy rounded-lg hover:bg-lemon-zest/90 transition-colors flex items-center"
              >
                <Settings className="h-5 w-5 mr-2" />
                Manage Courts
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Select Facility
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => {
                    setSelectedFacility(e.target.value);
                    const facility = facilities.find(f => f.id === e.target.value);
                    if (facility && facility.courts.length > 0) {
                      setSelectedCourt(facility.courts[0].id);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Select Court
                </label>
                <select
                  value={selectedCourt}
                  onChange={(e) => setSelectedCourt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  disabled={!selectedFacilityData?.courts.length}
                >
                  {selectedFacilityData?.courts.map(court => (
                    <option key={court.id} value={court.id}>
                      {court.name} - {court.sport_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && !analyticsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {formatCurrency(analytics.summary.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Last 30 days</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {analytics.summary.total_bookings || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    {analytics.summary.active_bookings} active
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hours Booked</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {analytics.summary.total_hours_booked || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Total hours</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {formatCurrency(analytics.summary.avg_booking_value || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Per booking</span>
                </div>
              </div>
            </div>
          )}

          {/* Slot Grid */}
          {selectedCourt && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Slot Availability - {selectedCourtData?.name}
                </h2>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
                    <span>Completed</span>
                  </div>
                </div>
              </div>
              <SlotGrid 
                courtId={selectedCourt} 
                date={selectedDate} 
                isOwner={isOwner}
              />
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Chart */}
            {selectedFacility && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-deep-navy mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue Trends
                </h2>
                <RevenueChart facilityId={selectedFacility} />
              </div>
            )}

            {/* Booking Heatmap */}
            {selectedFacility && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-deep-navy mb-6 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Booking Heatmap
                </h2>
                <BookingHeatmap facilityId={selectedFacility} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slot Creator Modal */}
      {showSlotCreator && selectedCourt && (
        <SlotCreatorModal
          courtId={selectedCourt}
          courtName={selectedCourtData?.name || ''}
          onClose={() => setShowSlotCreator(false)}
          onSuccess={() => {
            setShowSlotCreator(false);
            // Refresh slot grid if it exists
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

// Slot Creator Modal Component
interface SlotCreatorModalProps {
  courtId: string;
  courtName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SlotCreatorModal: React.FC<SlotCreatorModalProps> = ({ courtId, courtName, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    startTime: '06:00',
    endTime: '22:00',
    slotDuration: 60, // minutes
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday to Sunday
    pricing: {
      default: 500,
      peak: 700,
      peakHours: ['18:00', '19:00', '20:00', '21:00']
    }
  });
  const [loading, setLoading] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<any[]>([]);

  const daysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const generatePreview = () => {
    const slots = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (formData.daysOfWeek.includes(dayOfWeek)) {
        const startTime = new Date(`${date.toISOString().split('T')[0]}T${formData.startTime}`);
        const endTime = new Date(`${date.toISOString().split('T')[0]}T${formData.endTime}`);
        
        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + formData.slotDuration)) {
          const timeString = time.toTimeString().slice(0, 5);
          const isPeak = formData.pricing.peakHours.includes(timeString);
          
          slots.push({
            date: date.toISOString().split('T')[0],
            time: timeString,
            price: isPeak ? formData.pricing.peak : formData.pricing.default,
            isPeak
          });
        }
      }
    }
    
    setPreviewSlots(slots.slice(0, 20)); // Show first 20 for preview
  };

  useEffect(() => {
    generatePreview();
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/bookings/create-slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          court_id: courtId,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully created ${data.slotsCreated} slots!`);
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create slots');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData({
      ...formData,
      daysOfWeek: formData.daysOfWeek.includes(day)
        ? formData.daysOfWeek.filter(d => d !== day)
        : [...formData.daysOfWeek, day]
    });
  };

  const togglePeakHour = (hour: string) => {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing,
        peakHours: formData.pricing.peakHours.includes(hour)
          ? formData.pricing.peakHours.filter(h => h !== hour)
          : [...formData.pricing.peakHours, hour]
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-deep-navy">
            Create Slots for {courtName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Slot Duration (minutes) *
                </label>
                <select
                  value={formData.slotDuration}
                  onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Days of Week
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeekNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDayOfWeek(index)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.daysOfWeek.includes(index)
                          ? 'bg-ocean-teal text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Default Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.default}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, default: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    min="0"
                    step="50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Peak Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.peak}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, peak: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    min="0"
                    step="50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Peak Hours
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = (6 + i).toString().padStart(2, '0') + ':00';
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => togglePeakHour(hour)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          formData.pricing.peakHours.includes(hour)
                            ? 'bg-lemon-zest text-deep-navy'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Slots...
                    </>
                  ) : (
                    <>
                      Create Slots
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold text-deep-navy mb-4">
              Preview (First 20 slots)
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {previewSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No slots to preview. Check your settings.
                </p>
              ) : (
                <div className="space-y-2">
                  {previewSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 rounded ${
                        slot.isPeak ? 'bg-lemon-zest/20' : 'bg-white'
                      }`}
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {new Date(slot.date).toLocaleDateString()}
                        </span>
                        <span className="ml-2 text-gray-600">
                          {slot.time}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        ₹{slot.price}
                        {slot.isPeak && (
                          <span className="ml-1 text-xs text-orange-600">(Peak)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {previewSlots.length >= 20 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      ... and more slots will be created
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};