import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, MapPin, Users, Filter, Trophy, RefreshCw, Check } from 'lucide-react';
import { Tournament } from '../types';
import { Sidebar } from '../components/Sidebar';
import { TournamentRegistrationForm } from '../components/TournamentRegistrationForm';
import { getCurrentUser, getToken } from '../utils/auth';
import { showTournamentJoined } from '../utils/sweetAlert';

const JoinTournament: React.FC = () => {
  const [filters, setFilters] = useState({
    fee: '',
    date: '',
    level: ''
  });

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registeredTournaments, setRegisteredTournaments] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournaments = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/tournaments/all');
      let data: any = null;
      try {
        data = await res.json();
      } catch (_) {
        // Non-JSON response (e.g., 404 HTML) – handle gracefully
      }
      if (!res.ok) {
        setError((data && data.error) || `Failed to fetch tournaments (status ${res.status})`);
        return;
      }
      setTournaments((data && data.tournaments) || []);
    } catch (err) {
      setError('Network error');
    }
  }, []);

  const fetchUserRegistrations = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setRegisteredTournaments([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/tournaments/user/registered', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegisteredTournaments(data.tournamentIds.map(String));
      } else {
        console.error('Failed to fetch user registrations:', response.status);
        setRegisteredTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      setRegisteredTournaments([]);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchTournaments();
      
      const currentUser = getCurrentUser();
      if (currentUser) {
        await fetchUserRegistrations();
      }
      
      setLoading(false);
    };

    loadInitialData();
    
    // Auto-refresh every 60 seconds to keep tournament data current
    const interval = setInterval(async () => {
      await fetchTournaments();
      const currentUser = getCurrentUser();
      if (currentUser) {
        await fetchUserRegistrations();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchTournaments, fetchUserRegistrations]);

  const handleJoinTournament = (tournament: Tournament) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Please log in to register for tournaments');
      return;
    }
    setSelectedTournament(tournament);
    setShowRegistrationForm(true);
  };

  const handleRegistrationSuccess = useCallback(async () => {
    // Add tournament to registered list immediately for better UX
    if (selectedTournament) {
      setRegisteredTournaments(prev => [...prev, selectedTournament.id]);
      await showTournamentJoined(selectedTournament.name);
    }
    // Refresh user registrations to get updated data from server
    await fetchUserRegistrations();
    // Close the registration form
    setShowRegistrationForm(false);
    setSelectedTournament(null);
  }, [selectedTournament, fetchUserRegistrations]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      return (
        (filters.fee === '' || 
          (filters.fee === 'free' && tournament.fee === 0) ||
          (filters.fee === 'paid' && tournament.fee > 0)) &&
        (filters.date === '' || tournament.date === filters.date)
      );
    });
  }, [tournaments, filters]);

  return (
    <div className="min-h-screen bg-[#FFFFF7]">
      <Sidebar />
      <div className="ml-64 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-[#1E1F26]">
                Join a Tournament
              </h1>
              <button
                type="button"
                onClick={async () => {
                  setRefreshing(true);
                  await fetchUserRegistrations();
                  await fetchTournaments();
                  setRefreshing(false);
                }}
                disabled={refreshing}
                className="p-2 text-ocean-teal hover:text-ocean-teal/80 hover:bg-ocean-teal/10 rounded-lg transition-all disabled:opacity-50"
                title="Refresh tournaments and registration status"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-gray-600">
              Compete in exciting tournaments and win amazing prizes
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-ocean-teal mr-2" />
              <h2 className="text-lg font-semibold text-deep-navy">Filter Tournaments</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Entry Fee
                </label>
                <select
                  value={filters.fee}
                  onChange={(e) => setFilters({ ...filters, fee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  aria-label="Filter by entry fee"
                >
                  <option value="">All Tournaments</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  aria-label="Filter by tournament date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  aria-label="Filter by skill level"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center text-gray-500 py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
                <p>Loading tournaments...</p>
              </div>
            ) : error ? (
              <div className="col-span-2 text-center text-red-500 py-12">
                <p className="mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    fetchTournaments();
                  }}
                  className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90"
                >
                  Try Again
                </button>
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tournaments found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later for new tournaments</p>
              </div>
            ) : (
              filteredTournaments.map((tournament) => (
                <div key={tournament.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  registeredTournaments.includes(tournament.id) ? 'ring-2 ring-green-300 bg-green-50' : ''
                }`}>
                  <div className="p-6">
                    {registeredTournaments.includes(tournament.id) && (
                      <div className="mb-4 flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 py-3 px-4 rounded-lg border border-green-300 shadow-sm">
                        <Trophy className="h-5 w-5 mr-2 text-green-600" />
                        <span className="font-semibold text-green-800">✓ You're registered for this tournament!</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-deep-navy mb-2">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {tournament.description || ' '}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        {tournament.fee === 0 ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            FREE
                          </span>
                        ) : (
                          <span className="bg-lemon-zest text-deep-navy px-3 py-1 rounded-full text-sm font-medium">
                            ₹{tournament.fee}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-deep-navy">
                        <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
                        {new Date(tournament.date).toLocaleDateString()} at {tournament.time}
                      </div>
                      <div className="flex items-center text-sm text-deep-navy">
                        <MapPin className="h-4 w-4 mr-3 text-ocean-teal" />
                        {tournament.location}
                      </div>
                      <div className="flex items-center text-sm text-deep-navy">
                        <Users className="h-4 w-4 mr-3 text-ocean-teal" />
                        Max {tournament.maxTeams} teams
                      </div>
                      <div className="flex items-center text-sm text-deep-navy">
                        <Trophy className="h-4 w-4 mr-3 text-ocean-teal" />
                        Organized by {tournament.organizer}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Contact: {tournament.organizerContact}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinTournament(tournament)}
                          disabled={registeredTournaments.includes(tournament.id)}
                          className={`px-6 py-2 rounded-lg font-semibold transition-all transform ${
                            registeredTournaments.includes(tournament.id)
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-400 cursor-not-allowed shadow-inner'
                              : 'bg-lemon-zest text-deep-navy hover:bg-lemon-zest/90 hover:scale-[1.02] shadow-md hover:shadow-lg'
                          }`}
                        >
                          {registeredTournaments.includes(tournament.id) ? (
                            <span className="flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              Already Joined
                            </span>
                          ) : (
                            'Join Tournament'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && selectedTournament && (
        <TournamentRegistrationForm
          tournament={selectedTournament}
          onClose={() => {
            setShowRegistrationForm(false);
            setSelectedTournament(null);
          }}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default JoinTournament;