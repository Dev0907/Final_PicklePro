import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Filter,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { SlotBookingModal } from "../components/SlotBookingModal";
import { getCurrentUser, getToken } from "../utils/auth";
import { showBookingSuccess } from "../utils/sweetAlert";

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports_supported: string[];
  amenities: string[];
  photos: string[];
  owner_name: string;
  court_count: number;
  active_courts: number;
  courts: Court[];
}

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  is_active: boolean;
  description?: string;
}

const BookSlot: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"venues" | "slots">("venues");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/facilities/all");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch facilities");
        return;
      }

      setFacilities(data.facilities || []);
      setFilteredFacilities(data.facilities || []);
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Filter facilities based on search and filters
  useEffect(() => {
    let filtered = facilities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sport filter
    if (selectedSport) {
      filtered = filtered.filter(
        (facility) =>
          facility.sports_supported.includes(selectedSport) ||
          facility.courts?.some((court) => court.sport_type === selectedSport)
      );
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((facility) =>
        facility.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredFacilities(filtered);
  }, [facilities, searchTerm, selectedSport, selectedLocation]);

  const handleBookSlot = (court: Court, facility: Facility) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("Please log in to book a slot");
      return;
    }
    setSelectedCourt(court);
    setSelectedFacility(facility);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (
    courtName: string,
    date: string,
    time: string
  ) => {
    setShowBookingModal(false);
    setSelectedCourt(null);
    setSelectedFacility(null);
    showBookingSuccess(courtName, date, time);
  };

  const uniqueSports = Array.from(
    new Set(
      facilities.flatMap((f) => [
        ...f.sports_supported,
        ...(f.courts?.map((c) => c.sport_type) || []),
      ])
    )
  );

  const uniqueLocations = Array.from(
    new Set(facilities.map((f) => f.location.split(",")[0].trim()))
  );

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Book a Court Slot
            </h1>
            <p className="text-gray-600">
              Find and book the perfect court for your game
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                />
              </div>

              {/* Sport Filter */}
              <div>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">All Sports</option>
                  {uniqueSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSport("");
                  setSelectedLocation("");
                }}
                className="px-4 py-2 text-ocean-teal border border-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading facilities...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchFacilities}
                className="bg-ocean-teal text-white px-6 py-2 rounded-lg hover:bg-ocean-teal/90"
              >
                Try Again
              </button>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No facilities found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredFacilities.map((facility) => (
                <div
                  key={facility.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Facility Images */}
                  <div className="relative h-48 bg-gray-200">
                    {facility.photos && facility.photos.length > 0 ? (
                      <img
                        src={facility.photos[0]}
                        alt={facility.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className={`${
                        facility.photos && facility.photos.length > 0
                          ? "hidden"
                          : ""
                      } absolute inset-0 flex items-center justify-center bg-gray-100`}
                    >
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-deep-navy">
                      {facility.active_courts} Court
                      {facility.active_courts !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Facility Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-deep-navy mb-2">
                        {facility.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {facility.location}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {facility.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Users className="h-4 w-4 mr-2" />
                        Managed by {facility.owner_name}
                      </div>
                    </div>

                    {/* Sports Supported */}
                    {facility.sports_supported &&
                      facility.sports_supported.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-deep-navy mb-2">
                            Sports Available:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {facility.sports_supported.map((sport, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-sky-mist text-deep-navy text-xs rounded-full"
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
                        <h4 className="text-sm font-medium text-deep-navy mb-2">
                          Amenities:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {facility.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-lemon-zest/20 text-deep-navy text-xs rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Courts */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-deep-navy mb-3">
                        Available Courts:
                      </h4>
                      <div className="space-y-3">
                        {facility.courts && facility.courts.length > 0 ? (
                          facility.courts.map((court) => (
                            <div
                              key={court.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-deep-navy">
                                    {court.name}
                                  </h5>
                                  <span className="px-2 py-1 bg-ocean-teal text-white text-xs rounded-full">
                                    {court.sport_type}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />₹
                                  {court.pricing_per_hour}/hour
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBookSlot(court, facility)}
                                className="px-4 py-2 bg-lemon-zest text-deep-navy rounded-lg font-medium hover:bg-lemon-zest/90 transition-colors"
                              >
                                Book Slot
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No courts available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCourt && selectedFacility && (
        <SlotBookingModal
          court={selectedCourt}
          facility={selectedFacility}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedCourt(null);
            setSelectedFacility(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default BookSlot;
