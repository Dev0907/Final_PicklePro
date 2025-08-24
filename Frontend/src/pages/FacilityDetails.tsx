import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, Users, Star, Calendar, Phone } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

interface Court {
  id: string;
  name: string;
  sport_type: string;
  pricing_per_hour: number;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports_supported: string[];
  amenities: string[];
  photos: string[];
  owner_name: string;
  owner_phone: string;
  courts: Court[];
}

const FacilityDetails: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFacilityDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/facilities/${facilityId}`);
      const data = await response.json();
      
      if (response.ok) {
        setFacility(data.facility);
      } else {
        setError(data.error || 'Failed to fetch facility details');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchFacilityDetails();
  }, [fetchFacilityDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-whisper">
        <Sidebar />
        <div className="ml-64 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p>Loading facility details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-ivory-whisper">
        <Sidebar />
        <div className="ml-64 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error || 'Facility not found'}</p>
              <button
                type="button"
                onClick={() => navigate('/facilities')}
                className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90"
              >
                Back to Facilities
              </button>
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
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate('/facilities')}
              className="flex items-center text-ocean-teal hover:text-ocean-teal/80 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Facilities
            </button>
          </div>

          {/* Facility Info */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            {/* Hero Image */}
            <div className="h-64 bg-gradient-to-r from-ocean-teal to-sky-mist relative">
              {facility.photos.length > 0 ? (
                <img
                  src={facility.photos[0]}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Users className="h-24 w-24 text-white opacity-50" />
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="font-medium">4.5</span>
                  <span className="text-sm ml-2">(24 reviews)</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h1 className="text-3xl font-bold text-deep-navy mb-4">{facility.name}</h1>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{facility.location}</span>
                  </div>

                  <p className="text-gray-700 mb-6">{facility.description}</p>

                  {/* Sports Supported */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-deep-navy mb-3">Sports Available</h3>
                    <div className="flex flex-wrap gap-2">
                      {facility.sports_supported.map((sport) => (
                        <span
                          key={sport}
                          className="bg-sky-mist text-deep-navy px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  {facility.amenities.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-deep-navy mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {facility.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="bg-lemon-zest bg-opacity-20 text-deep-navy px-3 py-1 rounded-full text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="bg-sky-mist rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-navy mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-ocean-teal mr-3" />
                      <div>
                        <p className="font-medium text-deep-navy">Managed by</p>
                        <p className="text-sm text-gray-600">{facility.owner_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-ocean-teal mr-3" />
                      <div>
                        <p className="font-medium text-deep-navy">Phone</p>
                        <p className="text-sm text-gray-600">{facility.owner_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-ocean-teal mr-3" />
                      <div>
                        <p className="font-medium text-deep-navy">Location</p>
                        <p className="text-sm text-gray-600">{facility.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-deep-navy mb-6">Available Courts</h2>
            
            {facility.courts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No courts available</h3>
                <p className="text-gray-500">This facility hasn't added any courts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facility.courts.filter(court => court.is_active).map((court) => (
                  <div key={court.id} className="border border-gray-200 rounded-lg p-6 hover:border-ocean-teal transition-colors">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-deep-navy mb-2">{court.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{court.sport_type}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Operating Hours</span>
                        </div>
                        <span className="font-medium text-deep-navy">
                          {court.operating_hours_start} - {court.operating_hours_end}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>Price per Hour</span>
                        </div>
                        <span className="font-bold text-ocean-teal text-lg">
                          ₹{court.pricing_per_hour}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/book-court/${court.id}`}
                      className="block w-full bg-ocean-teal text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
                    >
                      Book This Court
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          {facility.photos.length > 1 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-deep-navy mb-6">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {facility.photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`${facility.name} - Photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityDetails;