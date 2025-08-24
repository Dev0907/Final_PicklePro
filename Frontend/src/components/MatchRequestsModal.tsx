import React, { useState, useEffect } from 'react';
import { X, Check, Clock, User, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { getToken } from '../utils/auth';

interface JoinRequest {
  id: string;
  match_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
}

interface Match {
  id: string;
  date_time: string;
  location: string;
  level_of_game: string;
  players_required: number;
}

interface MatchRequestsModalProps {
  matchId: string;
  onClose: () => void;
  onRequestUpdate: () => void;
}

export const MatchRequestsModal: React.FC<MatchRequestsModalProps> = ({
  matchId,
  onClose,
  onRequestUpdate
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchMatchDetails();
  }, [matchId]);

  const fetchRequests = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/join-requests/match/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accepted' | 'declined') => {
    setProcessingRequest(requestId);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/join-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        // Update the request status locally
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: action } : req
        ));
        
        // Show success message
        const actionText = action === 'accepted' ? 'accepted' : 'declined';
        showNotification('success', `Join request ${actionText} successfully!`);
        
        // Notify parent component to refresh data
        onRequestUpdate();
      } else {
        const data = await response.json();
        showNotification('error', data.error || `Failed to ${action} request`);
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-navy">Join Requests</h2>
              {match && (
                <div className="text-sm text-gray-600 mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(match.date_time).toLocaleDateString()} at{' '}
                    {new Date(match.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {match.location} • {match.level_of_game}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Join Requests</h3>
              <p className="text-gray-500">No one has requested to join this match yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <User className="h-4 w-4 text-gray-600 mr-2" />
                              <span className="font-medium text-deep-navy">{request.user_name}</span>
                              <span className="text-sm text-gray-500 ml-2">({request.user_email})</span>
                            </div>
                            
                            {request.message && (
                              <div className="mb-3">
                                <div className="flex items-center mb-1">
                                  <MessageCircle className="h-4 w-4 text-gray-600 mr-1" />
                                  <span className="text-sm font-medium text-gray-700">Message:</span>
                                </div>
                                <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                  {request.message}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              Requested {new Date(request.created_at).toLocaleDateString()} at{' '}
                              {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleRequestAction(request.id, 'accepted')}
                              disabled={processingRequest === request.id}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center text-sm"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, 'declined')}
                              disabled={processingRequest === request.id}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center text-sm"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-deep-navy mb-4">
                    Processed Requests ({processedRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {processedRequests.map((request) => (
                      <div key={request.id} className={`border rounded-lg p-3 ${
                        request.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-600 mr-2" />
                            <span className="font-medium text-deep-navy">{request.user_name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};