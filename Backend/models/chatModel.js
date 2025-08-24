import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const createChatMessage = async (matchId, userId, message, userName) => {
  const messageId = uuidv4();
  const query = `
    INSERT INTO chat_messages (id, match_id, user_id, message, user_name, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [messageId, matchId, userId, message, userName]);
  return result.rows[0];
};

export const getChatMessages = async (matchId, limit = 50) => {
  const query = `
    SELECT cm.*, u.name as user_name
    FROM chat_messages cm
    LEFT JOIN users u ON cm.user_id = u.id
    WHERE cm.match_id = $1
    ORDER BY cm.created_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [matchId, limit]);
  return result.rows.reverse(); // Return in chronological order
};

export const getMatchParticipants = async (matchId) => {
  const query = `
    SELECT DISTINCT u.id, u.fullname as name, u.email
    FROM users u
    WHERE u.id IN (
      SELECT user_id FROM matches WHERE id = $1
      UNION
      SELECT user_id FROM join_requests 
      WHERE match_id = $1 AND status = 'accepted'
      UNION
      SELECT user_id FROM matchparticipants
      WHERE match_id = $1
    )
  `;
  const result = await pool.query(query, [matchId]);
  return result.rows;
};

export const isUserInMatch = async (matchId, userId) => {
  try {
    const query = `
      SELECT 1 FROM matches WHERE id = $1 AND user_id = $2
      UNION
      SELECT 1 FROM join_requests 
      WHERE match_id = $1 AND user_id = $2 AND status = 'accepted'
      UNION
      SELECT 1 FROM matchparticipants
      WHERE match_id = $1 AND user_id = $2
    `;
    console.log(`Checking if user ${userId} is in match ${matchId}`);
    const result = await pool.query(query, [matchId, userId]);
    console.log(`Query result: ${result.rows.length} rows`);
    
    // Only allow access if user is actually part of the match
    if (result.rows.length === 0) {
      console.log(`User ${userId} is not authorized to access match ${matchId} chat`);
      return false;
    }
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error in isUserInMatch:', error);
    throw error;
  }
};

export const isMatchReadyForChat = async (matchId) => {
  try {
    const query = `
      SELECT 
        m.players_required,
        m.user_id as creator_id,
        COUNT(jr.id) as accepted_requests
      FROM matches m
      LEFT JOIN join_requests jr ON m.id = jr.match_id AND jr.status = 'accepted'
      WHERE m.id = $1
      GROUP BY m.id, m.players_required, m.user_id
    `;
    console.log(`Checking if match ${matchId} is ready for chat`);
    const result = await pool.query(query, [matchId]);
    console.log(`Match query result:`, result.rows);
    
    if (result.rows.length === 0) {
      console.log(`Match ${matchId} not found`);
      return false;
    }
    
    const match = result.rows[0];
    const totalPlayers = 1 + parseInt(match.accepted_requests); // Creator + accepted requests
    const playersNeeded = parseInt(match.players_required);
    
    console.log(`Match ${matchId}: ${totalPlayers} total players, ${playersNeeded} needed`);
    
    // Allow chat when there are participants (creator + accepted players)
    console.log(`Chat ready: ${totalPlayers >= 1} (${totalPlayers} participants)`);
    return totalPlayers >= 1; // Allow chat as soon as there's at least the creator
  } catch (error) {
    console.error('Error in isMatchReadyForChat:', error);
    throw error;
  }
};

// Generate unique session ID for each match
export const generateMatchSessionId = (matchId) => {
  return `match_session_${matchId}_${Date.now()}`;
};

// Store message delivery status
export const updateMessageStatus = async (messageId, userId, status) => {
  try {
    const query = `
      INSERT INTO message_status (message_id, user_id, status, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (message_id, user_id) 
      DO UPDATE SET status = $3, updated_at = NOW()
    `;
    await pool.query(query, [messageId, userId, status]);
  } catch (error) {
    console.error('Error updating message status:', error);
  }
};

// Get message delivery status
export const getMessageStatus = async (messageId) => {
  try {
    const query = `
      SELECT user_id, status, updated_at
      FROM message_status
      WHERE message_id = $1
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting message status:', error);
    return [];
  }
};