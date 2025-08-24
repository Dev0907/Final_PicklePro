import express from 'express';
import {
  createMatch,
  getAllMatches,
  getMatchById,
  joinMatch,
  leaveMatch,
  getUserMatches,
  updateMatch,
  cancelMatch,
  deleteMatch,
  getParticipatingMatchIds,
  getMatchParticipants
} from '../controllers/matchController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllMatches);
router.get('/participating', authenticateToken, getParticipatingMatchIds);
router.get('/:id/participants', getMatchParticipants);
router.get('/:id', getMatchById);

// Protected routes
router.use(authenticateToken);

// Create a new match
router.post('/create', createMatch);
// Join a match
router.post('/join', joinMatch);
// Leave a match
router.post('/leave', leaveMatch);
// Get user's matches (created and joined)
router.get('/user/matches', getUserMatches);
// Update a match (only creator can update)
router.put('/:id', updateMatch);
// Cancel a match (only creator can cancel)
router.patch('/:id/cancel', cancelMatch);
// Delete a match (only creator can delete)
router.delete('/:id', deleteMatch);

export default router; 