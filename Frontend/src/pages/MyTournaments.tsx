import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Users, Trophy, Edit, Trash2, AlertTriangle, Phone, User } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getToken } from '../utils/auth';

interface TournamentRegistration {
  id: string;
  tournament_id: string;
  team_name: string;
  player1_name: string;
  player1_phone: string;
  player2_name?: string;
  player2_phone?: string;
  registration_date: string;
  tournament_name: string;
  tournament_date: string;
  start_time: string;
  location: string;
  entry_fee: number;
  organizer: string;
  organizerContact: string;
}

export const MyTournaments: React.FC = () => {
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<TournamentRegistration | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    team_name: '',
    player1_name: '',
    player1_phone: '',
    player2_name: '',
    player2_phone: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMyTournaments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to view your tournaments');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/tournaments/user/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch tournament registrations');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTournaments();
  }, [fetchMyTournaments]);

  const openUpdateModal = (registration: TournamentRegistration) => {
    setSelectedRegistration(registration);
    setUpdateFormData({
      team_name: registration.team_name,
      player1_name: registration.player1_name,
      player1_phone: registration.player1_phone,
      player2_name: registration.player2_name || '',
      player2_phone: registration.player2_phone || ''
    });
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedRegistration(null);
    setUpdateFormData({
      team_name: '',
      player1_name: '',
      player1_phone: '',
      player2_name: '',
      player2_phone: ''
    });
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegistration) return;

    setUpdateLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/tournaments/registration/${selectedRegistration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateFormData)
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to update registration');
        setUpdateLoading(false);
        return;
      }

      alert('Tournament registration updated successfully!');
      closeUpdateModal();
      fetchMyTournaments(); // Refresh data
    } catch (error) {
      alert('Network error. Please try again.');
      setUpdateLoading(false);
    }
  };

  const openDeleteModal = (registration: TournamentRegistration) => {
    setSelectedRegistration(registration);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedRegistration(null);
  };

  const handleDeleteRegistration = async () => {
    if (!selectedRegistration) return;

    setDeleteLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/tournaments/registration/${selectedRegistration.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to delete registration');
        setDeleteLoading(false);
        return;
      }

      alert('Tournament registration deleted successfully!');
      closeDeleteModal();
      fetchMyTournaments(); // Refresh data
    } catch (error) {
      alert('Network error. Please try again.');
      setDeleteLoading(false);
    }
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">My Tournaments</h1>
            <p className="text-gray-600">Manage your tournament registrations and team details</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
              <button
                type="button"
                onClick={fetchMyTournaments}
                className="ml-2 text-red-800 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your tournaments...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tournament registrations</h3>
              <p className="text-gray-500 mb-4">You haven't registered for any tournaments yet</p>
              <button 
                type="button"
                className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors"
                onClick={() => window.location.href = '/join-tournament'}
              >
                Browse Tournaments
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {registrations.map((registration) => (
                <div key={registration.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-deep-navy mb-1">
                        {registration.tournament_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Team: {registration.team_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {registration.entry_fee === 0 ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-lemon-zest text-deep-navy px-3 py-1 rounded-full text-sm font-medium">
                          ₹{registration.entry_fee}
                        </span>
                      )}
                      <span className={`mt-1 px-2 py-1 rounded text-xs ${
                        isUpcoming(registration.tournament_date) 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUpcoming(registration.tournament_date) ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-deep-navy">
                      <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
                      {new Date(registration.tournament_date).toLocaleDateString()} at {registration.start_time}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <MapPin className="h-4 w-4 mr-3 text-ocean-teal" />
                      {registration.location}
                    </div>
                    <div className="flex items-center text-sm text-deep-navy">
                      <Trophy className="h-4 w-4 mr-3 text-ocean-teal" />
                      Organized by {registration.organizer}
                    </div>
                  </div>

                  {/* Team Details */}
                  <div className="bg-sky-mist rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-deep-navy mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Team Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Player 1:</strong> {registration.player1_name}</p>
                        <p className="text-gray-600">📞 {registration.player1_phone}</p>
                      </div>
                      {registration.player2_name && (
                        <div>
                          <p><strong>Player 2:</strong> {registration.player2_name}</p>
                          <p className="text-gray-600">📞 {registration.player2_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Registered: {new Date(registration.registration_date).toLocaleDateString()}
                    </div>
                    {isUpcoming(registration.tournament_date) && (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => openUpdateModal(registration)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                          title="Update team details"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(registration)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                          title="Withdraw from tournament"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Withdraw
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Registration Modal */}
      {showUpdateModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeUpdateModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-deep-navy mb-6 flex items-center">
              <Edit className="h-5 w-5 mr-2 text-ocean-teal" />
              Update Team Registration
            </h2>

            <div className="bg-sky-mist rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-deep-navy mb-2">{selectedRegistration.tournament_name}</h3>
              <p className="text-sm text-gray-600">
                {new Date(selectedRegistration.tournament_date).toLocaleDateString()} at {selectedRegistration.start_time}
              </p>
            </div>
            
            <form onSubmit={handleUpdateRegistration} className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Team Name *
                </label>
                <input
                  type="text"
                  value={updateFormData.team_name}
                  onChange={(e) => setUpdateFormData({...updateFormData, team_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Player 1 Name *
                  </label>
                  <input
                    type="text"
                    value={updateFormData.player1_name}
                    onChange={(e) => setUpdateFormData({...updateFormData, player1_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    placeholder="Player 1 full name"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    Player 1 Phone *
                  </label>
                  <input
                    type="tel"
                    value={updateFormData.player1_phone}
                    onChange={(e) => setUpdateFormData({...updateFormData, player1_phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Player 2 Name
                  </label>
                  <input
                    type="text"
                    value={updateFormData.player2_name}
                    onChange={(e) => setUpdateFormData({...updateFormData, player2_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    placeholder="Player 2 full name (optional)"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    Player 2 Phone
                  </label>
                  <input
                    type="tel"
                    value={updateFormData.player2_phone}
                    onChange={(e) => setUpdateFormData({...updateFormData, player2_phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    placeholder="+91 98765 43210 (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 bg-ocean-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-colors disabled:opacity-50"
                >
                  {updateLoading ? 'Updating...' : 'Update Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Registration Modal */}
      {showDeleteModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-deep-navy mb-4">Withdraw from Tournament</h2>
              <p className="text-gray-600 mb-2">
                Are you sure you want to withdraw from <strong>{selectedRegistration.tournament_name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will remove your team registration and cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Keep Registration
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRegistration}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};