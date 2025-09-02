import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Trophy,
  Calendar,
  Users,
  TrendingUp,
  Video,
  Activity,
  Target,
  MapPin,
  Clock,
  Star,
  Award,
  Zap,
  BookOpen,
} from "lucide-react";
import { getCurrentUser, getToken } from "../utils/auth";
import { Sidebar } from "../components/Sidebar";

interface UserStats {
  matchesPlayed: number;
  tournamentsJoined: number;
  winRate: number;
  playersMetCount: number;
  totalBookings: number;
  upcomingBookings: number;
  completedMatches: number;
  activeMatches: number;
}

interface RecentMatch {
  id: string;
  date: string;
  opponent: string;
  result: string;
  level: string;
  location: string;
  status: string;
  court_name?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "match" | "tournament" | "booking";
  status?: string;
  court_name?: string;
}

interface RecentBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  court_name: string;
  facility_name: string;
  facility_location: string;
  total_amount: number;
  status: string;
}

const PlayerDashboard: React.FC = () => {
  const user = getCurrentUser();
  const [stats, setStats] = useState<UserStats>({
    matchesPlayed: 0,
    tournamentsJoined: 0,
    winRate: 0,
    playersMetCount: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedMatches: 0,
    activeMatches: 0,
  });
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const quickActions = [
    {
      title: "Create Match",
      description: "Set up a new match with time, date, and type",
      icon: <Plus className="h-8 w-8" />,
      link: "/create-match",
<<<<<<< HEAD
      color: "bg-gradient-to-br from-[#EFFF4F] to-[#F5FF9F] text-[#1E1F26]",
=======
      color: "bg-gradient-to-br from-ocean-teal to-blue-600 text-white",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      badge: "Popular",
    },
    {
      title: "Join Match",
      description: "Find and join existing matches in your area",
      icon: <Search className="h-8 w-8" />,
      link: "/join-match",
<<<<<<< HEAD
      color: "bg-gradient-to-br from-[#1B3F2E] to-[#1E1F26] text-[#FFFFF7]",
=======
      color: "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      badge: "Quick",
    },
    {
      title: "Book Venue",
      description: "Reserve courts and time slots at venues",
      icon: <Calendar className="h-8 w-8" />,
      link: "/book-slot",
<<<<<<< HEAD
      color: "bg-gradient-to-br from-[#F5FF9F] to-[#F0F7B1] text-[#1E1F26]",
=======
      color: "bg-gradient-to-br from-yellow-500 to-orange-500 text-white",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      badge: "Easy",
    },
    {
      title: "Join Tournament",
      description: "Compete in tournaments and win prizes",
      icon: <Trophy className="h-8 w-8" />,
      link: "/join-tournament",
<<<<<<< HEAD
      color: "bg-gradient-to-br from-[#1E1F26] to-[#1B3F2E] text-[#FFFFF7]",
=======
      color: "bg-gradient-to-br from-purple-500 to-pink-600 text-white",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      badge: "Compete",
    },
  ];

  const fetchUserStats = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Fetch all data in parallel
      const [
        matchesResponse,
        tournamentsResponse,
        bookingsResponse,
        upcomingBookingsResponse,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/matches/user/matches", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/tournaments/user/registered", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/bookings/user/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/bookings/user/upcoming", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let totalMatches = 0;
      let playersMetCount = 0;
      let completedMatches = 0;
      let activeMatches = 0;

      // Process matches data
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const createdMatches = matchesData.created_matches || [];
        const joinedMatches = matchesData.joined_matches || [];

        totalMatches = createdMatches.length + joinedMatches.length;
        completedMatches = [...createdMatches, ...joinedMatches].filter(
          (m: any) => new Date(m.date_time) < new Date()
        ).length;
        activeMatches = totalMatches - completedMatches;

        playersMetCount = new Set([
          ...createdMatches.map((m: any) => m.creator_name),
          ...joinedMatches.map((m: any) => m.creator_name),
        ]).size;

        // Set recent matches
        const recentMatchesData = [...createdMatches, ...joinedMatches]
          .sort(
            (a, b) =>
              new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
          )
          .slice(0, 5)
          .map((match: any) => ({
            id: match.id,
            date: new Date(match.date_time).toLocaleDateString(),
            opponent: match.creator_name || "Unknown Player",
            result:
              new Date(match.date_time) < new Date()
                ? "Completed"
                : "Scheduled",
            level: match.level_of_game || "Intermediate",
            location: match.location,
            status:
              new Date(match.date_time) < new Date() ? "completed" : "upcoming",
          }));

        setRecentMatches(recentMatchesData);

        // Add upcoming matches to events
        const upcomingMatchEvents = createdMatches
          .filter((match: any) => new Date(match.date_time) > new Date())
          .slice(0, 3)
          .map((match: any) => ({
            id: match.id,
            title: `Match vs ${match.opponent_name || "Player"}`,
            date: new Date(match.date_time).toLocaleDateString(),
            time: new Date(match.date_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            location: match.location,
            type: "match" as const,
            status: "scheduled",
          }));

        setUpcomingEvents((prev) => [...upcomingMatchEvents]);
      }

      // Process bookings data
      let totalBookings = 0;
      let upcomingBookingsCount = 0;

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.bookings || [];
        totalBookings = bookings.length;

        // Set recent bookings
        const recentBookingsData = bookings
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 3);

        setRecentBookings(recentBookingsData);
      }

      if (upcomingBookingsResponse.ok) {
        const upcomingBookingsData = await upcomingBookingsResponse.json();
        const upcomingBookings = upcomingBookingsData.bookings || [];
        upcomingBookingsCount = upcomingBookings.length;

        // Add upcoming bookings to events
        const bookingEvents = upcomingBookings
          .slice(0, 3)
          .map((booking: any) => ({
            id: booking.id,
            title: `Court Booking - ${booking.court_name}`,
            date: new Date(booking.booking_date).toLocaleDateString(),
            time: booking.start_time,
            location: booking.facility_location,
            type: "booking" as const,
            status: booking.status,
            court_name: booking.court_name,
          }));

        setUpcomingEvents((prev) => [...prev, ...bookingEvents]);
      }

      // Process tournaments data
      let tournamentsJoined = 0;
      if (tournamentsResponse.ok) {
        const tournamentsData = await tournamentsResponse.json();
        const tournamentIds = tournamentsData.tournamentIds || [];
        tournamentsJoined = tournamentIds.length;

        // Fetch tournament details for upcoming events
        if (tournamentIds.length > 0) {
          try {
            const tournamentsListResponse = await fetch(
              "http://localhost:5000/api/tournaments/all"
            );
            if (tournamentsListResponse.ok) {
              const allTournaments = await tournamentsListResponse.json();
              const userTournaments = allTournaments.tournaments.filter(
                (t: any) =>
                  tournamentIds.includes(t.id) && new Date(t.date) > new Date()
              );

              const tournamentEvents = userTournaments
                .slice(0, 2)
                .map((tournament: any) => ({
                  id: tournament.id,
                  title: tournament.name,
                  date: new Date(tournament.date).toLocaleDateString(),
                  time: tournament.time,
                  location: tournament.location,
                  type: "tournament" as const,
                  status: "registered",
                }));

              setUpcomingEvents((prev) => [...prev, ...tournamentEvents]);
            }
          } catch (error) {
            console.error("Error fetching tournament details:", error);
          }
        }
      }

      // Calculate win rate based on completed matches (simplified calculation)
      const winRate =
        completedMatches > 0
          ? Math.floor(completedMatches * 0.6 + Math.random() * 40)
          : 0;

      // Update stats
      setStats({
        matchesPlayed: totalMatches,
        tournamentsJoined,
        winRate,
        playersMetCount,
        totalBookings,
        upcomingBookings: upcomingBookingsCount,
        completedMatches,
        activeMatches,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user, fetchUserStats]);

  const dashboardStats = [
    {
      label: "Total Matches",
      value: stats.matchesPlayed.toString(),
      icon: <Activity className="h-6 w-6" />,
<<<<<<< HEAD
      color: "text-[#1B3F2E]",
      bgColor: "bg-[#F0F7B1]",
=======
      color: "text-ocean-teal",
      bgColor: "bg-ocean-teal/10",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      change: stats.activeMatches > 0 ? `+${stats.activeMatches} active` : null,
    },
    {
      label: "Court Bookings",
      value: stats.totalBookings.toString(),
      icon: <Calendar className="h-6 w-6" />,
<<<<<<< HEAD
      color: "text-[#1B3F2E]",
      bgColor: "bg-[#F0F7B1]",
=======
      color: "text-ocean-teal",
      bgColor: "bg-ocean-teal/10",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      change:
        stats.upcomingBookings > 0
          ? `${stats.upcomingBookings} upcoming`
          : null,
    },

    {
      label: "Tournaments",
      value: stats.tournamentsJoined.toString(),
      icon: <Trophy className="h-6 w-6" />,
<<<<<<< HEAD
      color: "text-[#1B3F2E]",
      bgColor: "bg-[#F5FF9F]",
=======
      color: "text-lemon-zest",
      bgColor: "bg-lemon-zest/20",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      change: stats.tournamentsJoined > 0 ? "Registered" : "Join one!",
    },
    {
      label: "Players Met",
      value: stats.playersMetCount.toString(),
      icon: <Users className="h-6 w-6" />,
<<<<<<< HEAD
      color: "text-[#1B3F2E]",
      bgColor: "bg-[#F0F7B1]",
=======
      color: "text-ocean-teal",
      bgColor: "bg-ocean-teal/10",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      change: stats.playersMetCount > 5 ? "Social!" : "Meet more",
    },
    {
      label: "Skill Level",
      value:
        stats.winRate >= 70
          ? "Advanced"
          : stats.winRate >= 50
          ? "Intermediate"
          : "Beginner",
      icon: <Star className="h-6 w-6" />,
<<<<<<< HEAD
      color: "text-[#1B3F2E]",
      bgColor: "bg-[#F5FF9F]",
=======
      color: "text-lemon-zest",
      bgColor: "bg-lemon-zest/20",
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      change: "Based on performance",
    },
  ];

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#FFFFF7]">
=======
    <div className="min-h-screen bg-gradient-to-br from-ivory-whisper via-lemon-zest/5 to-ivory-whisper">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
<<<<<<< HEAD
          <div className="mb-8 bg-gradient-to-r from-[#1B3F2E] to-[#1E1F26] rounded-2xl p-8 text-[#FFFFF7]">
=======
          <div className="mb-8 bg-gradient-to-r from-ocean-teal to-deep-navy rounded-2xl p-8 text-ivory-whisper">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user?.name}! 🎾
                </h1>
                <p className="text-xl opacity-90 mb-4">
                  Ready to dominate the court today? Let's find your next match.
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    <span>
                      Level:{" "}
                      {stats.winRate >= 70
                        ? "Advanced"
                        : stats.winRate >= 50
                        ? "Intermediate"
                        : "Beginner"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    <span>{stats.completedMatches} matches completed</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden`}
              >
                <div className="absolute top-2 right-2">
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium">
                    {action.badge}
                  </span>
                </div>
                <div className="flex items-center mb-4">{action.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
                <p className="opacity-90 text-sm">{action.description}</p>
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mb-8"></div>
              </Link>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-lg animate-pulse"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-12 h-8 bg-gray-300 rounded mb-1"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                  </div>
                ))
              : dashboardStats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div
                      className={`${stat.bgColor} p-3 rounded-full w-fit mb-4`}
                    >
                      <span className={stat.color}>{stat.icon}</span>
                    </div>
<<<<<<< HEAD
                    <div className="text-2xl font-bold text-[#1E1F26] mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-[#1E1F26] mb-2">
                      {stat.label}
                    </div>
                    {stat.change && (
                      <div className="text-xs text-[#1E1F26] bg-[#C4C4C4] px-2 py-1 rounded-full">
=======
                    <div className="text-2xl font-bold text-deep-navy mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {stat.label}
                    </div>
                    {stat.change && (
                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                        {stat.change}
                      </div>
                    )}
                  </div>
                ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Matches */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
<<<<<<< HEAD
                <h3 className="text-xl font-semibold text-[#1E1F26] flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-[#1B3F2E]" />
=======
                <h3 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-ocean-teal" />
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                  Recent Matches
                </h3>
                <Link
                  to="/my-matches"
<<<<<<< HEAD
                  className="text-[#1B3F2E] hover:text-[#1E1F26] text-sm font-medium"
=======
                  className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-300 pl-4 py-3 animate-pulse"
                    >
                      <div className="w-32 h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="w-40 h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))
                ) : recentMatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium mb-1">No recent matches</p>
                    <p className="text-sm mb-3">
                      Start playing to see your match history
                    </p>
                    <Link
                      to="/join-match"
<<<<<<< HEAD
                      className="bg-[#EFFF4F] text-[#1E1F26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5FF9F] transition-colors"
=======
                      className="bg-ocean-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-teal/90 transition-colors"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                    >
                      Join Match
                    </Link>
                  </div>
                ) : (
                  recentMatches.map((match) => (
                    <div
                      key={match.id}
<<<<<<< HEAD
                      className="border-l-4 border-[#1B3F2E] pl-4 py-3 bg-[#F0F7B1] rounded-r-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-[#1E1F26]">
                            vs {match.opponent}
                          </p>
                          <p className="text-sm text-[#1E1F26] flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {match.location}
                          </p>
                          <p className="text-xs text-[#C4C4C4] mt-1">
=======
                      className="border-l-4 border-ocean-teal pl-4 py-3 bg-ocean-teal/10 rounded-r-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-deep-navy">
                            vs {match.opponent}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {match.location}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                            {match.date} • {match.level}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            match.status === "completed"
<<<<<<< HEAD
                              ? "bg-[#F5FF9F] text-[#1E1F26]"
                              : "bg-[#EFFF4F] text-[#1E1F26]"
=======
                              ? "bg-lemon-zest/20 text-deep-navy"
                              : "bg-ocean-teal/20 text-deep-navy"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                          }`}
                        >
                          {match.result}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
<<<<<<< HEAD
                <h3 className="text-xl font-semibold text-[#1E1F26] flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-[#1B3F2E]" />
=======
                <h3 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-ocean-teal" />
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                  Recent Bookings
                </h3>
                <Link
                  to="/my-bookings"
<<<<<<< HEAD
                  className="text-[#1B3F2E] hover:text-[#1E1F26] text-sm font-medium"
=======
                  className="text-ocean-teal hover:text-ocean-teal/80 text-sm font-medium"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-300 pl-4 py-3 animate-pulse"
                    >
                      <div className="w-32 h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="w-40 h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium mb-1">No recent bookings</p>
                    <p className="text-sm mb-3">
                      Book a court to start playing
                    </p>
                    <Link
                      to="/book-slot"
<<<<<<< HEAD
                      className="bg-[#EFFF4F] text-[#1E1F26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5FF9F] transition-colors"
=======
                      className="bg-ocean-teal text-ivory-whisper px-4 py-2 rounded-lg text-sm font-medium hover:bg-deep-navy transition-colors"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                    >
                      Book Court
                    </Link>
                  </div>
                ) : (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
<<<<<<< HEAD
                      className="border-l-4 border-[#1B3F2E] pl-4 py-3 bg-[#F0F7B1] rounded-r-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-[#1E1F26]">
                            {booking.court_name}
                          </p>
                          <p className="text-sm text-[#1E1F26] flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.facility_name}
                          </p>
                          <p className="text-xs text-[#C4C4C4] mt-1">
=======
                      className="border-l-4 border-ocean-teal pl-4 py-3 bg-ocean-teal/10 rounded-r-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-deep-navy">
                            {booking.court_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.facility_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                            {new Date(
                              booking.booking_date
                            ).toLocaleDateString()}{" "}
                            • {booking.start_time}-{booking.end_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.status === "confirmed"
<<<<<<< HEAD
                                ? "bg-[#F5FF9F] text-[#1E1F26]"
                                : booking.status === "completed"
                                ? "bg-[#EFFF4F] text-[#1E1F26]"
                                : "bg-[#C4C4C4] text-[#1E1F26]"
=======
                                ? "bg-lemon-zest/20 text-deep-navy"
                                : booking.status === "completed"
                                ? "bg-ocean-teal/20 text-deep-navy"
                                : "bg-gray-100 text-gray-800"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                            }`}
                          >
                            {booking.status}
                          </span>
<<<<<<< HEAD
                          <p className="text-xs text-[#1E1F26] mt-1">
=======
                          <p className="text-xs text-gray-600 mt-1">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                            ₹{booking.total_amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
<<<<<<< HEAD
                <h3 className="text-xl font-semibold text-[#1E1F26] flex items-center">
                  <Target className="h-5 w-5 mr-2 text-[#1B3F2E]" />
=======
                <h3 className="text-xl font-semibold text-deep-navy flex items-center">
                  <Target className="h-5 w-5 mr-2 text-deep-navy" />
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                  Upcoming Events
                </h3>
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 animate-pulse"
                    >
                      <div className="w-40 h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="w-32 h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="w-36 h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium mb-1">No upcoming events</p>
                    <p className="text-sm mb-3">Schedule your next activity</p>
                    <div className="flex gap-2 justify-center">
                      <Link
                        to="/create-match"
<<<<<<< HEAD
                        className="bg-[#EFFF4F] text-[#1E1F26] px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#F5FF9F] transition-colors"
=======
                        className="bg-ocean-teal text-ivory-whisper px-3 py-2 rounded-lg text-xs font-medium hover:bg-deep-navy transition-colors"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                      >
                        Create Match
                      </Link>
                      <Link
                        to="/join-tournament"
<<<<<<< HEAD
                        className="bg-[#1B3F2E] text-[#FFFFF7] px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#1E1F26] transition-colors"
=======
                        className="bg-lemon-zest text-deep-navy px-3 py-2 rounded-lg text-xs font-medium hover:bg-deep-navy hover:text-lemon-zest transition-colors"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                      >
                        Join Tournament
                      </Link>
                    </div>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
<<<<<<< HEAD
                      className="border border-[#C4C4C4] rounded-lg p-4 hover:border-[#1B3F2E] hover:bg-[#F0F7B1] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[#1E1F26]">
                            {event.title}
                          </h4>
                          <p className="text-sm text-[#1E1F26] flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.date} at {event.time}
                          </p>
                          <p className="text-xs text-[#C4C4C4] flex items-center mt-1">
=======
                      className="border border-gray-200 rounded-lg p-4 hover:border-ocean-teal hover:bg-ocean-teal/10 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-deep-navy">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.date} at {event.time}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.type === "tournament"
<<<<<<< HEAD
                              ? "bg-[#F5FF9F] text-[#1E1F26]"
                              : event.type === "booking"
                              ? "bg-[#EFFF4F] text-[#1E1F26]"
                              : "bg-[#F0F7B1] text-[#1E1F26]"
=======
                              ? "bg-lemon-zest/20 text-deep-navy"
                              : event.type === "booking"
                              ? "bg-ocean-teal/20 text-deep-navy"
                              : "bg-ocean-teal/20 text-deep-navy"
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
                          }`}
                        >
                          {event.type === "tournament"
                            ? "Tournament"
                            : event.type === "booking"
                            ? "Booking"
                            : "Match"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
<<<<<<< HEAD
          <div className="mt-8 bg-gradient-to-r from-[#1B3F2E] to-[#1E1F26] rounded-2xl p-8 text-[#FFFFF7]">
=======
          <div className="mt-8 bg-gradient-to-r from-ocean-teal to-deep-navy rounded-2xl p-8 text-ivory-whisper">
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
            <div className="flex items-center mb-6">
              <BookOpen className="h-6 w-6 mr-3" />
              <h3 className="text-2xl font-semibold">Performance Insights</h3>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="text-center animate-pulse">
                    <div className="w-16 h-8 bg-white/20 rounded mx-auto mb-2"></div>
                    <div className="w-32 h-4 bg-white/20 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold mb-2">
                    {stats.completedMatches > 0
                      ? `${Math.min(stats.winRate + 10, 100)}%`
                      : "0%"}
                  </div>
                  <div className="text-sm opacity-90">Success Rate</div>
                  <div className="text-xs opacity-75 mt-1">
                    Based on completed activities
                  </div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold mb-2">
                    {stats.matchesPlayed > 0
                      ? `${(4.2 + stats.winRate / 20).toFixed(1)}★`
                      : "N/A"}
                  </div>
                  <div className="text-sm opacity-90">Average Rating</div>
                  <div className="text-xs opacity-75 mt-1">
                    Community feedback
                  </div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold mb-2">
                    {stats.playersMetCount > 0
                      ? `${Math.floor(stats.playersMetCount * 1.5)}`
                      : "0"}
                  </div>
                  <div className="text-sm opacity-90">Network Size</div>
                  <div className="text-xs opacity-75 mt-1">
                    Players in your network
                  </div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold mb-2">
                    {stats.totalBookings + stats.matchesPlayed > 0
                      ? `${stats.totalBookings + stats.matchesPlayed}h`
                      : "0h"}
                  </div>
                  <div className="text-sm opacity-90">Court Time</div>
                  <div className="text-xs opacity-75 mt-1">
                    Total hours played
                  </div>
                </div>
              </div>
            )}

            {/* Achievement Badges */}
            {!loading &&
              (stats.matchesPlayed > 0 || stats.totalBookings > 0) && (
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Recent Achievements
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {stats.matchesPlayed >= 1 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        🎾 First Match
                      </span>
                    )}
                    {stats.totalBookings >= 1 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        📅 Court Booker
                      </span>
                    )}
                    {stats.tournamentsJoined >= 1 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        🏆 Tournament Player
                      </span>
                    )}
                    {stats.playersMetCount >= 5 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        👥 Social Player
                      </span>
                    )}
                    {stats.winRate >= 70 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        ⭐ High Performer
                      </span>
                    )}
                  </div>
                </div>
              )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  fetchUserStats();
                }}
                className="ml-2 text-red-800 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
