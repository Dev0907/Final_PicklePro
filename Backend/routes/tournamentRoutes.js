import express from 'express';
import { 
  createTournamentController, 
  listTournamentsController, 
  registerForTournamentController,
  getTournamentRegistrationsController,
  getUserRegisteredTournamentsController,
  getUserTournamentRegistrationsController,
  updateTournamentRegistrationController,
  deleteTournamentRegistrationController,
  getOwnerTournamentsController,
  getOwnerTournamentStatsController,
  getOwnerTournamentAnalyticsController,
  updateTournamentController,
  deleteTournamentController
} from '../controllers/tournamentController.js';
import { authenticateOwner, authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to create a tournament (owner only)
router.post('/create', authenticateOwner, createTournamentController);

// Public route to fetch all tournaments
router.get('/all', listTournamentsController);

// Route to register for a tournament (authenticated users only)
router.post('/register', authenticateToken, registerForTournamentController);

// Route to get user's registered tournaments
router.get('/user/registered', authenticateToken, getUserRegisteredTournamentsController);

// Route to get user's tournament registrations with full details
router.get('/user/registrations', authenticateToken, getUserTournamentRegistrationsController);

// Route to get tournament registrations
router.get('/:id/registrations', getTournamentRegistrationsController);

// Route to update tournament registration
router.put('/registration/:id', authenticateToken, updateTournamentRegistrationController);

// Route to delete tournament registration
router.delete('/registration/:id', authenticateToken, deleteTournamentRegistrationController);

// Owner tournament management routes
router.get('/owner/tournaments', authenticateOwner, getOwnerTournamentsController);
router.get('/owner/stats', authenticateOwner, getOwnerTournamentStatsController);
router.get('/owner/analytics', authenticateOwner, getOwnerTournamentAnalyticsController);
router.put('/:id', authenticateOwner, updateTournamentController);
router.delete('/:id', authenticateOwner, deleteTournamentController);

export default router;