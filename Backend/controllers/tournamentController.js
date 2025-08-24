import { 
  createTournament, 
  getAllTournaments, 
  registerForTournament, 
  getTournamentRegistrations, 
  getUserRegisteredTournaments,
  getUserTournamentRegistrations,
  updateTournamentRegistration,
  deleteTournamentRegistration,
  getOwnerTournaments,
  getOwnerTournamentStats,
  getOwnerTournamentAnalytics,
  updateTournament,
  deleteTournament
} from "../models/tournamentModel.js";
import { createNotification } from '../models/notificationModel.js';
import { TournamentNotifications } from '../services/notificationService.js';

// Controller to handle tournament creation
export async function createTournamentController(req, res) {
  try {
    const {
      name,
      description,
      date, 
      time,
      location,
      fee,
      maxTeams,
      organizerContact,
    } = req.body;

    // Basic validation (allow fee = 0)
    const feeProvided = !(fee === undefined || fee === null || fee === "");
    const maxTeamsProvided = !(maxTeams === undefined || maxTeams === null || maxTeams === "");

    if (
      !name ||
      !description ||
      !date ||
      !time ||
      !location ||
      !feeProvided ||
      !maxTeamsProvided ||
      !organizerContact
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Numeric constraints
    const feeNum = Number(fee);
    const maxTeamsNum = Number(maxTeams);
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      return res.status(400).json({ error: "Fee must be a non-negative number." });
    }
    if (!Number.isInteger(maxTeamsNum) || maxTeamsNum <= 0) {
      return res.status(400).json({ error: "Max teams must be a positive integer." });
    }

    // owner_id should come from authenticated user (e.g., req.user.id)
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    const tournament = await createTournament({
      name,
      description,
      date,
      time,
      location,
      fee,
      maxTeams,
      organizerContact,
      owner_id,
    });

    // Send comprehensive tournament creation notifications
    await TournamentNotifications.tournamentCreated(tournament.id, owner_id);

    return res
      .status(201)
      .json({ message: "Tournament created successfully.", tournament });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to list all tournaments for players to view/join
export async function listTournamentsController(req, res) {
  try {
    const tournaments = await getAllTournaments();
    return res.status(200).json({ tournaments });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to handle tournament registration
export async function registerForTournamentController(req, res) {
  try {
    const { tournament_id, team_name, player1_name, player1_phone, player2_name, player2_phone } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    // Validate required fields
    if (!tournament_id || !team_name || !player1_name || !player1_phone) {
      return res.status(400).json({ error: "Tournament ID, team name, player 1 name and phone are required." });
    }

    // Check if tournament exists and is not full
    const tournaments = await getAllTournaments();
    const tournament = tournaments.find(t => t.id == tournament_id);
    
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found." });
    }

    // Check current registrations
    const registrations = await getTournamentRegistrations(tournament_id);
    if (registrations.length >= tournament.maxTeams) {
      return res.status(400).json({ error: "Tournament is full." });
    }

    // Check if user already registered for this tournament
    const existingRegistration = registrations.find(r => r.user_id == user_id);
    if (existingRegistration) {
      return res.status(400).json({ error: "You are already registered for this tournament." });
    }

    const registration = await registerForTournament({
      tournament_id,
      user_id,
      team_name,
      player1_name,
      player1_phone,
      player2_name,
      player2_phone
    });

    // Send comprehensive tournament registration notifications
    await TournamentNotifications.playerRegistered(tournament_id, user_id, registration.id);

    return res.status(201).json({ 
      message: "Successfully registered for tournament!", 
      registration 
    });

  } catch (error) {
    console.error("Error registering for tournament:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get tournament registrations
export async function getTournamentRegistrationsController(req, res) {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid tournament ID provided." });
    }
    
    const registrations = await getTournamentRegistrations(parseInt(id));
    return res.status(200).json({ registrations });
  } catch (error) {
    console.error("Error fetching tournament registrations:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get user's registered tournaments
export async function getUserRegisteredTournamentsController(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    const registrations = await getUserRegisteredTournaments(user_id);
    const tournamentIds = registrations.map(r => r.tournament_id);
    return res.status(200).json({ tournamentIds });
  } catch (error) {
    console.error("Error fetching user registered tournaments:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get user's tournament registrations with full details
export async function getUserTournamentRegistrationsController(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    const registrations = await getUserTournamentRegistrations(user_id);
    return res.status(200).json({ registrations });
  } catch (error) {
    console.error("Error fetching user tournament registrations:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to update tournament registration
export async function updateTournamentRegistrationController(req, res) {
  try {
    const { id } = req.params;
    const { team_name, player1_name, player1_phone, player2_name, player2_phone } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid registration ID provided." });
    }

    // Validate required fields
    if (!team_name || !player1_name || !player1_phone) {
      return res.status(400).json({ error: "Team name, player 1 name and phone are required." });
    }

    const updatedRegistration = await updateTournamentRegistration(parseInt(id), user_id, {
      team_name,
      player1_name,
      player1_phone,
      player2_name,
      player2_phone
    });

    if (!updatedRegistration) {
      return res.status(404).json({ error: "Registration not found or you don't have permission to update it." });
    }

    // Create notification for successful update
    await createNotification({
      user_id,
      type: 'tournament_update',
      title: 'Tournament Registration Updated',
      message: `Your registration for "${updatedRegistration.tournament_name}" has been updated successfully.`,
      related_id: updatedRegistration.tournament_id
    });

    return res.status(200).json({ 
      message: "Registration updated successfully!", 
      registration: updatedRegistration 
    });

  } catch (error) {
    console.error("Error updating tournament registration:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to delete tournament registration
export async function deleteTournamentRegistrationController(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid registration ID provided." });
    }

    const deletedRegistration = await deleteTournamentRegistration(parseInt(id), user_id);

    if (!deletedRegistration) {
      return res.status(404).json({ error: "Registration not found or you don't have permission to delete it." });
    }

    // Create notification for successful deletion
    await createNotification({
      user_id,
      type: 'tournament_withdrawal',
      title: 'Tournament Registration Withdrawn',
      message: `You have successfully withdrawn from "${deletedRegistration.tournament_name}".`,
      related_id: deletedRegistration.tournament_id
    });

    return res.status(200).json({ 
      message: "Registration deleted successfully!", 
      registration: deletedRegistration 
    });

  } catch (error) {
    console.error("Error deleting tournament registration:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get owner's tournaments
export async function getOwnerTournamentsController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    const tournaments = await getOwnerTournaments(owner_id);
    return res.status(200).json({ tournaments });
  } catch (error) {
    console.error("Error fetching owner tournaments:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get owner tournament statistics
export async function getOwnerTournamentStatsController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    const stats = await getOwnerTournamentStats(owner_id);
    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching owner tournament stats:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to get owner tournament analytics
export async function getOwnerTournamentAnalyticsController(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    const analytics = await getOwnerTournamentAnalytics(owner_id);
    return res.status(200).json({ analytics });
  } catch (error) {
    console.error("Error fetching owner tournament analytics:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to update tournament
export async function updateTournamentController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid tournament ID provided." });
    }

    const {
      name,
      date,
      time,
      location,
      fee,
      maxTeams,
      organizerContact
    } = req.body;

    const updatedTournament = await updateTournament(parseInt(id), owner_id, {
      name,
      date,
      time,
      location,
      fee,
      maxTeams,
      organizerContact
    });

    if (!updatedTournament) {
      return res.status(404).json({ error: "Tournament not found or you don't have permission to update it." });
    }

    // Send tournament updated notifications
    const changes = {};
    if (name) changes.name = name;
    if (date) changes.date = date;
    if (time) changes.time = time;
    if (location) changes.location = location;
    if (fee !== undefined) changes.fee = fee;
    if (maxTeams) changes.maxTeams = maxTeams;
    if (organizerContact) changes.organizerContact = organizerContact;
    
    await TournamentNotifications.tournamentUpdated(parseInt(id), owner_id, changes);

    return res.status(200).json({ 
      message: "Tournament updated successfully!", 
      tournament: updatedTournament 
    });

  } catch (error) {
    console.error("Error updating tournament:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Controller to delete tournament
export async function deleteTournamentController(req, res) {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;
    
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid tournament ID provided." });
    }

    const deletedTournament = await deleteTournament(parseInt(id), owner_id);

    if (!deletedTournament) {
      return res.status(404).json({ error: "Tournament not found or you don't have permission to delete it." });
    }

    // Send tournament deleted notifications before deletion
    await TournamentNotifications.tournamentDeleted(parseInt(id), owner_id, deletedTournament);

    return res.status(200).json({ 
      message: "Tournament deleted successfully!", 
      tournament: deletedTournament 
    });

  } catch (error) {
    console.error("Error deleting tournament:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
