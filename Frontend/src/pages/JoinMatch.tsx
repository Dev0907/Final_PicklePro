import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Users, Filter, RefreshCw, Clock, CheckCircle, XCircle, Send, MessageCircle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { getCurrentUser, getToken } from "../utils/auth";
import { showSuccessAlert } from "../utils/sweetAlert";
import SimpleMatchChat from "../components/SimpleMatchChat";
import { Toaster } from "react-hot-toast";

interface BackendMatch {
  id: string;
  user_id: string;
  date_time: string;
  location: string;
  players_required: number;
  level_of_game: string;
  creator_name?: string;
  current_participants?: number;
}

interface JoinRequest {
  id: string;
  match_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  updated_at: string;
}

const JoinMatch: React.FC = () => {
  const [filters, setFilters] = useState({
    level: "",
    date: "",
    location: "",
  });
  const [matches, setMatches] = useState<BackendMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinRequests, setJoinRequests] = useState<{
    [matchId: string]: JoinRequest;
  }>({});
  const [loadingRequests, setLoadingRequests] = useState<{
    [matchId: string]: boolean;
  }>({});
  const [participatingMatchIds, setParticipatingMatchIds] = useState<string[]>(
    []
  );
  const [participatingMatches, setParticipatingMatches] = useState<BackendMatch[]>([]);
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedChatMatch, setSelectedChatMatch] = useState<string | null>(null);
  const [messageCounts, setMessageCounts] = useState<{[matchId: string]: number}>({});
  const currentUser = getCurrentUser();
  const token = getToken();

  const fetchMatches = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching matches...");
      const res = await fetch("http://localhost:5000/api/matches/all");
      const data = await res.json();
      console.log("Matches response:", data);
      if (!res.ok) {
        setError(data.message || "Failed to fetch matches");
        setLoading(false);
        return;
      }
      setMatches(data.matches || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Network error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Refresh matches every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    if (!token) return;
    try {
      // Fetch participating matches
      const participatingRes = await fetch(
        "http://localhost:5000/api/matches/participating",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const participatingData = await participatingRes.json();
      if (participatingRes.ok) {
        setParticipatingMatchIds(participatingData.matchIds.map(String));
        // Also get the full match details for participating matches
        const participatingMatchDetails = matches.filter(match => 
          participatingData.matchIds.map(String).includes(String(match.id))
        );
        setParticipatingMatches(participatingMatchDetails);
      }

      // Fetch user's join requests
      const requestsRes = await fetch(
        "http://localhost:5000/api/join-requests/my-requests",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const requestsData = await requestsRes.json();
      if (requestsRes.ok) {
        const requestsMap: { [matchId: string]: JoinRequest } = {};
        requestsData.requests.forEach((request: JoinRequest) => {
          requestsMap[request.match_id] = request;
        });
        setJoinRequests(requestsMap);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token, matches]);

  // Refresh user data every 30 seconds to check for status updates
  useEffect(() => {
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleJoinRequest = async (matchId: string, message?: string) => {
    setLoadingRequests((prev) => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch("http://localhost:5000/api/join-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          match_id: matchId,
          message: message || ""
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Update join requests state
        setJoinRequests((prev) => ({
          ...prev,
          [matchId]: {
            id: data.joinRequest.id,
            match_id: matchId,
            user_id: currentUser?.id || "",
            status: 'pending',
            message: message || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }));
        
        // Show success notification
        showSuccessAlert("Request Sent!", "Your join request has been sent successfully. The match creator will be notified.");
        setShowRequestModal(null);
        setRequestMessage("");
        
        // Refresh user data to update request status
        fetchUserData();
      } else {
        const errorMessage = data.error || data.message || "Failed to send join request";
        if (errorMessage.includes("full") || errorMessage.includes("Full")) {
          showNotification("error", "🚫 Match is Full! This match has reached its player limit and is no longer accepting new participants.");
        } else {
          showNotification("error", errorMessage);
        }
      }
    } catch (err) {
      showNotification("error", "Network error. Please try again.");
    } finally {
      setLoadingRequests((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    // Simple notification - you can replace with a proper toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  };

  const getRequestStatus = (matchId: string) => {
    const request = joinRequests[matchId];
    if (!request) return null;
    return request.status;
  };

  const getButtonState = (matchId: string) => {
    const status = getRequestStatus(matchId);
    const isLoading = loadingRequests[matchId];
    const isParticipating = participatingMatchIds.includes(String(matchId));
    
    // Find the match to check if it's full
    const match = matches.find(m => String(m.id) === String(matchId));
    const currentParticipants = match?.current_participants || 0; // Non-creator participants only
    const isMatchFull = match && currentParticipants >= match.players_required;
    
    if (isParticipating) {
      return { text: "✅ Already Joined", disabled: true, color: "bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/80 text-[#1B263F] border-2 border-[#204F56]" };
    }
    
    if (isMatchFull) {
      return { text: "🚫 Match Full", disabled: true, color: "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60" };
    }
    
    if (isLoading) {
      return { text: "Sending...", disabled: true, color: "bg-gradient-to-r from-[#204F56]/50 to-[#1B263F]/50 text-[#FEFFFD] opacity-70" };
    }
    
    switch (status) {
      case 'pending':
        return { text: "⏳ Request Pending", disabled: true, color: "bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/70 text-[#1B263F] border-2 border-[#204F56]/50" };
      case 'accepted':
        return { text: "✅ Request Accepted", disabled: true, color: "bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/80 text-[#1B263F] border-2 border-[#204F56]" };
      case 'declined':
        return { text: "🔄 Try Again", disabled: false, color: "bg-gradient-to-r from-[#204F56]/80 to-[#1B263F]/80 text-[#FEFFFD] hover:from-[#204F56] hover:to-[#1B263F]" };
      default:
        return { text: "📤 Send Join Request", disabled: false, color: "bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] hover:from-[#1B263F] hover:to-[#204F56]" };
    }
  };

  const filteredMatches = matches.filter((match) => {
    // Hide matches created by the current user
    if (
      currentUser &&
      match.user_id &&
      String(match.user_id) === String(currentUser.id)
    ) {
      return false;
    }
    // Hide matches the user is already participating in
    if (participatingMatchIds.includes(String(match.id))) {
      return false;
    }
    const matchDate = match.date_time ? match.date_time.split("T")[0] : "";
    return (
      (filters.level === "" || match.level_of_game === filters.level) &&
      (filters.date === "" || matchDate === filters.date) &&
      (filters.location === "" ||
        match.location.toLowerCase().includes(filters.location.toLowerCase()))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFFFD] via-[#E6FD53]/5 to-[#FEFFFD]">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="ml-64 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/70 p-3 rounded-full shadow-lg">
                <Users className="h-8 w-8 text-[#1B263F]" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1B263F] to-[#204F56] bg-clip-text text-transparent">
                Join a Match
              </h1>
              <button
                type="button"
                onClick={fetchMatches}
                disabled={loading}
                className="p-3 bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] rounded-full hover:from-[#1B263F] hover:to-[#204F56] transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Refresh matches"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-[#1B263F]/70 text-lg font-medium">
              Find and join pickleball matches in your area. Chat with players in matches you've joined!
            </p>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-r from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl shadow-xl p-6 mb-8 border-2 border-[#E6FD53]/30">
            <div className="flex items-center mb-6">
              <div className="bg-[#E6FD53]/30 p-2 rounded-full mr-3">
                <Filter className="h-5 w-5 text-[#204F56]" />
              </div>
              <h2 className="text-xl font-bold text-[#1B263F]">
                Filter Matches
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="skill-level" className="block text-sm font-medium text-deep-navy mb-2">
                  Skill Level
                </label>
                <select
                  id="skill-level"
                  value={filters.level}
                  onChange={(e) =>
                    setFilters({ ...filters, level: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  title="Filter matches by skill level"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="match-date" className="block text-sm font-medium text-deep-navy mb-2">
                  Date
                </label>
                <input
                  id="match-date"
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  title="Filter matches by date"
                />
              </div>
              <div>
                <label htmlFor="match-location" className="block text-sm font-medium text-deep-navy mb-2">
                  Location
                </label>
                <input
                  id="match-location"
                  type="text"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({ ...filters, location: e.target.value })
                  }
                  placeholder="Search by location..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  title="Filter matches by location"
                />
              </div>
            </div>
          </div>

          {/* My Matches Section */}
          {participatingMatches.length > 0 && (
            <div className="bg-gradient-to-r from-[#E6FD53]/20 to-[#E6FD53]/10 rounded-xl shadow-xl p-6 mb-8 border-2 border-[#E6FD53]/50">
              <div className="flex items-center mb-6">
                <div className="bg-[#E6FD53] p-2 rounded-full mr-3 shadow-lg">
                  <MessageCircle className="h-5 w-5 text-[#1B263F]" />
                </div>
                <h2 className="text-xl font-bold text-[#1B263F]">
                  My Matches
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participatingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-deep-navy">
                          {match.level_of_game} Match
                        </h3>
                        <p className="text-sm text-gray-600">
                          Organized by {match.creator_name || "Unknown"}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Joined
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-deep-navy">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(match.date_time).toLocaleDateString()} at{" "}
                        {new Date(match.date_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center text-sm text-deep-navy">
                        <MapPin className="h-4 w-4 mr-2" />
                        {match.location}
                      </div>
                    </div>

                    {/* Chat is available when at least 1 player has joined */}
                    {(match.current_participants && match.current_participants > 0) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedChatMatch(
                            selectedChatMatch === match.id ? null : match.id
                          )}
                          className="w-full py-2 px-4 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors flex items-center justify-center relative"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {selectedChatMatch === match.id ? "Hide Chat" : "Open Chat"}
                          {messageCounts[match.id] > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {messageCounts[match.id] > 99 ? '99+' : messageCounts[match.id]}
                            </span>
                          )}
                        </button>

                        {selectedChatMatch === match.id && (
                          <div className="mt-4">
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
                      </>
                    ) : (
                      <div className="w-full py-2 px-4 bg-gray-300 text-gray-600 rounded-lg text-center">
                        <MessageCircle className="h-4 w-4 mr-2 inline" />
                        Chat available when players join
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center mb-4">{error}</div>
          )}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {/* Available Matches Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-[#E6FD53]/30 p-2 rounded-full mr-3">
                    <Users className="h-6 w-6 text-[#204F56]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1B263F]">
                    Available Matches
                  </h2>
                </div>
                <p className="text-[#1B263F]/70 font-medium ml-12">
                  Browse and request to join matches in your area
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatches.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500">
                  No matches found.
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#E6FD53]/30 hover:border-[#204F56]/30"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#1B263F] mb-1">
                          {match.level_of_game} Match
                        </h3>
                        <p className="text-sm text-[#204F56] font-medium">
                          Organized by {match.creator_name || "Unknown"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          match.level_of_game === "Beginner"
                            ? "bg-[#E6FD53] text-[#1B263F] border border-[#E6FD53]"
                            : match.level_of_game === "Intermediate"
                            ? "bg-[#204F56] text-[#FEFFFD] border border-[#204F56]"
                            : "bg-[#1B263F] text-[#E6FD53] border border-[#1B263F]"
                        }`}
                      >
                        {match.level_of_game}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-[#1B263F] font-medium">
                        <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                          <Calendar className="h-4 w-4 text-[#204F56]" />
                        </div>
                        {new Date(match.date_time).toLocaleDateString()} at{" "}
                        {new Date(match.date_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center text-sm text-[#1B263F] font-medium">
                        <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                          <MapPin className="h-4 w-4 text-[#204F56]" />
                        </div>
                        {match.location}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-[#1B263F]">
                          <div className="bg-[#E6FD53]/30 p-1 rounded-full mr-3">
                            <Users className="h-4 w-4 text-[#204F56]" />
                          </div>
                          {(() => {
                            const currentParticipants = match.current_participants || 0; // Non-creator participants only
                            const playersNeeded = Math.max(0, match.players_required - currentParticipants);
                            
                            if (playersNeeded <= 0) {
                              return (
                                <span className="text-[#204F56] font-bold flex items-center">
                                  <span className="w-3 h-3 bg-[#E6FD53] rounded-full mr-2 border-2 border-[#204F56]"></span>
                                  Match Full ({currentParticipants}/{match.players_required} players joined)
                                </span>
                              );
                            }
                            return (
                              <span className="flex items-center font-medium">
                                <span className="w-3 h-3 bg-[#204F56] rounded-full mr-2 animate-pulse"></span>
                                {playersNeeded} player{playersNeeded !== 1 ? 's' : ''} needed 
                                <span className="ml-1 text-[#204F56]/70">({currentParticipants}/{match.players_required} joined)</span>
                              </span>
                            );
                          })()}
                        </div>
                        
                        {/* Show participant names if available */}
                        <div className="text-xs text-gray-600 ml-6">
                          <span className="font-medium">Match creator:</span> {match.creator_name}
                          {match.participant_names && (
                            <>
                              <br />
                              <span className="font-medium">Players joined:</span> {match.participant_names}
                            </>
                          )}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="ml-10">
                          <div className="w-full bg-[#E6FD53]/20 rounded-full h-3 border border-[#E6FD53]/40">
                            <div 
                              className="bg-gradient-to-r from-[#204F56] to-[#1B263F] h-3 rounded-full transition-all duration-500 shadow-sm"
                              style={{ 
                                width: `${Math.min(100, ((match.current_participants || 0) / match.players_required) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-[#1B263F]/70 font-medium mt-2">
                            <span>{match.current_participants || 0} players joined</span>
                            <span>{match.players_required} players needed</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Status Indicator */}
                    {getRequestStatus(match.id) && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-[#E6FD53]/20 to-[#E6FD53]/10 border-l-4 border-[#204F56] shadow-sm">
                        <div className="flex items-center">
                          {getRequestStatus(match.id) === 'pending' && (
                            <>
                              <div className="bg-[#E6FD53] p-1 rounded-full mr-3">
                                <Clock className="h-4 w-4 text-[#1B263F]" />
                              </div>
                              <span className="text-sm text-[#1B263F] font-medium">
                                Request pending - waiting for creator's response
                              </span>
                            </>
                          )}
                          {getRequestStatus(match.id) === 'accepted' && (
                            <>
                              <div className="bg-[#E6FD53] p-1 rounded-full mr-3">
                                <CheckCircle className="h-4 w-4 text-[#204F56]" />
                              </div>
                              <span className="text-sm text-[#1B263F] font-medium">
                                Request accepted! You can now chat with other players.
                              </span>
                            </>
                          )}
                          {getRequestStatus(match.id) === 'declined' && (
                            <>
                              <div className="bg-[#E6FD53] p-1 rounded-full mr-3">
                                <XCircle className="h-4 w-4 text-[#204F56]" />
                              </div>
                              <span className="text-sm text-[#1B263F] font-medium">
                                Request was declined. You can send a new request.
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat Section for Accepted Requests - Only when at least 1 player has joined */}
                    {getRequestStatus(match.id) === 'accepted' && (
                      <div className="mb-4">
                        {(match.current_participants && match.current_participants > 0) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedChatMatch(
                                selectedChatMatch === match.id ? null : match.id
                              )}
                              className="w-full py-3 px-4 bg-gradient-to-r from-[#E6FD53] to-[#E6FD53]/80 text-[#1B263F] rounded-xl hover:from-[#E6FD53]/90 hover:to-[#E6FD53]/70 transition-all duration-300 flex items-center justify-center relative font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {selectedChatMatch === match.id ? "Hide Chat" : "Open Chat"}
                              {messageCounts[match.id] > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#204F56] text-[#FEFFFD] text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                                  {messageCounts[match.id] > 99 ? '99+' : messageCounts[match.id]}
                                </span>
                              )}
                            </button>

                            {selectedChatMatch === match.id && (
                              <div className="mt-4">
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
                          </>
                        ) : (
                          <div className="w-full py-3 px-4 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 rounded-xl text-center font-semibold">
                            <MessageCircle className="h-4 w-4 mr-2 inline" />
                            Chat available when players join
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl ${
                        getButtonState(match.id).color
                      }`}
                      disabled={getButtonState(match.id).disabled}
                      onClick={() => {
                        const currentParticipants = match.current_participants || 0;
                        const isMatchFull = currentParticipants >= match.players_required;
                        
                        if (isMatchFull) {
                          showNotification("error", "🚫 This match is full and cannot accept new players.");
                          return;
                        }
                        
                        if (getRequestStatus(match.id) === 'declined' || !getRequestStatus(match.id)) {
                          setShowRequestModal(match.id);
                        }
                      }}
                    >
                      {loadingRequests[match.id] && (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {getRequestStatus(match.id) === 'pending' && (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      {getRequestStatus(match.id) === 'accepted' && (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {getRequestStatus(match.id) === 'declined' && (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {!getRequestStatus(match.id) && (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {getButtonState(match.id).text}
                    </button>
                  </div>
                ))
              )}
              </div>
            </>
          )}
        </div>

        {/* Join Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep-navy">Send Join Request</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(null);
                    setRequestMessage("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Send a join request to the match creator. You can include an optional message.
                </p>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Hi! I'd like to join your match. I'm a [skill level] player and looking forward to playing!"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {requestMessage.length}/500 characters
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(null);
                    setRequestMessage("");
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleJoinRequest(showRequestModal, requestMessage)}
                  disabled={loadingRequests[showRequestModal]}
                  className="flex-1 py-2 px-4 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loadingRequests[showRequestModal] ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinMatch;
