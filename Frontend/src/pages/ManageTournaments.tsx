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
    <div className="min-h-screen bg-gradient-to-br from-[#FEFFFD] via-[#E6FD53]/5 to-[#FEFFFD] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/70 p-3 rounded-full shadow-lg mr-4">
                  <Trophy className="h-8 w-8 text-[#1B263F]" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1B263F] to-[#204F56] bg-clip-text text-transparent">
                  Manage Tournaments
                </h1>
              </div>
              <p className="text-[#1B263F]/70 text-lg font-medium ml-16">Create, manage, and track your tournament performance</p>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-6 py-3 bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] rounded-xl hover:from-[#1B263F] hover:to-[#204F56] transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/create-tournament'}
                className="px-6 py-3 bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/80 text-[#1B263F] rounded-xl hover:from-[#E6FD53]/90 hover:to-[#E6FD53]/70 transition-all duration-300 flex items-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Tournament
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 border-2 border-[#E6FD53]/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1B263F]/70">Total Tournaments</p>
                    <p className="text-3xl font-bold text-[#1B263F]">{stats.total_tournaments}</p>
                  </div>
                  <div className="p-3 bg-[#E6FD53]/30 rounded-full shadow-lg">
                    <Trophy className="h-6 w-6 text-[#204F56]" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-[#204F56] font-semibold bg-[#E6FD53]/20 px-2 py-1 rounded-full">
                    {stats.active_tournaments} active
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 border-2 border-[#E6FD53]/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1B263F]/70">Total Revenue</p>
                    <p className="text-3xl font-bold text-[#1B263F]">
                      {formatCurrency(stats.total_revenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#E6FD53]/30 rounded-full shadow-lg">
                    <DollarSign className="h-6 w-6 text-[#204F56]" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-[#1B263F]/60 font-medium">From registrations</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 border-2 border-[#E6FD53]/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1B263F]/70">Total Registrations</p>
                    <p className="text-3xl font-bold text-[#1B263F]">{stats.total_registrations}</p>
                  </div>
                  <div className="p-3 bg-[#E6FD53]/30 rounded-full shadow-lg">
                    <Users className="h-6 w-6 text-[#204F56]" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-[#1B263F]/60 font-medium">Teams registered</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 border-2 border-[#E6FD53]/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1B263F]/70">Avg Registrations</p>
                    <p className="text-3xl font-bold text-[#1B263F]">
                      {stats.avg_registrations_per_tournament.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#E6FD53]/30 rounded-full shadow-lg">
                    <TrendingUp className="h-6 w-6 text-[#204F56]" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-[#1B263F]/60 font-medium">Per tournament</span>
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
                <div key={tournament.id} className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-[#E6FD53]/30 hover:border-[#204F56]/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#1B263F] mb-2">
                        {tournament.tournament_name}
                      </h3>
                      <div className="flex items-center text-[#204F56] font-medium mb-2">
                        <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-2">
                          <MapPin className="h-4 w-4 text-[#204F56]" />
                        </div>
                        {tournament.location}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {tournament.entry_fee === 0 ? (
                        <span className="bg-[#E6FD53] text-[#1B263F] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          ₹{tournament.entry_fee}
                        </span>
                      )}
                      <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        isUpcoming(tournament.tournament_date) 
                          ? 'bg-[#E6FD53]/30 text-[#204F56] border border-[#204F56]/30' 
                          : 'bg-gray-200 text-gray-700 border border-gray-300'
                      }`}>
                        {isUpcoming(tournament.tournament_date) ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <Calendar className="h-4 w-4 text-[#204F56]" />
                      </div>
                      {formatDate(tournament.tournament_date)} at {tournament.start_time}
                    </div>
                    <div className="flex items-center text-sm text-[#1B263F] font-medium">
                      <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                        <Users className="h-4 w-4 text-[#204F56]" />
                      </div>
                      Max {tournament.number_of_team} teams
                      {tournament.registration_count !== undefined && (
                        <span className="ml-2 text-[#204F56] bg-[#E6FD53]/20 px-2 py-1 rounded-full text-xs font-semibold">
                          {tournament.registration_count} registered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Revenue Info */}
                  {tournament.total_revenue !== undefined && (
                    <div className="bg-gradient-to-r from-[#E6FD53]/20 to-[#E6FD53]/10 rounded-xl p-4 mb-4 border border-[#E6FD53]/40">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-[#1B263F]">Revenue Generated:</span>
                        <span className="text-lg font-bold text-[#204F56]">
                          {formatCurrency(tournament.total_revenue)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t-2 border-[#E6FD53]/30">
                    <div className="text-xs text-[#1B263F]/60 font-medium">
                      Created: {new Date(tournament.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => window.location.href = `/tournament-registrations/${tournament.id}`}
                        className="px-3 py-2 text-xs bg-[#E6FD53]/30 text-[#204F56] rounded-lg hover:bg-[#E6FD53]/50 transition-all duration-200 flex items-center font-semibold shadow-sm hover:shadow-md"
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
                            className="px-3 py-2 text-xs bg-gradient-to-r from-[#204F56]/20 to-[#1B263F]/20 text-[#204F56] rounded-lg hover:from-[#204F56]/30 hover:to-[#1B263F]/30 transition-all duration-200 flex items-center font-semibold shadow-sm hover:shadow-md"
                            title="Edit tournament"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTournament(tournament)}
                            disabled={actionLoading === tournament.id}
                            className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center disabled:opacity-50 font-semibold shadow-sm hover:shadow-md"
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