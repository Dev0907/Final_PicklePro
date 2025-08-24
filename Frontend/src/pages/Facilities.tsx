import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, DollarSign, Search, Filter, Star } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

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
}

const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');

  const fetchFacilities = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/facilities/all');
      const data = await response.json();
      
      if (response.ok) {
        setFacilities(data.facilities);
        setFilteredFacilities(data.facilities);
      } else {
        setError(data.error || 'Failed to fetch facilities');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    let filtered = facilities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by sport
    if (selectedSport) {
      filtered = filtered.filter(facility =>
        facility.sports_supported.includes(selectedSport)
      );
    }

    setFilteredFacilities(filtered);
  }, [facilities, searchTerm, selectedSport]);

  const allSports = Array.from(
    new Set(facilities.flatMap(facility => facility.sports_supported))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-whisper">
        <Sidebar />
        <div className="ml-64 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p>Loading facilities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Book Sports Facilities
            </h1>
            <p className="text-gray-600">
              Find and book the perfect court for your game
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search facilities by name, location, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent appearance-none"
                  >
                    <option value="">All Sports</option>
                    {allSports.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Facilities Grid */}
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchFacilities}
                className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90"
              >
                Try Again
              </button>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No facilities found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFacilities.map((facility) => (
                <div key={facility.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Facility Image */}
                  <div className="h-48 bg-gradient-to-r from-ocean-teal to-sky-mist relative">
                    {facility.photos.length > 0 ? (
                      <img
                        src={facility.photos[0]}
                        alt={facility.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Users className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white bg-opacity-90 text-deep-navy px-2 py-1 rounded-full text-xs font-medium">
                        {facility.active_courts} Courts
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-deep-navy mb-2">
                        {facility.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{facility.location}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {facility.description}
                      </p>
                    </div>

                    {/* Sports Supported */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {facility.sports_supported.slice(0, 3).map((sport) => (
                          <span
                            key={sport}
                            className="bg-sky-mist text-deep-navy px-2 py-1 rounded text-xs font-medium"
                          >
                            {sport}
                          </span>
                        ))}
                        {facility.sports_supported.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{facility.sports_supported.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    {facility.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {facility.amenities.slice(0, 2).map((amenity) => (
                            <span
                              key={amenity}
                              className="bg-lemon-zest bg-opacity-20 text-deep-navy px-2 py-1 rounded text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {facility.amenities.length > 2 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              +{facility.amenities.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Owner Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>Managed by {facility.owner_name}</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>4.5</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/facility/${facility.id}`}
                      className="block w-full bg-ocean-teal text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
                    >
                      View Courts & Book
                    </Link>
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

export default Facilities;