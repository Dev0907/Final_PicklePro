import {
  createJoinRequest,
  getJoinRequestsByMatch,
  getJoinRequestsByUser,
  updateJoinRequestStatus,
  getJoinRequestById,
  deleteJoinRequest,
  hasExistingRequest,
  getPendingRequestsForUserMatches,
  getJoinRequestStats,
  getUserJoinRequestStats
} from '../models/joinRequestModel.js';
import { createNotification } from '../models/notificationModel.js';
import { getMatchById, updateMatchParticipantCount } from '../models/matchModel.js';
import { MatchNotifications } from '../services/notificationService.js';

// Create a join request
export const createJoinRequestHandler = async (req, res) => {
  try {
    const { match_id, message } = req.body;
    const user_id = req.user.user_id || req.user.id;

    if (!match_id) {
      return res.status(400).json({ error: 'Match ID is required' });
    }

    // Check if user already has a pending request
    const existingRequest = await hasExistingRequest(match_id, user_id);
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this match' });
    }

    // Get match details
    const match = await getMatchById(match_id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is trying to join their own match
    if (match.user_id === user_id) {
      return res.status(400).json({ error: 'You cannot join your own match' });
    }

    const joinRequest = await createJoinRequest({
      match_id,
      user_id,
      message
    });

    // Send comprehensive join request notifications
    if (match) {
      await MatchNotifications.joinRequestSent(match_id, user_id, joinRequest.id);
    }

    res.status(201).json({ message: 'Join request sent successfully', joinRequest });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ error: 'Failed to create join request' });
  }
};

// Get join requests for matches created by user
export const getMyMatchRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id || req.user.id;
    const requests = await getPendingRequestsForUserMatches(user_id);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching match requests:', error);
    res.status(500).json({ error: 'Failed to fetch match requests' });
  }
};

// Get user's sent join requests
export const getUserJoinRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id || req.user.id;
    const requests = await getJoinRequestsByUser(user_id);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
};

// Get join requests for a specific match
export const getMatchJoinRequests = async (req, res) => {
  try {
    const { match_id } = req.params;
    const requests = await getJoinRequestsByMatch(match_id);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching match join requests:', error);
    res.status(500).json({ error: 'Failed to fetch match join requests' });
  }
};

// Update join request status (accept/decline)
export const updateJoinRequestStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either accepted or declined' });
    }

    const joinRequest = await getJoinRequestById(id);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request has already been processed' });
    }

    const updatedRequest = await updateJoinRequestStatus(id, status);
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // If request is accepted, add user to matchparticipants table and update counts
    if (status === 'accepted') {
      try {
        // Import pool here to avoid circular dependencies
        const { default: pool } = await import('../db.js');
        
        // Check if user is already a participant (to avoid duplicates)
        const existingParticipant = await pool.query(
          'SELECT id FROM matchparticipants WHERE match_id = $1 AND user_id = $2',
          [updatedRequest.match_id, updatedRequest.user_id]
        );

        if (existingParticipant.rows.length === 0) {
          // Add user to matchparticipants table
          await pool.query(
            'INSERT INTO matchparticipants (match_id, user_id, join_time) VALUES ($1, $2, NOW())',
            [updatedRequest.match_id, updatedRequest.user_id]
          );
          console.log(`✅ Added user ${updatedRequest.user_id} to match ${updatedRequest.match_id} participants`);
        } else {
          console.log(`ℹ️ User ${updatedRequest.user_id} is already a participant in match ${updatedRequest.match_id}`);
        }

        // Update participant count in real-time
        const updatedMatch = await updateMatchParticipantCount(updatedRequest.match_id);
        console.log(`✅ Updated participant count for match ${updatedRequest.match_id}`);
        
        // Broadcast participant count update via socket if available
        try {
          const { default: app } = await import('../app.js');
          if (app.io) {
            app.io.to(`match-${updatedRequest.match_id}`).emit('participant-count-updated', {
              matchId: updatedRequest.match_id,
              currentParticipants: updatedMatch.current_participants,
              playersNeeded: updatedMatch.players_needed || (updatedMatch.players_required - updatedMatch.current_participants)
            });
          }
        } catch (socketError) {
          console.log('Socket broadcast not available:', socketError.message);
        }
        
      } catch (participantError) {
        console.error('Error adding user to match participants:', participantError);
        // Don't fail the entire request if this fails, but log it
      }
    }

    // If request is declined, also update participant count (in case of changes)
    if (status === 'declined') {
      try {
        await updateMatchParticipantCount(updatedRequest.match_id);
        console.log(`✅ Updated participant count for match ${updatedRequest.match_id} after decline`);
      } catch (countError) {
        console.error('Error updating participant count after decline:', countError);
      }
    }

    // Send comprehensive join request decision notifications
    const match = await getMatchById(updatedRequest.match_id);
    if (match) {
      await MatchNotifications.joinRequestDecision(
        updatedRequest.match_id, 
        updatedRequest.user_id, 
        match.user_id, 
        status, 
        updatedRequest.id
      );
    }

    res.json({ message: `Join request ${status}`, joinRequest: updatedRequest });
  } catch (error) {
    console.error('Error updating join request status:', error);
    res.status(500).json({ error: 'Failed to update join request status' });
  }
};

// Delete join request
export const deleteJoinRequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id || req.user.id;

    const deletedRequest = await deleteJoinRequest(id, user_id);
    
    if (!deletedRequest) {
      return res.status(404).json({ error: 'Join request not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    console.error('Error deleting join request:', error);
    res.status(500).json({ error: 'Failed to delete join request' });
  }
};

// Get join request statistics
export const getJoinRequestStatistics = async (req, res) => {
  try {
    const user_id = req.user.user_id || req.user.id;
    
    const matchStats = await getJoinRequestStats(user_id);
    const userStats = await getUserJoinRequestStats(user_id);

    res.json({
      matchRequests: matchStats,
      sentRequests: userStats
    });
  } catch (error) {
    console.error('Error fetching join request statistics:', error);
    res.status(500).json({ error: 'Failed to fetch join request statistics' });
  }
}; 