import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  MapPin, 
  Clock, 
  DollarSign,
 
  X,
  Save,
 
} from 'lucide-react';
import { 
  generateOptimizedUrl, 
  validateImageFile, 
  createImagePreview,
  getPlaceholderImage
} ;

interface Court {
  id: number;
  facility_id: number;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
  facility_name?: string;
  facility_location?: string;
}

interface Facility {
  id: number;
  name: string;
  location: string;
  description: string;
  photos: string[];
}

const CourtManagement: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourts();
    fetchFacilities();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/facilities/owner', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities || []);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const deleteCourt = async (courtId: number) => {
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setCourts(courts.filter(court => court.id !== courtId));
        // Send notification to all users about court deletion
        await sendCourtNotification('court_deleted', `A court has been removed from our facilities.`);
      }
    } catch (error) {
      console.error('Error deleting court:', error);
    }
  };

  const sendCourtNotification = async (type: string, message: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/bulk-create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          title: 'Court Update',
          message,
          send_to_all: true
        })
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Court Management</h2>
          <p className="text-gray-600">Manage your facilities and courts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddFacility(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Facility
          </button>
          <button
            onClick={() => setShowAddCourt(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Court
          </button>
        </div>
      </div>

      {/* Facilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>

      {/* Courts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Courts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Court Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operating Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courts.map((court) => (
                <tr key={court.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{court.name}</div>
                      <div className="text-sm text-gray-500">{court.sport_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{court.facility_name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {court.facility_location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ₹{court.pricing_per_hour}/hour
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {court.operating_hours_start} - {court.operating_hours_end}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      court.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {court.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingCourt(court)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCourt(court.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Court Modal */}
      {(showAddCourt || editingCourt) && (
        <CourtModal
          court={editingCourt}
          facilities={facilities}
          onClose={() => {
            setShowAddCourt(false);
            setEditingCourt(null);
          }}
          onSave={() => {
            fetchCourts();
            setShowAddCourt(false);
            setEditingCourt(null);
          }}
        />
      )}

      {/* Add Facility Modal */}
      {showAddFacility && (
        <FacilityModal
          onClose={() => setShowAddFacility(false)}
          onSave={() => {
            fetchFacilities();
            setShowAddFacility(false);
          }}
        />
      )}
    </div>
  );
};

// Facility Card Component
const FacilityCard: React.FC<{ facility: Facility }> = ({ facility }) => {
  const [imageError, setImageError] = useState(false);
  
  const getImageUrl = () => {
    if (facility.photos && facility.photos.length > 0 && !imageError) {
      return generateOptimizedUrl(facility.photos[0], { width: 400, height: 300 });
    }
    return getPlaceholderImage(400, 300);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-48 bg-gray-200 relative">
        <img
          src={getImageUrl()}
          alt={facility.name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            Active
          </span>
        </div>
        {facility.photos && facility.photos.length > 1 && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              +{facility.photos.length - 1} more
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{facility.name}</h3>
        <p className="text-gray-600 text-sm mb-3 flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          {facility.location}
        </p>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{facility.description}</p>
        <div className="flex justify-between items-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Details
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Court Modal Component
const CourtModal: React.FC<{
  court: Court | null;
  facilities: Facility[];
  onClose: () => void;
  onSave: () => void;
}> = ({ court, facilities, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    facility_id: court?.facility_id || '',
    name: court?.name || '',
    sport_type: court?.sport_type || 'Pickleball',
    pricing_per_hour: court?.pricing_per_hour || '',
    operating_hours_start: court?.operating_hours_start || '06:00',
    operating_hours_end: court?.operating_hours_end || '22:00',
    is_active: court?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = court ? `/api/courts/${court.id}` : '/api/courts';
      const method = court ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
        // Send notification about court addition/update
        const message = court 
          ? `Court "${formData.name}" has been updated.`
          : `New court "${formData.name}" is now available for booking!`;
        
        await fetch('/api/notifications/bulk-create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: court ? 'court_updated' : 'court_added',
            title: 'Court Update',
            message,
            send_to_all: true
          })
        });
      }
    } catch (error) {
      console.error('Error saving court:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {court ? 'Edit Court' : 'Add New Court'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facility
            </label>
            <select
              value={formData.facility_id}
              onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport Type
            </label>
            <select
              value={formData.sport_type}
              onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="Pickleball">Pickleball</option>
              <option value="Tennis">Tennis</option>
              <option value="Badminton">Badminton</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pricing per Hour (₹)
            </label>
            <input
              type="number"
              value={formData.pricing_per_hour}
              onChange={(e) => setFormData({ ...formData, pricing_per_hour: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.operating_hours_start}
                onChange={(e) => setFormData({ ...formData, operating_hours_start: e.target.value })}
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
                value={formData.operating_hours_end}
                onChange={(e) => setFormData({ ...formData, operating_hours_end: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {court ? 'Update' : 'Create'} Court
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Facility Modal Component
const FacilityModal: React.FC<{
  onClose: () => void;
  onSave: () => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    amenities: [] as string[],
    photos: [] as File[]
  });

  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }
    
    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setFormData({ ...formData, photos: [...formData.photos, ...validFiles] });
      
      // Create preview URLs
      const newPreviews = await Promise.all(
        validFiles.map(file => createImagePreview(file))
      );
      setPhotoPreview([...photoPreview, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    const newPreviews = photoPreview.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
    setPhotoPreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      
      // Append photos for Cloudinary upload
      formData.photos.forEach((photo) => {
        formDataToSend.append('photos', photo);
      });

      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSave();
        alert('Facility created successfully with photos uploaded to cloud storage!');
      } else {
        const errorData = await response.json();
        alert(`Error creating facility: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating facility:', error);
      alert('Error creating facility. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add New Facility</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facility Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location/Address
            </label>
            <textarea
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload photos</span>
              </label>
            </div>
            
            {photoPreview.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Facility
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtManagement;