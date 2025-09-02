import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Edit, AlertTriangle, UserPlus, MessageCircle } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
// import { Match } from '../types';
import { getToken } from '../utils/auth';
import { MatchRequestsModal } from '../components/MatchRequestsModal';
import SimpleMatchChat from '../components/SimpleMatchChat';
import { Toaster } from 'react-hot-toast';

export const MyMatches: React.FC = () => {
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalParticipants, setModalParticipants] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    date_time: '',
    location: '',
    players_required: '',
    level_of_game: '',
    description: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState<string | null>(null);
  const [pendingRequestCounts, setPendingRequestCounts] = useState<{[matchId: string]: number}>({});
  const [showChatModal, setShowChatModal] = useState<string | null>(null);
  const [messageCounts, setMessageCounts] = useState<{[matchId: string]: number}>({});

  const handleMessageCountChange = React.useCallback((matchId: string, count: number) => {
    setMessageCounts(prev => ({
      ...prev,
      [matchId]: count
    }));
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/matches/user/matches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to fetch matches');
        setLoading(false);
        return;
      }
      // Combine created and joined matches for display
      const allMatches = [
        ...(data.created_matches || []).map((m: any) => ({ 
          ...m, 
          status: m.status || (new Date(m.date_time) > new Date() ? 'upcoming' : 'completed'), 
          organizer: 'You',
          isCreator: true
        })),
        ...(data.joined_matches || []).map((m: any) => ({ 
          ...m, 
          status: m.status || (new Date(m.date_time) > new Date() ? 'upcoming' : 'completed'), 
          organizer: m.creator_name || 'Unknown',
          isCreator: false
        }))
      ];
      setMyMatches(allMatches);
      
      // Fetch pending request counts for created matches
      const createdMatches = data.created_matches || [];
      await fetchPendingRequestCounts(createdMatches);
      
      setLoading(false);
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchPendingRequestCounts = async (createdMatches: any[]) => {
    try {
      const token = getToken();
      const counts: {[matchId: string]: number} = {};
      
      await Promise.all(
        createdMatches.map(async (match) => {
          try {
            const response = await fetch(`http://localhost:5000/api/join-requests/match/${match.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const pendingRequests = (data.requests || []).filter((req: any) => req.status === 'pending');
              counts[match.id] = pendingRequests.length;
            }
          } catch (error) {
            console.error(`Error fetching requests for match ${match.id}:`, error);
          }
        })
      );
      
      setPendingRequestCounts(counts);
    } catch (error) {
      console.error('Error fetching pending request counts:', error);
    }
  };

  const openModal = async (matchId: string) => {
    setShowModal(true);
    setModalParticipants([]);
    setModalLoading(true);
    setModalError('');
    setSelectedMatchId(matchId);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/matches/${matchId}/participants`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.message || 'Failed to fetch participants');
        setModalLoading(false);
        return;
      }
      setModalParticipants(data.participants || []);
      setModalLoading(false);
    } catch (err) {
      setModalError('Network error');
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalParticipants([]);
    setSelectedMatchId(null);
    setModalError('');
  };

  const openUpdateModal = (match: any) => {
    setSelectedMatchId(match.id);
    setUpdateFormData({
      date_time: new Date(match.date_time).toISOString().slice(0, 16),
      location: match.location || '',
      players_required: match.players_required?.toString() || '',
      level_of_game: match.level_of_game || '',
      description: match.description || ''
    });
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedMatchId(null);
    setUpdateFormData({
      date_time: '',
      location: '',
      players_required: '',
      level_of_game: '',
      description: ''
    });
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    setUpdateLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/matches/${selectedMatchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date_time: updateFormData.date_time,
          location: updateFormData.location,
          players_required: parseInt(updateFormData.players_required),
          level_of_game: updateFormData.level_of_game,
          description: updateFormData.description
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to update match');
        setUpdateLoading(false);
        return;
      }

      alert('Match updated successfully!');
      closeUpdateModal();
      // Refresh matches
      window.location.reload();
    } catch (error) {
      alert('Network error. Please try again.');
      setUpdateLoading(false);
    }
  };

  const openCancelModal = (matchId: string) => {
    setSelectedMatchId(matchId);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedMatchId(null);
  };

  const handleCancelMatch = async () => {
    if (!selectedMatchId) return;

    setCancelLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/matches/${selectedMatchId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to cancel match');
        setCancelLoading(false);
        return;
      }

      alert('Match cancelled successfully!');
      closeCancelModal();
      // Refresh matches
      window.location.reload();
    } catch (error) {
      alert('Network error. Please try again.');
      setCancelLoading(false);
    }
  };

  const upcomingMatches = myMatches.filter(match => match.status === 'upcoming');
  const completedMatches = myMatches.filter(match => match.status === 'completed');
  const cancelledMatches = myMatches.filter(match => match.status === 'cancelled');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MatchCard: React.FC<{ match: any }> = ({ match }) => {
    // Calculate players_needed
    // const playersNeeded = (match.players_required || match.playersNeeded || 0) - (match.current_participants || 0);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-deep-navy mb-1">
              {match.level_of_game || match.level} Match
            </h3>
            <p className="text-sm text-gray-600">
              {match.organizer === 'You' ? 'Organized by you' : `Organized by ${match.organizer}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(match.status)}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-deep-navy">
            <Calendar className="h-4 w-4 mr-3 text-ocean-teal" />
            {new Date(match.date_time || match.date).toLocaleDateString()} at {match.date_time ? new Date(match.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : match.time}
          </div>
          <div className="flex items-center text-sm text-deep-navy">
            <MapPin className="h-4 w-4 mr-3 text-ocean-teal" />
            {match.location}
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-deep-navy">
              <Users className="h-4 w-4 mr-3 text-ocean-teal" />
              {(() => {
                const currentParticipants = match.current_participants || 0; // Non-creator participants only
                const totalRequired = match.players_required || match.playersNeeded || 2;
                const playersNeeded = Math.max(0, totalRequired - currentParticipants);
                
                if (playersNeeded <= 0) {
                  return (
                    <span className="text-green-600 font-semibold flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Match Full ({currentParticipants}/{totalRequired})
                    </span>
                  );
                }
                return (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    {playersNeeded} player{playersNeeded !== 1 ? 's' : ''} needed 
                    <span className="ml-1 text-gray-500">({currentParticipants}/{totalRequired} joined)</span>
                  </span>
                );
              })()}
            </div>
            
            {/* Show participant names if available */}
            {match.participant_names && (
              <div className="text-xs text-gray-600 ml-7">
                <span className="font-medium">Players joined:</span> You (Creator)
                {match.participant_names && `, ${match.participant_names}`}
              </div>
            )}
            
            {/* Show match status instead of progress bar */}
            <div className="ml-7">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-ocean-teal to-sky-mist h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((match.current_participants || 1) / (match.players_required || 2)) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{match.current_participants || 1} joined</span>
                <span>{match.players_required || 2} total needed</span>
              </div>
            </div>
          </div>
        </div>

        {match.description && (
          <p className="text-sm text-gray-600 mb-4 p-3 bg-sky-mist rounded-lg">
            {match.description}
          </p>
        )}

        {/* Chat Section - Always visible for creators and participants */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowChatModal(
              showChatModal === match.id ? null : match.id
            )}
            className="w-full py-2 px-4 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors flex items-center justify-center relative"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {showChatModal === match.id ? "Hide Chat" : "Open Chat"}
            {messageCounts[match.id] > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {messageCounts[match.id] > 99 ? '99+' : messageCounts[match.id]}
              </span>
            )}
          </button>

          {showChatModal === match.id && (
            <div className="mt-4 border rounded-lg bg-gray-50">
              <SimpleMatchChat 
                matchId={match.id} 
                onMessageCountChange={(count) => {
                  setMessageCounts(prev => ({
                    ...prev,
                    [match.id]: count
                  }));
                }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              type="button"
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => openModal(match.id)}
            >
              View Details
            </button>
          </div>
          {match.status === 'upcoming' && match.isCreator && (
            <div className="flex space-x-2">
              <button 
                type="button"
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center relative"
                onClick={() => setShowRequestsModal(match.id)}
                title="Manage join requests (Creator only)"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Requests
                {pendingRequestCounts[match.id] > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {pendingRequestCounts[match.id]}
                  </span>
                )}
              </button>
              <button 
                type="button"
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                onClick={() => openUpdateModal(match)}
                title="Edit match details (Creator only)"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </button>
              <button 
                type="button"
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                onClick={() => openCancelModal(match.id)}
                title="Cancel match (Creator only)"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">My Matches</h1>
            <p className="text-gray-600">Track all your pickleball matches in one place</p>
          </div>

          {error && <div className="text-red-600 text-center mb-4">{error}</div>}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Upcoming Matches</p>
                      <p className="text-2xl font-bold text-blue-600">{upcomingMatches.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed Matches</p>
                      <p className="text-2xl font-bold text-green-600">{completedMatches.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold text-deep-navy">{myMatches.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-deep-navy" />
                  </div>
                </div>
              </div>

              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-deep-navy mb-4">Upcoming Matches</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {upcomingMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Matches */}
              {completedMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-deep-navy mb-4">Completed Matches</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {completedMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled Matches */}
              {cancelledMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-deep-navy mb-4">Cancelled Matches</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cancelledMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {myMatches.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No matches yet</h3>
                  <p className="text-gray-500 mb-4">Start by creating or joining your first match</p>
                  <div className="flex justify-center space-x-4">
                    <button className="px-6 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors" onClick={() => window.location.href='/create-match'}>
                      Create Match
                    </button>
                    <button className="px-6 py-3 border border-ocean-teal text-ocean-teal rounded-lg hover:bg-ocean-teal hover:text-white transition-colors" onClick={() => window.location.href='/join-match'}>
                      Join Match
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Modal for participants */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-deep-navy mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-ocean-teal" />
              Match Participants
            </h2>
            {modalLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : modalError ? (
              <div className="text-red-600 text-center mb-4">{modalError}</div>
            ) : modalParticipants.length === 0 ? (
              <div className="text-center text-gray-500">No participants yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {modalParticipants.map((user) => (
                  <li key={user.id} className="py-3 flex items-center">
                    <span className="font-medium text-deep-navy mr-2">{user.fullname}</span>
                    <span className="text-xs text-gray-500 ml-auto">{user.level_of_game}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Update Match Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={closeUpdateModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-deep-navy mb-6 flex items-center">
              <Edit className="h-5 w-5 mr-2 text-ocean-teal" />
              Update Match
            </h2>
            
            <form onSubmit={handleUpdateMatch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={updateFormData.date_time}
                    onChange={(e) => setUpdateFormData({...updateFormData, date_time: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                    aria-label="Match date and time"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-navy mb-2">
                    Skill Level
                  </label>
                  <select
                    value={updateFormData.level_of_game}
                    onChange={(e) => setUpdateFormData({...updateFormData, level_of_game: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                    required
                    aria-label="Skill level"
                  >
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={updateFormData.location}
                  onChange={(e) => setUpdateFormData({...updateFormData, location: e.target.value})}
                  placeholder="Enter court location or address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Players Needed
                </label>
                <input
                  type="number"
                  value={updateFormData.players_required}
                  onChange={(e) => setUpdateFormData({...updateFormData, players_required: e.target.value})}
                  min="1"
                  max="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  required
                  aria-label="Number of players needed"
                  placeholder="Enter number of players needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={updateFormData.description}
                  onChange={(e) => setUpdateFormData({...updateFormData, description: e.target.value})}
                  rows={3}
                  placeholder="Add any additional details about the match..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent resize-none"
                />
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
                  {updateLoading ? 'Updating...' : 'Update Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Match Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={closeCancelModal}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-deep-navy mb-4">Cancel Match</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this match? This action cannot be undone and all participants will be notified.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Keep Match
                </button>
                <button
                  type="button"
                  onClick={handleCancelMatch}
                  disabled={cancelLoading}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Match'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Requests Modal */}
      {showRequestsModal && (
        <MatchRequestsModal
          matchId={showRequestsModal}
          onClose={() => setShowRequestsModal(null)}
          onRequestUpdate={() => {
            // Refresh all match data to update participant counts
            fetchMatches();
          }}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && selectedChatMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-4xl h-[80vh] relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10 bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => {
                setShowChatModal(false);
                setSelectedChatMatch(null);
              }}
              aria-label="Close chat"
            >
              &times;
            </button>
            <div className="h-full">
              <SimpleMatchChat 
                matchId={selectedChatMatch} 
                onMessageCountChange={(count) => handleMessageCountChange(selectedChatMatch, count)}
              />
            </div>
          </div>
        </div>
      )}


    </div>
  );
};