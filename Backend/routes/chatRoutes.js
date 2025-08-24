import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getChatMessages, 
  getMatchParticipants, 
  isUserInMatch, 
  isMatchReadyForChat 
} from '../models/chatModel.js';

const router = express.Router();

// Get chat messages for a match
router.get('/match/:matchId/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    // Check if user is part of the match
    const userInMatch = await isUserInMatch(matchId, userId);
    if (!userInMatch) {
      return res.status(403).json({ error: 'You are not a participant in this match' });
    }

    // Check if match is ready for chat
    const chatReady = await isMatchReadyForChat(matchId);
    if (!chatReady) {
      return res.status(400).json({ error: 'Chat is not available until player requirements are met' });
    }

    const messages = await getChatMessages(matchId);
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Get match participants
router.get('/match/:matchId/participants', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    // Check if user is part of the match
    const userInMatch = await isUserInMatch(matchId, userId);
    if (!userInMatch) {
      return res.status(403).json({ error: 'You are not a participant in this match' });
    }

    const participants = await getMatchParticipants(matchId);
    res.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Test endpoint without authentication (temporary)
router.get('/test/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    console.log(`Testing match ${matchId}`);
    
    // Test the database functions directly
    const chatReady = await isMatchReadyForChat(matchId);
    console.log(`Chat ready result: ${chatReady}`);
    
    res.json({ 
      matchId, 
      chatReady,
      message: 'Test endpoint working'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if chat is available for a match
router.get('/match/:matchId/chat-status', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?.id;

    console.log(`Checking chat status for match ${matchId}, user ${userId}`);
    console.log('User object:', req.user);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated properly' });
    }

    // Validate matchId is a number
    if (!matchId || isNaN(parseInt(matchId))) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    // Check if user is part of the match
    const userInMatch = await isUserInMatch(matchId, userId);
    console.log(`User in match: ${userInMatch}`);
    
    if (!userInMatch) {
      return res.status(403).json({ 
        error: 'You are not a participant in this match',
        matchId,
        userId 
      });
    }

    const chatReady = await isMatchReadyForChat(matchId);
    console.log(`Chat ready: ${chatReady}`);
    
    res.json({ chatAvailable: chatReady });
  } catch (error) {
    console.error('Error checking chat status:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to check chat status', 
      details: error.message,
      matchId: req.params.matchId,
      userId: req.user?.id
    });
  }
});

export default router;