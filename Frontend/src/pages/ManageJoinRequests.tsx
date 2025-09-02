import React, { useState, useEffect } from "react";
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
  XCircle,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { getToken } from "../utils/auth";
import { dataCache, persistentStorage } from "../utils/dataCache";

interface JoinRequest {
  id: string;
  match_id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  created_at: string;
  sport: string;
  date_time: string;
  location: string;
  description?: string;
}

export const ManageJoinRequests: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>(() => {
    // Initialize with cached data to prevent reset to empty array
    const cached = dataCache.get<JoinRequest[]>("join_requests");
    const persistent = persistentStorage.get<JoinRequest[]>("join_requests");
    return cached || persistent || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "pending" | "processed">(
    "pending"
  );
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    // Initial fetch
    fetchRequests();

    // Auto-refresh every 60 seconds to keep data current (reduced frequency to prevent excessive requests)
    const interval = setInterval(() => {
      fetchRequests();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async (forceRefresh = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    // Skip fetch if data is fresh (less than 30 seconds old) and not forced
    if (!forceRefresh && timeSinceLastFetch < 30000 && requests.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const response = await fetch(
        "http://localhost:5000/api/join-requests/my-matches",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newRequests = data.requests || [];

        // Update state and cache
        setRequests(newRequests);
        setLastFetchTime(now);

        // Cache the data for quick access
        dataCache.set("join_requests", newRequests, 5 * 60 * 1000); // 5 minutes
        persistentStorage.set("join_requests", newRequests);

        // Clear error if successful
        setError("");
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to fetch join requests";
        setError(errorMessage);

        // If we have cached data, keep showing it instead of empty state
        if (requests.length === 0) {
          const fallbackData =
            persistentStorage.get<JoinRequest[]>("join_requests");
          if (fallbackData && fallbackData.length > 0) {
            setRequests(fallbackData);
            setError(`${errorMessage} (Showing cached data)`);
          }
        }
      }
    } catch (error) {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);

      // If we have cached data, keep showing it instead of empty state
      if (requests.length === 0) {
        const fallbackData =
          persistentStorage.get<JoinRequest[]>("join_requests");
        if (fallbackData && fallbackData.length > 0) {
          setRequests(fallbackData);
          setError(`${errorMessage} (Showing cached data)`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "accepted" | "declined"
  ) => {
    setProcessingRequest(requestId);
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/join-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: action }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update the request status locally
        const updatedRequests = requests.map((req) =>
          req.id === requestId ? { ...req, status: action } : req
        );
        setRequests(updatedRequests);

        // Update cache immediately
        dataCache.set("join_requests", updatedRequests, 5 * 60 * 1000);
        persistentStorage.set("join_requests", updatedRequests);

        // Show success notification
        const actionText = action === "accepted" ? "accepted" : "declined";
        showNotification(
          "success",
          `Join request ${actionText} successfully! The player has been notified.`
        );
      } else {
        const errorData = await response.json();
        showNotification(
          "error",
          errorData.error || `Failed to ${action} request`
        );
      }
    } catch (error) {
      showNotification("error", "Network error. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl max-w-sm transform transition-all duration-300 border-2 ${
      type === "success"
        ? "bg-gradient-to-r from-lemon-zest to-lemon-zest/80 text-deep-navy border-ocean-teal"
        : type === "error"
        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-600"
        : "bg-gradient-to-r from-ocean-teal to-deep-navy text-ivory-whisper border-ocean-teal"
    }`;

    const icon = type === "success" ? "✓" : type === "error" ? "✗" : "ℹ";
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-lg mr-3 font-bold">${icon}</span>
        <span class="font-semibold">${message}</span>
      </div>
    `;

    // Add entrance animation
    notification.style.transform = "translateX(100%)";
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  const filteredRequests = requests.filter((request) => {
    switch (filter) {
      case "pending":
        return request.status === "pending";
      case "processed":
        return request.status !== "pending";
      default:
        return true;
    }
  });

  const pendingCount = requests.filter(
    (req) => req.status === "pending"
  ).length;
  const processedCount = requests.filter(
    (req) => req.status !== "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-whisper via-lemon-zest/5 to-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy mb-2">
                Manage Join Requests
              </h1>
              <p className="text-ocean-teal">
                Review and respond to players wanting to join your matches
              </p>
            </div>
            <button
              onClick={() => fetchRequests(true)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-ocean-teal to-deep-navy text-ivory-whisper rounded-lg hover:from-deep-navy hover:to-ocean-teal transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              className={`bg-gradient-to-br from-ivory-whisper to-lemon-zest/10 rounded-xl shadow-lg p-6 transition-all duration-300 border-2 ${
                pendingCount > 0
                  ? "border-lemon-zest/50 bg-lemon-zest/10"
                  : "border-lemon-zest/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ocean-teal font-medium">
                    Pending Requests
                  </p>
                  <p className="text-3xl font-bold text-deep-navy">
                    {pendingCount}
                  </p>
                  {pendingCount > 0 && (
                    <p className="text-xs text-ocean-teal mt-1 font-semibold">
                      {pendingCount === 1
                        ? "Needs your attention"
                        : "Need your attention"}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Clock className="h-8 w-8 text-ocean-teal" />
                  {pendingCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-lemon-zest rounded-full animate-pulse border-2 border-deep-navy"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-ivory-whisper to-ocean-teal/10 rounded-xl shadow-lg p-6 border-2 border-ocean-teal/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ocean-teal font-medium">
                    Processed Requests
                  </p>
                  <p className="text-3xl font-bold text-deep-navy">
                    {processedCount}
                  </p>
                  {processedCount > 0 && (
                    <p className="text-xs text-ocean-teal mt-1 font-semibold">
                      Successfully handled
                    </p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-ocean-teal" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-ivory-whisper to-deep-navy/10 rounded-xl shadow-lg p-6 border-2 border-deep-navy/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-deep-navy font-medium">
                    Total Requests
                  </p>
                  <p className="text-3xl font-bold text-deep-navy">
                    {requests.length}
                  </p>
                  <p className="text-xs text-ocean-teal mt-1 font-semibold">
                    All time
                  </p>
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
                  { key: "pending", label: "Pending", count: pendingCount },
                  {
                    key: "processed",
                    label: "Processed",
                    count: processedCount,
                  },
                  { key: "all", label: "All", count: requests.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      filter === tab.key
                        ? "border-ocean-teal text-ocean-teal"
                        : "border-transparent text-deep-navy/60 hover:text-ocean-teal hover:border-ocean-teal/30"
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
            <div
              className={`border rounded-lg p-4 mb-6 ${
                error.includes("cached data")
                  ? "bg-lemon-zest/10 border-lemon-zest/30 text-deep-navy"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {error.includes("cached data") ? (
                  <Bell className="h-5 w-5 text-ocean-teal mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Data freshness indicator */}
          {!loading && requests.length > 0 && (
            <div className="mb-4 text-center">
              <span className="text-xs text-ocean-teal/70 bg-ocean-teal/10 px-3 py-1 rounded-full">
                Last updated:{" "}
                {lastFetchTime > 0
                  ? new Date(lastFetchTime).toLocaleTimeString()
                  : "Loading..."}
              </span>
            </div>
          )}

          {loading && requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal mx-auto mb-4"></div>
              <p className="text-ocean-teal font-medium">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-lemon-zest/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-12 w-12 text-ocean-teal" />
              </div>
              <h3 className="text-xl font-semibold text-deep-navy mb-2">
                {filter === "pending"
                  ? "No Pending Requests"
                  : filter === "processed"
                  ? "No Processed Requests"
                  : "No Join Requests"}
              </h3>
              <p className="text-ocean-teal">
                {filter === "pending"
                  ? "No players have requested to join your matches yet."
                  : filter === "processed"
                  ? "You haven't processed any join requests yet."
                  : "No one has requested to join your matches yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-gradient-to-br from-ivory-whisper to-ivory-whisper/50 rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all duration-300 ${
                    request.status === "pending"
                      ? "border-lemon-zest shadow-lemon-zest/20"
                      : request.status === "accepted"
                      ? "border-ocean-teal shadow-ocean-teal/20"
                      : "border-red-500 shadow-red-500/20"
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
                          <span
                            className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center border-2 ${
                              request.status === "pending"
                                ? "bg-lemon-zest/20 text-deep-navy border-lemon-zest animate-pulse"
                                : request.status === "accepted"
                                ? "bg-ocean-teal/20 text-ocean-teal border-ocean-teal"
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}
                          >
                            {request.status === "pending" && (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {request.status === "accepted" && (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            {request.status === "declined" && (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-ocean-teal font-medium">
                          {new Date(request.created_at).toLocaleDateString()} at{" "}
                          {new Date(request.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-sm text-deep-navy">
                          <strong className="text-ocean-teal">Email:</strong>{" "}
                          {request.requester_email}
                        </div>
                        <div className="text-sm text-deep-navy">
                          <strong className="text-ocean-teal">Phone:</strong>{" "}
                          {request.requester_phone || "Not provided"}
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="bg-gradient-to-r from-lemon-zest/10 to-ocean-teal/10 rounded-lg p-4 mb-4 border border-lemon-zest/30">
                        <h4 className="font-medium text-deep-navy mb-2">
                          Match Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center text-deep-navy">
                            <Calendar className="h-4 w-4 mr-2 text-ocean-teal" />
                            {new Date(request.date_time).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(request.date_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                          <div className="flex items-center text-deep-navy">
                            <MapPin className="h-4 w-4 mr-2 text-ocean-teal" />
                            {request.location}
                          </div>
                          <div className="flex items-center text-deep-navy">
                            <Users className="h-4 w-4 mr-2 text-ocean-teal" />
                            {request.sport}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {request.message && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium text-gray-700">
                              Player's Message:
                            </span>
                          </div>
                          <p className="text-sm text-deep-navy bg-lemon-zest/20 p-3 rounded border-l-4 border-ocean-teal">
                            "{request.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() =>
                            handleRequestAction(request.id, "accepted")
                          }
                          disabled={processingRequest === request.id}
                          className="px-4 py-2 bg-gradient-to-r from-ocean-teal to-deep-navy text-ivory-whisper rounded-lg hover:from-deep-navy hover:to-ocean-teal transition-all duration-300 disabled:opacity-50 flex items-center text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRequestAction(request.id, "declined")
                          }
                          disabled={processingRequest === request.id}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 flex items-center text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Status Icon for Processed Requests */}
                    {request.status !== "pending" && (
                      <div className="ml-6">
                        {request.status === "accepted" ? (
                          <CheckCircle className="h-8 w-8 text-ocean-teal" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Processing Indicator */}
                  {processingRequest === request.id && (
                    <div className="mt-4 flex items-center justify-center py-2 bg-lemon-zest/20 rounded-lg">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2 text-ocean-teal" />
                      <span className="text-sm text-deep-navy font-medium">
                        Processing request...
                      </span>
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
