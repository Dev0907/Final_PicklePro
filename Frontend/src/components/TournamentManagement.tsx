import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Eye,
  X,
  Save,
  Bell
} from 'lucide-react';

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_date: string;
  start_time: string;
  location: string;
  entry_fee: number;
  number_of_team: number;
  phone: string;
  registration_count?: number;
  total_revenue?: number;
}

interface TournamentRegistration {
  id: number;
  tournament_id: number;
  user_id: number;
  team_name: string;
  player1_name: string;
  player1_phone: string;
  player2_name?: string;
  player2_phone?: string;
  registration_date: string;
  registered_by_name: string;
  registered_by_email: string;
}

const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [viewingRegistrations, setViewingRegistrations] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tournaments/owner', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (tournamentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const deleteTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to delete this tournament? All registrations will be lost.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTournaments(tournaments.filter(tournament => tournament.id !== tournamentId));
        // Send notification to registered users about tournament cancellation
        await sendTournamentNotification(
          tournamentId,
          'tournament_cancelled',
          'Tournament Cancelled',
          'A tournament you registered for has been cancelled. You will receive a full refund.'
        );
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const sendTournamentNotification = async (
    tournamentId: number,
    type: string,
    title: string,
    message: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/tournament-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournament_id: tournamentId,
          type,
          title,
          message
        })
      });
    } catch (error) {
      console.error('Error sending tournament notification:', error);
    }
  };

  const viewRegistrations = (tournament: Tournament) => {
    setViewingRegistrations(tournament);
    fetchRegistrations(tournament.id);
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
          <h2 className="text-2xl font-bold text-gray-900">Tournament Management</h2>
          <p className="text-gray-600">Create and manage your tournaments</p>
        </div>
        <button
          onClick={() => setShowAddTournament(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Tournament
        </button>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">
                {tournaments.filter(t => new Date(t.tournament_date) > new Date()).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">
                {tournaments.reduce((sum, t) => sum + (t.registration_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{tournaments.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Tournaments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tournament Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teams
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
              {tournaments.map((tournament) => {
                const isUpcoming = new Date(tournament.tournament_date) > new Date();
                const fillRate = tournament.number_of_team > 0 
                  ? ((tournament.registration_count || 0) / tournament.number_of_team) * 100 
                  : 0;

                return (
                  <tr key={tournament.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tournament.tournament_name}</div>
                        <div className="text-sm text-gray-500">Max {tournament.number_of_team} teams</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(tournament.tournament_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{tournament.start_time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {tournament.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ₹{tournament.entry_fee}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {tournament.registration_count || 0} / {tournament.number_of_team}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isUpcoming 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUpcoming ? 'Upcoming' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewRegistrations(tournament)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Registrations"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTournament(tournament)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Tournament"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTournament(tournament.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Tournament"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Tournament Modal */}
      {(showAddTournament || editingTournament) && (
        <TournamentModal
          tournament={editingTournament}
          onClose={() => {
            setShowAddTournament(false);
            setEditingTournament(null);
          }}
          onSave={() => {
            fetchTournaments();
            setShowAddTournament(false);
            setEditingTournament(null);
          }}
        />
      )}

      {/* Registrations Modal */}
      {viewingRegistrations && (
        <RegistrationsModal
          tournament={viewingRegistrations}
          registrations={registrations}
          onClose={() => setViewingRegistrations(null)}
        />
      )}
    </div>
  );
};

// Tournament Modal Component
const TournamentModal: React.FC<{
  tournament: Tournament | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ tournament, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tournament_name: tournament?.tournament_name || '',
    tournament_date: tournament?.tournament_date || '',
    start_time: tournament?.start_time || '',
    location: tournament?.location || '',
    entry_fee: tournament?.entry_fee || '',
    number_of_team: tournament?.number_of_team || '',
    phone: tournament?.phone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = tournament ? `/api/tournaments/${tournament.id}` : '/api/tournaments';
      const method = tournament ? 'PUT' : 'POST';

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
        
        // Send notification about tournament creation/update
        if (!tournament) {
          // New tournament - notify all users
          await fetch('/api/notifications/bulk-create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'tournament_created',
              title: 'New Tournament Available!',
              message: `New tournament "${formData.tournament_name}" is now open for registration. Entry fee: ₹${formData.entry_fee}`,
              send_to_all: true
            })
          });
        } else {
          // Updated tournament - notify registered users
          await fetch('/api/notifications/tournament-update', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tournament_id: tournament.id,
              type: 'tournament_updated',
              title: 'Tournament Updated',
              message: `Tournament "${formData.tournament_name}" details have been updated. Please check the latest information.`
            })
          });
        }
      }
    } catch (error) {
      console.error('Error saving tournament:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {tournament ? 'Edit Tournament' : 'Create New Tournament'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={formData.tournament_name}
              onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.tournament_date}
                onChange={(e) => setFormData({ ...formData, tournament_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Teams
              </label>
              <input
                type="number"
                value={formData.number_of_team}
                onChange={(e) => setFormData({ ...formData, number_of_team: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
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
              {tournament ? 'Update' : 'Create'} Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Registrations Modal Component
const RegistrationsModal: React.FC<{
  tournament: Tournament;
  registrations: TournamentRegistration[];
  onClose: () => void;
}> = ({ tournament, registrations, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">{tournament.tournament_name} - Registrations</h3>
            <p className="text-gray-600">{registrations.length} teams registered</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{registration.team_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{registration.player1_name}</div>
                      <div className="text-sm text-gray-500">{registration.player1_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{registration.player2_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{registration.player2_phone || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{registration.registered_by_name}</div>
                      <div className="text-sm text-gray-500">{registration.registered_by_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(registration.registration_date).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentManagement;