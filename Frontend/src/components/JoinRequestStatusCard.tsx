import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Bell, User, Calendar, MapPin } from 'lucide-react';
import { getToken } from '../utils/auth';

interface JoinRequestStatus {
  id: string;
  match_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  sport: string;
  date_time: string;
  location: string;
  match_creator_name: string;
}

export const JoinRequestStatusCard: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequestStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJoinRequestStatus();
  }, []);

  const fetchJoinRequestStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/join-requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Only show recent requests (last 7 days) and limit to 5
        const recentRequests = (data.requests || [])
          .filter((req: JoinRequestStatus) => {
            const requestDate = new Date(req.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return requestDate >= weekAgo;
          })
          .slice(0, 5);
        setRequests(recentRequests);
      } else {
        setError('Failed to fetch join request status');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'accepted':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'declined':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusMessage = (request: JoinRequestStatus) => {
    switch (request.status) {
      case 'pending':
        return `Your request to join the ${request.sport} match is pending approval.`;
      case 'accepted':
        return `Great! Your request to join the ${request.sport} match has been accepted.`;
      case 'declined':
        return `Your request to join the ${request.sport} match was declined.`;
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-ocean-teal mr-2" />
          <h3 className="text-lg font-semibold text-deep-navy">Join Request Status</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-ocean-teal mr-2" />
          <h3 className="text-lg font-semibold text-deep-navy">Join Request Status</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-ocean-teal mr-2" />
          <h3 className="text-lg font-semibold text-deep-navy">Join Request Status</h3>
        </div>
        <p className="text-gray-600 text-sm">No recent join requests</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-ocean-teal mr-2" />
          <h3 className="text-lg font-semibold text-deep-navy">Join Request Status</h3>
        </div>
        <span className="text-xs text-gray-500">Last 7 days</span>
      </div>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className={`p-3 rounded-lg border ${getStatusColor(request.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  {getStatusIcon(request.status)}
                  <span className="ml-2 text-sm font-medium">
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {getStatusMessage(request)}
                </p>
                
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    <span>Organizer: {request.match_creator_name}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(request.date_time).toLocaleDateString()} at {new Date(request.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{request.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                {new Date(request.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <a
          href="/join-match"
          className="text-xs text-ocean-teal hover:text-ocean-teal/80 font-medium"
        >
          View all join requests →
        </a>
      </div>
    </div>
  );
};