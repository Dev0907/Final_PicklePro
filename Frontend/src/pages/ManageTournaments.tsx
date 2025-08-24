import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Users, Trophy, Edit, Trash2, Plus, Eye, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { TournamentEditModal } from '../components/TournamentEditModal';
import { TournamentAnalytics } from '../components/TournamentAnalytics';
import { getToken } from '../utils/auth';
import { tournamentAlerts } from '../utils/sweetAlert';

interface Tournament {
  id: string;
  tournament_name: string;
  tournament_date: string;
  start_time: string;
  location: string;
  entry_fee: number;
  number_of_team: number;
  phone: string;
  created_at: string;
  registration_count?: number;
  total_revenue?: number;
  status?: string;
}

interface TournamentStats {
  total_tournaments: number;
  active_tournaments: number;
  total_registrations: number;
  total_revenue: number;
  avg_registrations_per_tournament: number;
}

export const ManageTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to view your tournaments');
        setLoading(false);
        return;
      }

      // Fetch tournaments created by owner
      const response = await fetch('http://localhost:5000/api/tournaments/owner/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch tournaments');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTournaments(data.tournaments || []);

      // Fetch tournament statistics
      await fetchTournamentStats();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTournamentStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/tournaments/owner/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleEditTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowEditModal(true);
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    const result = await tournamentAlerts.confirmDelete(tournament.tournament_name);
    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(tournament.id);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        tournamentAlerts.error(data.error || 'Failed to delete tournament');
        setActionLoading(null);
        return;
      }

      tournamentAlerts.deleted();
      fetchTournaments(); // Refresh tournaments
    } catch (error) {
      tournamentAlerts.error('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSuccess = () => {
    setShowEditModal(false);
    setSelectedTournament(null);
    fetchTournaments();
    tournamentAlerts.updated();
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy mb-2">Manage Tournaments</h1>
              <p className="text-gray-600">Create, manage, and track your tournament performance</p>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/create-tournament'}
                className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Tournament
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
                    <p className="text-2xl font-bold text-deep-navy">{stats.total_tournaments}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    {stats.active_tournaments} active
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {formatCurrency(stats.total_revenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">From registrations</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                    <p className="text-2xl font-bold text-deep-navy">{stats.total_registrations}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Teams registered</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Registrations</p>
                    <p className="text-2xl font-bold text-deep-navy">
                      {stats.avg_registrations_per_tournament.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Per tournament</span>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {showAnalytics && (
            <div className="mb-8">
              <TournamentAnalytics />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
              <button
                type="button"
                onClick={fetchTournaments}
                className="ml-2 text-red-800 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tournaments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tournaments created</h3>
              <p className="text-gray-500 mb-4">Create your first tournament to start managing registrations</p>
              <button 
                type="button"
                onClick={() => window.location.href = '/create-tournament'}
                className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
              >
                Create Tournament
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-1">
                        {tournament.tournament_name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {tournament.location}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {tournament.entry_fee === 0 ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-lemon-zest text-deep-navy px-3 py-1 rounded-full text-sm font-medium">
                          ₹{tournament.entry_fee}
                        </span>
                      )}
                      <span className={`mt-1 px-2 py-1 rounded text-xs ${
                        isUpcoming(tournament.tournament_date) 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUpcoming(tournament.tournament_date) ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-deep-navy">
                      <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
                      {formatDate(tournament.tournament_date)} at {tournament.start_time}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <Users className="h-4 w-4 mr-3 text-ocean-teal" />
                      Max {tournament.number_of_team} teams
                      {tournament.registration_count !== undefined && (
                        <span className="ml-2 text-gray-500">
                          ({tournament.registration_count} registered)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Revenue Info */}
                  {tournament.total_revenue !== undefined && (
                    <div className="bg-sky-mist rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-deep-navy">Revenue Generated:</span>
                        <span className="text-lg font-bold text-deep-navy">
                          {formatCurrency(tournament.total_revenue)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(tournament.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => window.location.href = `/tournament-registrations/${tournament.id}`}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                        title="View registrations"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      {isUpcoming(tournament.tournament_date) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditTournament(tournament)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                            title="Edit tournament"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTournament(tournament)}
                            disabled={actionLoading === tournament.id}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center disabled:opacity-50"
                            title="Delete tournament"
                          >
                            {actionLoading === tournament.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-1"></div>
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Edit Tournament Modal */}
      {showEditModal && selectedTournament && (
        <TournamentEditModal
          tournament={selectedTournament}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTournament(null);
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};