import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Phone,
  Calendar,
  MapPin,
  Trophy,
} from "lucide-react";
import { Tournament } from "../types";

interface Registration {
  id: string;
  team_name: string;
  player1_name: string;
  player1_phone: string;
  player2_name?: string;
  player2_phone?: string;
  registration_date: string;
  registered_by_name: string;
  registered_by_email: string;
}

export const TournamentRegistrations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch tournament details
        const tournamentsRes = await fetch(
          "http://localhost:5000/api/tournaments/all"
        );
        const tournamentsData = await tournamentsRes.json();
        const tournamentData = tournamentsData.tournaments?.find(
          (t: Tournament) => t.id === id
        );

        if (tournamentData) {
          setTournament(tournamentData);
        }

        // Fetch registrations
        const registrationsRes = await fetch(
          `http://localhost:5000/api/tournaments/${id}/registrations`
        );
        const registrationsData = await registrationsRes.json();

        if (registrationsRes.ok) {
          setRegistrations(registrationsData.registrations || []);
        } else {
          setError(registrationsData.error || "Failed to fetch registrations");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-whisper flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament registrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory-whisper flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-ocean-teal text-white px-4 py-2 rounded-lg hover:bg-ocean-teal/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-whisper py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center text-ocean-teal hover:text-ocean-teal/80 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tournaments
          </button>

          {tournament && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-deep-navy mb-2">
                    {tournament.name}
                  </h1>
                  <p className="text-gray-600">{tournament.description}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tournament.fee === 0
                        ? "bg-green-100 text-green-800"
                        : "bg-lemon-zest text-deep-navy"
                    }`}
                  >
                    {tournament.fee === 0 ? "FREE" : `₹${tournament.fee}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-deep-navy">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-ocean-teal" />
                  {new Date(tournament.date).toLocaleDateString()} at{" "}
                  {tournament.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-ocean-teal" />
                  {tournament.location}
                </div>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-ocean-teal" />
                  {registrations.length} / {tournament.maxTeams} teams
                  registered
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registrations */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-deep-navy flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Registered Teams ({registrations.length})
              </h2>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No registrations yet
              </h3>
              <p className="text-gray-500">
                Teams will appear here once they register for the tournament
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {registrations.map((registration, index) => (
                <div key={registration.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-deep-navy mb-1">
                        {registration.team_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Registered on{" "}
                        {new Date(
                          registration.registration_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-sky-mist text-deep-navy px-3 py-1 rounded-full text-sm font-medium">
                      Team #{index + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Player 1 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-deep-navy mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Player 1
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Name:</strong> {registration.player1_name}
                        </p>
                        <p className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <strong>Phone:</strong> {registration.player1_phone}
                        </p>
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-deep-navy mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Player 2
                      </h4>
                      {registration.player2_name ? (
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Name:</strong> {registration.player2_name}
                          </p>
                          <p className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            <strong>Phone:</strong> {registration.player2_phone}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No second player registered
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Registered by: {registration.registered_by_name} (
                      {registration.registered_by_email})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
