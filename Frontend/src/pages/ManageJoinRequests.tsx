import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Check, 
  X, 
  User, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Users,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getToken } from '../utils/auth';

interface JoinRequest {
  id: string;
  match_id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  sport: string;
  date_time: string;
  location: string;
  description?: string;
}

export const ManageJoinRequests: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh every 30 seconds to keep data current
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/join-requests/my-matches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch join requests');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
        const data = await response.json();
        
        // Update the request status locally
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: action } : req
        ));
        
        // Show success notification
        const actionText = action === 'accepted' ? 'accepted' : 'declined';
        showNotification('success', `Join request ${actionText} successfully! The player has been notified.`);
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.error || `Failed to ${action} request`);
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm transform transition-all duration-300 ${
      type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
      type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
      'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
    }`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-lg mr-2">${icon}</span>
        <span class="font-medium">${message}</span>
      </div>
    `;
    
    // Add entrance animation
    notification.style.transform = 'translateX(100%)';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  };

  const filteredRequests = requests.filter(request => {
    switch (filter) {
      case 'pending':
        return request.status === 'pending';
      case 'processed':
        return request.status !== 'pending';
      default:
        return true;
    }
  });

  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const processedCount = requests.filter(req => req.status !== 'pending').length;

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy mb-2">Manage Join Requests</h1>
              <p className="text-gray-600">Review and respond to players wanting to join your matches</p>
            </div>
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 ${
              pendingCount > 0 ? 'ring-2 ring-yellow-200 bg-yellow-50' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                  {pendingCount > 0 && (
                    <p className="text-xs text-yellow-700 mt-1">
                      {pendingCount === 1 ? 'Needs your attention' : 'Need your attention'}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  {pendingCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processed Requests</p>
                  <p className="text-3xl font-bold text-green-600">{processedCount}</p>
                  {processedCount > 0 && (
                    <p className="text-xs text-green-700 mt-1">Successfully handled</p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-3xl font-bold text-deep-navy">{requests.length}</p>
                  <p className="text-xs text-gray-600 mt-1">All time</p>
                </div>
                <Bell className="h-8 w-8 text-deep-navy" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'pending', label: 'Pending', count: pendingCount },
                  { key: 'processed', label: 'Processed', count: processedCount },
                  { key: 'all', label: 'All', count: requests.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      filter === tab.key
                        ? 'border-ocean-teal text-ocean-teal'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'pending' ? 'No Pending Requests' : 
                 filter === 'processed' ? 'No Processed Requests' : 'No Join Requests'}
              </h3>
              <p className="text-gray-500">
                {filter === 'pending' 
                  ? 'No players have requested to join your matches yet.'
                  : filter === 'processed'
                  ? 'You haven\'t processed any join requests yet.'
                  : 'No one has requested to join your matches yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    request.status === 'pending' ? 'border-yellow-500' :
                    request.status === 'accepted' ? 'border-green-500' :
                    'border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Request Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-600 mr-2" />
                          <h3 className="text-lg font-semibold text-deep-navy">
                            {request.requester_name}
                          </h3>
                          <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                            request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {request.status === 'accepted' && <Check className="h-3 w-3 mr-1" />}
                            {request.status === 'declined' && <X className="h-3 w-3 mr-1" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()} at{' '}
                          {new Date(request.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-sm text-gray-600">
                          <strong>Email:</strong> {request.requester_email}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Phone:</strong> {request.requester_phone || 'Not provided'}
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-deep-navy mb-2">Match Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(request.date_time).toLocaleDateString()} at{' '}
                            {new Date(request.date_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {request.location}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {request.sport}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {request.message && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium text-gray-700">Player's Message:</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                            "{request.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => handleRequestAction(request.id, 'accepted')}
                          disabled={processingRequest === request.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center text-sm font-medium"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'declined')}
                          disabled={processingRequest === request.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center text-sm font-medium"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Status Icon for Processed Requests */}
                    {request.status !== 'pending' && (
                      <div className="ml-6">
                        {request.status === 'accepted' ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Processing Indicator */}
                  {processingRequest === request.id && (
                    <div className="mt-4 flex items-center justify-center py-2">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">Processing request...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageJoinRequests;