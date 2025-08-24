import express from 'express';
import {
  createJoinRequestHandler,
  getMyMatchRequests,
  getUserJoinRequests,
  getMatchJoinRequests,
  updateJoinRequestStatusHandler,
  deleteJoinRequestHandler,
  getJoinRequestStatistics
} from '../controllers/joinRequestController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a join request
router.post('/', createJoinRequestHandler);

// Get join requests for matches created by the user
router.get('/my-matches', getMyMatchRequests);

// Get user's sent join requests
router.get('/my-requests', getUserJoinRequests);

// Get join requests for a specific match
router.get('/match/:match_id', getMatchJoinRequests);

// Update join request status (accept/decline)
router.put('/:id/status', updateJoinRequestStatusHandler);

// Delete join request
router.delete('/:id', deleteJoinRequestHandler);

// Get join request statistics
router.get('/stats', getJoinRequestStatistics);

export default router; 