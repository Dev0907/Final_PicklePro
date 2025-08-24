import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, DollarSign, TrendingUp, MapPin, PieChart, BarChart3, Activity, Bell, Plus, Settings, Eye, Clock } from 'lucide-react';
import { getCurrentUser, getToken } from '../utils/auth';
import { Tournament } from '../types';


interface DashboardStats {
  totalRevenue: number;
  totalRegistrations: number;
  activeTournaments: number;
  avgRegistrationsPerTournament: number;
  totalBookings: number;
  totalFacilities: number;
}

interface TournamentWithRegistrations extends Tournament {
  registrationCount: number;
}

interface Booking {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  user_name: string;
  court_name: string;
}

const OwnerDashboard: React.FC = () => {
  const user = getCurrentUser();
  const token = getToken();
  const [tournaments, setTournaments] = useState<TournamentWithRegistrations[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalRegistrations: 0,
    activeTournaments: 0,
    avgRegistrationsPerTournament: 0,
    totalBookings: 0,
    totalFacilities: 0
  });



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch tournaments
        const tournamentsResponse = await fetch('http://localhost:5000/api/tournaments/all');
        const tournamentsData = await tournamentsResponse.json();
        
        // Fetch facilities count
        let facilitiesCount = 0;
        if (token) {
          try {
            const facilitiesResponse = await fetch('http://localhost:5000/api/facilities/owner/facilities', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const facilitiesData = await facilitiesResponse.json();
            if (facilitiesResponse.ok) {
              facilitiesCount = facilitiesData.facilities?.length || 0;
            }
          } catch (error) {
            console.error('Error fetching facilities:', error);
          }
        }

        // Fetch bookings for owner's facilities
        let ownerBookings: Booking[] = [];
        let bookingsCount = 0;
        if (token && facilitiesCount > 0) {
          try {
            const facilitiesResponse = await fetch('http://localhost:5000/api/facilities/owner/facilities', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const facilitiesData = await facilitiesResponse.json();
            
            if (facilitiesResponse.ok && facilitiesData.facilities?.length > 0) {
              // Fetch bookings for each facility
              for (const facility of facilitiesData.facilities) {
                try {
                  const bookingsResponse = await fetch(`http://localhost:5000/api/bookings/facility/${facility.id}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json();
                    ownerBookings = [...ownerBookings, ...(bookingsData.bookings || [])];
                  }
                } catch (error) {
                  console.error(`Error fetching bookings for facility ${facility.id}:`, error);
                }
              }
              bookingsCount = ownerBookings.length;
              setBookings(ownerBookings.slice(0, 5)); // Show latest 5 bookings
            }
          } catch (error) {
            console.error('Error fetching bookings:', error);
          }
        }
        
        if (tournamentsResponse.ok) {
          const tournamentsWithRegistrations = await Promise.all(
            (tournamentsData.tournaments || []).map(async (tournament: Tournament) => {
              try {
                const registrationsResponse = await fetch(
                  `http://localhost:5000/api/tournaments/${tournament.id}/registrations`
                );
                const registrationsData = await registrationsResponse.json();
                const registrationCount = registrationsData.registrations?.length || 0;
                
                return {
                  ...tournament,
                  registrationCount
                };
              } catch (error) {
                return {
                  ...tournament,
                  registrationCount: 0
                };
              }
            })
          );

          setTournaments(tournamentsWithRegistrations);

          // Calculate comprehensive stats
          const totalRegistrations = tournamentsWithRegistrations.reduce(
            (sum, t) => sum + t.registrationCount, 0
          );
          const tournamentRevenue = tournamentsWithRegistrations.reduce(
            (sum, t) => sum + (parseFloat(t.fee || 0) * parseInt(t.registrationCount || 0)), 0
          );
          const bookingRevenue = ownerBookings.reduce(
            (sum, b) => sum + (b.total_amount || 0), 0
          );
          const totalRevenue = tournamentRevenue + bookingRevenue;
          const activeTournaments = tournamentsWithRegistrations.length;
          const avgRegistrationsPerTournament = activeTournaments > 0 
            ? Math.round(totalRegistrations / activeTournaments) 
            : 0;

          setStats({
            totalRevenue,
            totalRegistrations,
            activeTournaments,
            avgRegistrationsPerTournament,
            totalBookings: bookingsCount,
            totalFacilities: facilitiesCount
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const dashboardStats = [
    { 
      label: "My Facilities", 
      value: stats.totalFacilities.toString(), 
      icon: <MapPin className="h-6 w-6" />, 
      color: "text-ocean-teal",
      link: "/manage-facilities"
    },
    { 
      label: "Total Revenue", 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: <DollarSign className="h-6 w-6" />, 
      color: "text-sky-mist",
      link: null
    },
    { 
      label: "Active Tournaments", 
      value: stats.activeTournaments.toString(), 
      icon: <Trophy className="h-6 w-6" />, 
      color: "text-deep-navy",
      link: "/manage-tournaments"
    }
  ];

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your club, tournaments, and community all in one place.
          </p>
        </div>

        {/* Quick Actions - Owner Focus */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/manage-facilities"
            className="flex items-center bg-ocean-teal text-ivory-whisper px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-semibold">Add Facility</h3>
              <p className="text-sm opacity-90">Create new venue with details</p>
            </div>
          </Link>
          
          <Link
            to="/court-management"
            className="flex items-center bg-lemon-zest text-deep-navy px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-semibold">Add Court</h3>
              <p className="text-sm opacity-90">Add courts to your facilities</p>
            </div>
          </Link>
          
          <Link
            to="/owner-slot-management"
            className="flex items-center bg-sky-mist text-deep-navy px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Clock className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-semibold">Manage Slots</h3>
              <p className="text-sm opacity-90">Enable/disable time slots</p>
            </div>
          </Link>
          
          <Link
            to="/create-tournament"
            className="flex items-center bg-ocean-teal text-ivory-whisper px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Trophy className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-semibold">Create Tournament</h3>
              <p className="text-sm opacity-90">Organize tournaments</p>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              {stat.link ? (
                <Link to={stat.link} className="block">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>{stat.icon}</div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-deep-navy mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Link>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-deep-navy mb-2 text-center">{stat.value}</div>
                  <div className="text-sm text-gray-600 text-center">{stat.label}</div>
                </>
              )}
            </div>
          ))}
        </div>





        {/* Tournament Management Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Trophy className="h-6 w-6 mr-2 text-lemon-zest" />
                  Tournament Management
                </h3>
                <p className="text-gray-600 text-sm">Create, manage, and track your tournaments</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/create-tournament"
                  className="bg-lemon-zest text-deep-navy px-4 py-2 rounded-lg hover:bg-deep-navy hover:text-lemon-zest flex items-center text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Link>
                <Link
                  to="/manage-tournaments"
                  className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90 flex items-center text-sm font-medium transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage All
                </Link>
              </div>
            </div>

            {/* Tournament Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-lemon-zest/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-deep-navy mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.activeTournaments}</p>
                    <p className="text-sm text-gray-600">Active Tournaments</p>
                  </div>
                </div>
              </div>
              <div className="bg-ocean-teal/10 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-ocean-teal mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.totalRegistrations}</p>
                    <p className="text-sm text-gray-600">Total Registrations</p>
                  </div>
                </div>
              </div>
              <div className="bg-sky-mist/10 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-sky-mist mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.avgRegistrationsPerTournament}</p>
                    <p className="text-sm text-gray-600">Avg per Tournament</p>
                  </div>
                </div>
              </div>
              <div className="bg-deep-navy/10 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-deep-navy mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-deep-navy">
                      ₹{tournaments.reduce((sum, t) => sum + (parseFloat(t.fee || 0) * parseInt(t.registrationCount || 0)), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Tournament Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tournaments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tournament</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Registrations</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-teal mx-auto"></div>
                        <p className="mt-2">Loading tournaments...</p>
                      </td>
                    </tr>
                  ) : tournaments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="mb-2">No tournaments created yet</p>
                        <Link
                          to="/create-tournament"
                          className="text-ocean-teal hover:text-ocean-teal/80 font-medium"
                        >
                          Create your first tournament
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    tournaments.slice(0, 5).map((tournament) => {
                      const isUpcoming = new Date(tournament.date) > new Date();
                      const revenue = tournament.fee * tournament.registrationCount;
                      const fillPercentage = tournament.maxTeams > 0 
                        ? Math.round((tournament.registrationCount / tournament.maxTeams) * 100) 
                        : 0;

                      return (
                        <tr key={tournament.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-deep-navy">{tournament.name}</p>
                              <p className="text-sm text-gray-500">{tournament.location}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{new Date(tournament.date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{tournament.time}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {tournament.registrationCount}/{tournament.maxTeams}
                              </p>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`bg-ocean-teal h-1.5 rounded-full transition-all duration-300 ${
                                    fillPercentage >= 100 ? 'w-full' : 
                                    fillPercentage >= 75 ? 'w-3/4' : 
                                    fillPercentage >= 50 ? 'w-1/2' : 
                                    fillPercentage >= 25 ? 'w-1/4' : 'w-1/12'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-gray-900">₹{revenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">₹{tournament.fee} per team</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isUpcoming 
                                ? 'bg-lemon-zest/20 text-deep-navy' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isUpcoming ? 'Upcoming' : 'Completed'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Link
                                to={`/tournament-registrations/${tournament.id}`}
                                className="text-ocean-teal hover:text-deep-navy text-sm font-medium"
                                title="View Registrations"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                to="/manage-tournaments"
                                className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
                                title="Manage Tournament"
                              >
                                <Settings className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {tournaments.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to="/manage-tournaments"
                  className="text-ocean-teal hover:text-ocean-teal/80 font-medium text-sm"
                >
                  View all {tournaments.length} tournaments →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-deep-navy">Recent Bookings</h3>
              <Link
                to="/manage-bookings"
                className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No bookings yet</p>
                  <Link
                    to="/owner-slot-management"
                    className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
                  >
                    Enable slots to get bookings
                  </Link>
                </div>
              ) : (
                bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-deep-navy">{booking.user_name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'booked' ? 'bg-lemon-zest/20 text-deep-navy' : 
                        booking.status === 'completed' ? 'bg-ocean-teal/20 text-deep-navy' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {new Date(booking.booking_date).toLocaleDateString()}</p>
                      <p>🕒 {booking.start_time} - {booking.end_time}</p>
                      <p>🏸 {booking.court_name}</p>
                      <p>💰 ₹{booking.total_amount}</p>
                    </div>
                  </div>
                ))
              )}
              {bookings.length > 3 && (
                <Link
                  to="/manage-bookings"
                  className="block text-center text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium py-2"
                >
                  View all bookings
                </Link>
              )}
            </div>
          </div>

          {/* Active Tournaments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-deep-navy">Active Tournaments</h3>
              <Link
                to="/create-tournament"
                className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
              >
                Create New
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading tournaments...</div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No tournaments created yet</p>
                  <Link
                    to="/create-tournament"
                    className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
                  >
                    Create your first tournament
                  </Link>
                </div>
              ) : (
                tournaments.map((tournament) => (
                  <div key={tournament.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-deep-navy">{tournament.name}</h4>
                      <span className="bg-lemon-zest text-deep-navy px-2 py-1 rounded text-xs font-medium">
                        {tournament.fee === 0 ? 'FREE' : `₹${tournament.fee}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div>
                        <span>{new Date(tournament.date).toLocaleDateString()}</span>
                        <span className="ml-4">{tournament.registrationCount}/{tournament.maxTeams} teams</span>
                      </div>
                      <Link
                        to={`/tournament-registrations/${tournament.id}`}
                        className="text-ocean-teal hover:text-ocean-teal/80 text-xs font-medium bg-sky-mist px-2 py-1 rounded transition-colors"
                      >
                        View Entries ({tournament.registrationCount})
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>




      </div>
    </div>
  );
};

export default OwnerDashboard;