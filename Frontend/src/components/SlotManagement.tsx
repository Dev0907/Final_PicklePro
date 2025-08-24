import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Settings, 
  Plus, 
  X, 
  Save,
  AlertTriangle,
  CheckCircle,
  Ban
} from 'lucide-react';

interface Court {
  id: number;
  name: string;
  facility_name: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
}

interface Booking {
  id: number;
  court_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  user_name: string;
  total_amount: number;
}

interface MaintenanceBlock {
  id: number;
  court_id: number;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const SlotManagement: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<MaintenanceBlock[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      fetchBookings();
      fetchMaintenanceBlocks();
    }
  }, [selectedCourt, selectedDate]);

  const fetchCourts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courts/owner', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourts(data.courts || []);
        if (data.courts && data.courts.length > 0) {
          setSelectedCourt(data.courts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedCourt) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/court/${selectedCourt.id}?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchMaintenanceBlocks = async () => {
    if (!selectedCourt) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maintenance-blocks/court/${selectedCourt.id}?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceBlocks(data.blocks || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance blocks:', error);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedCourt) return [];

    const slots = [];
    const startHour = parseInt(selectedCourt.operating_hours_start.split(':')[0]);
    const endHour = parseInt(selectedCourt.operating_hours_end.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const endTimeSlot = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if slot is booked
      const booking = bookings.find(b => 
        b.start_time === timeSlot && b.booking_date === selectedDate
      );

      // Check if slot is blocked for maintenance
      const maintenance = maintenanceBlocks.find(m => 
        m.start_time <= timeSlot && m.end_time > timeSlot && m.block_date === selectedDate
      );

      slots.push({
        time: timeSlot,
        endTime: endTimeSlot,
        booking,
        maintenance,
        status: booking ? 'booked' : maintenance ? 'maintenance' : 'available'
      });
    }

    return slots;
  };

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchBookings();
        // Send notification to user about booking cancellation
        await fetch('/api/notifications/booking-cancelled', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            booking_id: bookingId,
            message: 'Your booking has been cancelled by the facility owner. You will receive a full refund.'
          })
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const removeMaintenanceBlock = async (blockId: number) => {
    if (!confirm('Are you sure you want to remove this maintenance block?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maintenance-blocks/${blockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchMaintenanceBlocks();
      }
    } catch (error) {
      console.error('Error removing maintenance block:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Slot Management</h2>
          <p className="text-gray-600">Manage court bookings and maintenance schedules</p>
        </div>
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Maintenance Block
        </button>
      </div>

      {/* Court and Date Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Court
            </label>
            <select
              value={selectedCourt?.id || ''}
              onChange={(e) => {
                const court = courts.find(c => c.id === parseInt(e.target.value));
                setSelectedCourt(court || null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} - {court.facility_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Slot Grid */}
      {selectedCourt && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedCourt.name} - {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                <span>Maintenance</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  slot.status === 'available' 
                    ? 'border-green-200 bg-green-50' 
                    : slot.status === 'booked'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">{slot.time} - {slot.endTime}</span>
                  </div>
                  {slot.status === 'available' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {slot.status === 'booked' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => slot.booking && cancelBooking(slot.booking.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Cancel Booking"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {slot.status === 'maintenance' && (
                    <div className="flex space-x-1">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <button
                        onClick={() => slot.maintenance && removeMaintenanceBlock(slot.maintenance.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Maintenance Block"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {slot.booking && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{slot.booking.user_name}</p>
                    <p>₹{slot.booking.total_amount}</p>
                    <p className="capitalize">{slot.booking.status}</p>
                  </div>
                )}

                {slot.maintenance && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Maintenance</p>
                    <p>{slot.maintenance.reason}</p>
                  </div>
                )}

                {slot.status === 'available' && (
                  <div className="text-sm text-gray-600">
                    <p>₹{selectedCourt.pricing_per_hour}/hour</p>
                    <p>Available for booking</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && selectedCourt && (
        <MaintenanceModal
          court={selectedCourt}
          date={selectedDate}
          onClose={() => setShowMaintenanceModal(false)}
          onSave={() => {
            fetchMaintenanceBlocks();
            setShowMaintenanceModal(false);
          }}
        />
      )}
    </div>
  );
};

// Maintenance Modal Component
const MaintenanceModal: React.FC<{
  court: Court;
  date: string;
  onClose: () => void;
  onSave: () => void;
}> = ({ court, date, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '10:00',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/maintenance-blocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          court_id: court.id,
          block_date: date,
          ...formData
        })
      });

      if (response.ok) {
        onSave();
        // Send notification to users about maintenance
        await fetch('/api/notifications/bulk-create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'maintenance_scheduled',
            title: 'Maintenance Scheduled',
            message: `${court.name} will be under maintenance on ${new Date(date).toLocaleDateString()} from ${formData.start_time} to ${formData.end_time}. Reason: ${formData.reason}`,
            send_to_all: true
          })
        });
      }
    } catch (error) {
      console.error('Error creating maintenance block:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Schedule Maintenance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court
            </label>
            <input
              type="text"
              value={`${court.name} - ${court.facility_name}`}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="text"
              value={new Date(date).toLocaleDateString()}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Maintenance
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SlotManagement;