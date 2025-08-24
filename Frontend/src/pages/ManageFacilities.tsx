import React, { useEffect, useState, useCallback } from 'react';
import { Building, MapPin, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { getToken } from '../utils/auth';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports_supported: string[];
  amenities: string[];
  photos: string[];
  court_count: number;
  active_courts: number;
  is_active: boolean;
  created_at: string;
}

export const ManageFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to view your facilities');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/facilities/owner/facilities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch facilities');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFacilities(data.facilities || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowEditModal(true);
  };

  const handleDeleteFacility = async (facilityId: string) => {
    if (!confirm('Are you sure you want to delete this facility? This will also delete all associated courts and bookings.')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/facilities/${facilityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Facility deleted successfully!');
        fetchFacilities();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete facility');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedFacility(null);
    fetchFacilities();
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy mb-2">Manage Facilities</h1>
              <p className="text-gray-600">Manage your sports facilities and courts</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Facility
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
              <button
                type="button"
                onClick={fetchFacilities}
                className="ml-2 text-red-800 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your facilities...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No facilities found</h3>
              <p className="text-gray-500 mb-4">Create your first facility to start managing bookings</p>
              <button 
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
              >
                Create Facility
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {facilities.map((facility) => (
                <div key={facility.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-1">
                        {facility.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {facility.location}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditFacility(facility)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit facility"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFacility(facility.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete facility"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {facility.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-sky-mist rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="h-4 w-4 mr-1 text-ocean-teal" />
                      </div>
                      <div className="text-lg font-semibold text-deep-navy">{facility.active_courts}</div>
                      <div className="text-xs text-gray-600">Active Courts</div>
                    </div>
                    <div className="bg-lemon-zest/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 mr-1 text-deep-navy" />
                      </div>
                      <div className="text-lg font-semibold text-deep-navy">{facility.court_count}</div>
                      <div className="text-xs text-gray-600">Total Courts</div>
                    </div>
                  </div>

                  {/* Sports Supported */}
                  {facility.sports_supported && facility.sports_supported.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-deep-navy mb-2">Sports:</h4>
                      <div className="flex flex-wrap gap-2">
                        {facility.sports_supported.map((sport, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-ocean-teal/10 text-ocean-teal text-xs rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {facility.amenities && facility.amenities.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-deep-navy mb-2">Amenities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {facility.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(facility.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => window.location.href = `/court-management?facility=${facility.id}`}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Manage Courts
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.href = `/manage-bookings?facility=${facility.id}`}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        View Bookings
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.href = `/owner-slot-management?facility=${facility.id}`}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Manage Slots
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Create Facility Modal */}
      {showCreateModal && (
        <FacilityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Edit Facility Modal */}
      {showEditModal && selectedFacility && (
        <FacilityModal
          facility={selectedFacility}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFacility(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

// Facility Modal Component
interface FacilityModalProps {
  facility?: Facility;
  onClose: () => void;
  onSuccess: () => void;
}

const FacilityModal: React.FC<FacilityModalProps> = ({ facility, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: facility?.name || '',
    location: facility?.location || '',
    description: facility?.description || '',
    sports_supported: facility?.sports_supported || ['Pickleball'],
    amenities: facility?.amenities || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getToken();
      const url = facility 
        ? `http://localhost:5000/api/facilities/${facility.id}`
        : 'http://localhost:5000/api/facilities/create';
      
      const method = facility ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(`Facility ${facility ? 'updated' : 'created'} successfully!`);
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${facility ? 'update' : 'create'} facility`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSport = () => {
    const sport = prompt('Enter sport name:');
    if (sport && !formData.sports_supported.includes(sport)) {
      setFormData({
        ...formData,
        sports_supported: [...formData.sports_supported, sport]
      });
    }
  };

  const removeSport = (sport: string) => {
    setFormData({
      ...formData,
      sports_supported: formData.sports_supported.filter(s => s !== sport)
    });
  };

  const addAmenity = () => {
    const amenity = prompt('Enter amenity:');
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-deep-navy">
            {facility ? 'Edit Facility' : 'Create New Facility'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Facility Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              required
              placeholder="Enter facility name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Location/Address *
            </label>
            <textarea
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              rows={3}
              required
              placeholder="Enter complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              rows={4}
              placeholder="Describe your facility..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Sports Supported
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.sports_supported.map((sport, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-ocean-teal/10 text-ocean-teal rounded-full text-sm flex items-center"
                >
                  {sport}
                  <button
                    type="button"
                    onClick={() => removeSport(sport)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={addSport}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              + Add Sport
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-lemon-zest/20 text-deep-navy rounded-full text-sm flex items-center"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={addAmenity}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              + Add Amenity
            </button>
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
                  {facility ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {facility ? 'Update Facility' : 'Create Facility'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};