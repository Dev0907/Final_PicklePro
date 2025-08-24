import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, X, Clock, Users, Trophy, Calendar, AlertCircle } from "lucide-react";
import { getCurrentUser, getToken } from "../utils/auth";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
}

interface JoinRequestNotification {
  request_id: number;
  match_id: number;
  user_id: number;
  fullname: string;
  phone_no: string;
  location: string;
  date_time: string;
  match_location: string;
  request_time: string;
  status: string;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<JoinRequestNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const token = getToken();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchRequests();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  useEffect(() => {
    // Fetch unread count on component mount and periodically
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/notifications/unread-count", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "http://localhost:5000/api/join-requests/my-matches",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to fetch join requests");
        setLoading(false);
        return;
      }
      setRequests(data.requests || []);
      setLoading(false);
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!token) return;
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  };

  const handleApprove = async (requestId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/join-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: "accepted" }),
        }
      );
      
      if (res.ok) {
        fetchRequests();
        fetchNotifications();
        fetchUnreadCount();
        // Show success message
        const data = await res.json();
        showNotification('success', data.message || "Join request approved successfully! The player has been notified.");
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || "Error approving request");
      }
    } catch (err) {
      showNotification('error', "Network error. Please try again.");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/join-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: "declined" }),
        }
      );
      
      if (res.ok) {
        fetchRequests();
        fetchNotifications();
        fetchUnreadCount();
        // Show success message
        const data = await res.json();
        showNotification('success', data.message || "Join request declined successfully! The player has been notified.");
      } else {
        const errorData = await res.json();
        showNotification('error', errorData.error || "Error rejecting request");
      }
    } catch (err) {
      showNotification('error', "Network error. Please try again.");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_join_request':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'join_request_accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'join_request_declined':
        return <X className="h-4 w-4 text-red-500" />;
      case 'tournament_registration':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'match_partner_joined':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-ocean-teal/80 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {(unreadCount > 0 || requests.length > 0) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {(unreadCount + requests.length) > 9 ? "9+" : (unreadCount + requests.length)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-deep-navy">
                Notifications
              </h3>
              {(unreadCount > 0 || requests.length > 0) && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-ocean-teal hover:text-ocean-teal/80 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            {(unreadCount > 0 || requests.length > 0) && (
              <p className="text-sm text-gray-600">
                {unreadCount} notification(s) • {requests.length} pending request(s)
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 && requests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                {/* General Notifications */}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            !notification.is_read ? 'text-deep-navy' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <div className="flex items-center mt-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-xs text-blue-600 font-medium">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Join Requests */}
                {requests.map((req) => (
                  <div
                    key={req.request_id}
                    className="p-4 hover:bg-gray-50 transition-colors bg-yellow-50 border-l-4 border-l-yellow-500"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Users className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-deep-navy truncate">
                            Join Request for Match
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(req.request_time).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Name:</strong> {req.fullname}
                          <br />
                          <strong>Location:</strong> {req.location || "N/A"}
                          <br />
                          <strong>Phone:</strong> {req.phone_no || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Match Date:</strong>{" "}
                          {new Date(req.date_time).toLocaleDateString()}
                          <br />
                          <strong>Match Time:</strong>{" "}
                          {new Date(req.date_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <br />
                          <strong>Match Location:</strong> {req.match_location}
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.request_id)}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.request_id)}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          <span className="text-xs text-orange-600 font-medium">Action Required</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
