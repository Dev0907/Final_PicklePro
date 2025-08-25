import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  X,
  Save,
  Building,
  Activity,
  Users,
} from "lucide-react";
import { getToken } from "../utils/auth";

interface Court {
  id: number;
  facility_id: number;
  name: string;
  sport_type: string;
  surface_type: string;
  court_size: string;
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
}

const CourtManagement: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string>("");

  useEffect(() => {
    fetchFacilities();
    fetchCourts();
  }, []);

  const fetchFacilities = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/facilities/owner/facilities",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities || []);
      }
    } catch (error) {
      console.error("Error fetching facilities:", error);
      setError("Failed to load facilities");
    }
  };

  const fetchCourts = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // First get all facilities for the owner
      const facilitiesResponse = await fetch(
        "http://localhost:5000/api/facilities/owner/facilities",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json();
        const ownerFacilities = facilitiesData.facilities || [];

        // Then fetch courts for each facility
        let allCourts: Court[] = [];

        for (const facility of ownerFacilities) {
          try {
            const courtsResponse = await fetch(
              `http://localhost:5000/api/courts/facility/${facility.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (courtsResponse.ok) {
              const courtsData = await courtsResponse.json();
              const facilityCourts = (courtsData.courts || []).map(
                (court: Court) => ({
                  ...court,
                  facility_name: facility.name,
                  facility_location: facility.location,
                })
              );
              allCourts = [...allCourts, ...facilityCourts];
            }
          } catch (error) {
            console.error(
              `Error fetching courts for facility ${facility.id}:`,
              error
            );
          }
        }

        setCourts(allCourts);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
      setError("Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  const deleteCourt = async (courtId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this court? This will also cancel all future bookings for this court."
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/courts/${courtId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setCourts(courts.filter((court) => court.id !== courtId));
        // Refresh facilities data to ensure accurate counts
        fetchFacilities();
        alert("Court deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete court");
      }
    } catch (error) {
      console.error("Error deleting court:", error);
      alert("Network error. Please try again.");
    }
  };

  const filteredCourts = selectedFacility
    ? courts.filter(
        (court) => court.facility_id.toString() === selectedFacility
      )
    : courts;

  const getCourtStats = () => {
    const total = courts.length;
    const active = courts.filter((c) => c.is_active !== false).length; // Consider undefined as active
    const inactive = total - active;
    const facilitiesCount = facilities.length; // Use actual facilities count

    return { total, active, inactive, facilities: facilitiesCount };
  };

  const stats = getCourtStats();

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Court Management
            </h1>
            <p className="text-gray-600">
              Manage courts across all your facilities
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCourt(true)}
            className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Court
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              type="button"
              onClick={() => {
                setError("");
                fetchCourts();
                fetchFacilities();
              }}
              className="ml-2 text-red-800 hover:text-red-900 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Courts
                </p>
                <p className="text-2xl font-bold text-deep-navy">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Courts
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Courts
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facilities</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.facilities}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-deep-navy">
              Filter by Facility:
            </label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              aria-label="Filter courts by facility"
            >
              <option value="">All Facilities</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            {selectedFacility && (
              <button
                type="button"
                onClick={() => setSelectedFacility("")}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courts...</p>
          </div>
        ) : filteredCourts.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {selectedFacility
                ? "No courts in selected facility"
                : "No courts found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedFacility
                ? "Add courts to this facility to start accepting bookings"
                : "Create your first court to start managing bookings"}
            </p>
            <button
              type="button"
              onClick={() => setShowAddCourt(true)}
              className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
            >
              Add Court
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourts.map((court) => (
              <div
                key={court.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-deep-navy mb-1">
                      {court.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{court.facility_name}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingCourt(court)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit court"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCourt(court.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete court"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Court Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sport Type:</span>
                    <span className="text-sm font-medium text-deep-navy">
                      {court.sport_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Surface:</span>
                    <span className="text-sm font-medium text-deep-navy">
                      {court.surface_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Size/Type:</span>
                    <span className="text-sm font-medium text-deep-navy">
                      {court.court_size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pricing:</span>
                    <span className="text-sm font-medium text-deep-navy flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />₹
                      {court.pricing_per_hour}/hour
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hours:</span>
                    <span className="text-sm font-medium text-deep-navy flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {court.operating_hours_start} -{" "}
                      {court.operating_hours_end}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      court.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {court.is_active ? "Active" : "Inactive"}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        (window.location.href = `/manage-bookings?court=${court.id}`)
                      }
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        (window.location.href = `/owner-slot-management?court=${court.id}`)
                      }
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
            fetchFacilities(); // Refresh facilities data for accurate counts
            setShowAddCourt(false);
            setEditingCourt(null);
          }}
        />
      )}
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
    facility_id: court?.facility_id || "",
    name: court?.name || "",
    sport_type: court?.sport_type || "Pickleball",
    surface_type: court?.surface_type || "Synthetic",
    court_size: court?.court_size || "Standard",
    pricing_per_hour: court?.pricing_per_hour || "",
    operating_hours_start: court?.operating_hours_start || "06:00",
    operating_hours_end: court?.operating_hours_end || "22:00",
    is_active: court?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const sportTypes = [
    "Pickleball",
    "Tennis",
    "Badminton",
    "Squash",
    "Table Tennis",
  ];
  const surfaceTypes = [
    "Synthetic",
    "Grass",
    "Clay",
    "Hard Court",
    "Wooden",
    "Concrete",
  ];
  const courtSizes = [
    "Standard",
    "Singles",
    "Doubles",
    "Mini",
    "Full Size",
    "Half Court",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getToken();
      const url = court
        ? `http://localhost:5000/api/courts/${court.id}`
        : "http://localhost:5000/api/courts/create";
      const method = court ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Court ${court ? "updated" : "created"} successfully!`);
        onSave();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${court ? "update" : "create"} court`);
      }
    } catch (error) {
      console.error("Error saving court:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-deep-navy">
            {court ? "Edit Court" : "Add New Court"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Facility *
            </label>
            <select
              value={formData.facility_id}
              onChange={(e) =>
                setFormData({ ...formData, facility_id: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              required
              aria-label="Select facility for court"
            >
              <option value="">Select Facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.location}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Court Name/Number *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                placeholder="e.g., Court A1, Court 1, Main Court"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Sport Type *
              </label>
              <select
                value={formData.sport_type}
                onChange={(e) =>
                  setFormData({ ...formData, sport_type: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                aria-label="Select sport type"
              >
                {sportTypes.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Surface Type *
              </label>
              <select
                value={formData.surface_type}
                onChange={(e) =>
                  setFormData({ ...formData, surface_type: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                aria-label="Select surface type"
              >
                {surfaceTypes.map((surface) => (
                  <option key={surface} value={surface}>
                    {surface}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Court Size/Type *
              </label>
              <select
                value={formData.court_size}
                onChange={(e) =>
                  setFormData({ ...formData, court_size: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                aria-label="Select court size"
              >
                {courtSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Pricing per Hour (₹) *
            </label>
            <input
              type="number"
              value={formData.pricing_per_hour}
              onChange={(e) =>
                setFormData({ ...formData, pricing_per_hour: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              required
              min="0"
              step="50"
              placeholder="e.g., 500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Opening Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours_start}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operating_hours_start: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                aria-label="Court opening time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Closing Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours_end}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operating_hours_end: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                required
                aria-label="Court closing time"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-ocean-teal focus:ring-ocean-teal border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-deep-navy"
            >
              Court is active and available for booking
            </label>
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
                  {court ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {court ? "Update Court" : "Create Court"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtManagement;
