import pool from '../db.js';
import { createNotification } from '../models/notificationModel.js';
import { getAllMatchesWithCounts, updateMatchParticipantCount } from '../models/matchModel.js';
import { MatchNotifications } from '../services/notificationService.js';

// Create a new match
export const createMatch = async (req, res) => {
  try {
    const { date_time, location, players_required, level_of_game } = req.body;
    const user_id = req.user.id; // From JWT token

    // Validate required fields
    if (!date_time || !location || !players_required || !level_of_game) {
      return res.status(400).json({ 
        message: 'All fields are required: date_time, location, players_required, level_of_game' 
      });
    }

    // Validate date_time is in the future
    const matchDate = new Date(date_time);
    const now = new Date();
    if (matchDate <= now) {
      return res.status(400).json({ 
        message: 'Match date must be in the future' 
      });
    }

    // Validate players_required is positive
    if (players_required <= 0) {
      return res.status(400).json({ 
        message: 'Players required must be greater than 0' 
      });
    }

    // Insert match into database
    const result = await pool.query(
      `INSERT INTO matches (user_id, date_time, location, players_required, level_of_game)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, date_time, location, players_required, level_of_game]
    );

    const match = result.rows[0];

    // Send comprehensive match creation notifications
    await MatchNotifications.matchCreated(match.id, user_id);

    res.status(201).json({
      message: 'Match created successfully',
      match
    });

  } catch (err) {
    console.error('Create Match Error:', err.message);
    res.status(500).json({ message: 'Error creating match', error: err.message });
  }
};

// Get all matches
export const getAllMatches = async (req, res) => {
  try {
    const matches = await getAllMatchesWithCounts();
    
    // Update each match with real-time participant count
    const updatedMatches = await Promise.all(matches.map(async (match) => {
      try {
        await updateMatchParticipantCount(match.id);
        return match;
      } catch (error) {
        console.error(`Error updating count for match ${match.id}:`, error);
        return match;
      }
    }));
    
    res.json({
      matches: updatedMatches
    });
  } catch (err) {
    console.error('Get Matches Error:', err.message);
    res.status(500).json({ message: 'Error fetching matches', error: err.message });
  }
};

// Get match by ID with participants
export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get match details
    const matchResult = await pool.query(
      `SELECT m.*, u.fullname as creator_name, u.level_of_game as creator_level
       FROM matches m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get participants
    const participantsResult = await pool.query(
      `SELECT mp.*, u.fullname, u.level_of_game
       FROM matchparticipants mp
       JOIN users u ON mp.user_id = u.id
       WHERE mp.match_id = $1`,
      [id]
    );

    res.json({
      match,
      participants: participantsResult.rows
    });

  } catch (err) {
    console.error('Get Match Error:', err.message);
    res.status(500).json({ message: 'Error fetching match', error: err.message });
  }
};

// Join a match
export const joinMatch = async (req, res) => {
  try {
    const { match_id } = req.body;
    const user_id = req.user.id;

    // Check if match exists and is in the future
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND date_time > NOW()',
      [match_id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found or has already passed' });
    }

    const match = matchResult.rows[0];

    // Check if user is already a participant
    const existingParticipant = await pool.query(
      'SELECT * FROM matchparticipants WHERE match_id = $1 AND user_id = $2',
      [match_id, user_id]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({ message: 'You are already a participant in this match' });
    }

    // Check if match is full (excluding creator from count)
    const participantCount = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM matchparticipants WHERE match_id = $1 AND user_id != $2
        UNION
        SELECT user_id FROM join_requests WHERE match_id = $1 AND status = 'accepted' AND user_id != $2
      ) as participants`,
      [match_id, match.user_id]
    );

    if (parseInt(participantCount.rows[0].count) >= match.players_required) {
      return res.status(400).json({ message: 'Match is full' });
    }

    // Add user to match participants
    await pool.query(
      'INSERT INTO matchparticipants (match_id, user_id) VALUES ($1, $2)',
      [match_id, user_id]
    );

    res.json({
      message: 'Successfully joined the match'
    });

  } catch (err) {
    console.error('Join Match Error:', err.message);
    res.status(500).json({ message: 'Error joining match', error: err.message });
  }
};

// Leave a match
export const leaveMatch = async (req, res) => {
  try {
    const { match_id } = req.body;
    const user_id = req.user.id;

    // Check if user is a participant
    const participantResult = await pool.query(
      'SELECT * FROM matchparticipants WHERE match_id = $1 AND user_id = $2',
      [match_id, user_id]
    );

    if (participantResult.rows.length === 0) {
      return res.status(400).json({ message: 'You are not a participant in this match' });
    }

    // Remove user from match participants
    await pool.query(
      'DELETE FROM matchparticipants WHERE match_id = $1 AND user_id = $2',
      [match_id, user_id]
    );

    res.json({
      message: 'Successfully left the match'
    });

  } catch (err) {
    console.error('Leave Match Error:', err.message);
    res.status(500).json({ message: 'Error leaving match', error: err.message });
  }
};

// Get user's matches (created and joined)
export const getUserMatches = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get matches created by user (count participants excluding creator)
    const createdMatches = await pool.query(
      `SELECT m.*, 
       (COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
        COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != m.user_id THEN mp.user_id END), 0)
       ) as current_participants
       FROM matches m
       LEFT JOIN matchparticipants mp ON m.id = mp.match_id
       LEFT JOIN join_requests jr ON m.id = jr.match_id
       WHERE m.user_id = $1
       GROUP BY m.id
       ORDER BY m.date_time DESC`,
      [user_id]
    );

    // Get matches joined by user (count participants excluding creator)
    const joinedMatches = await pool.query(
      `SELECT m.*, u.fullname as creator_name, u.level_of_game as creator_level,
       (COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
        COALESCE(COUNT(DISTINCT CASE WHEN mp2.user_id != m.user_id THEN mp2.user_id END), 0)
       ) as current_participants
       FROM matches m
       JOIN matchparticipants mp ON m.id = mp.match_id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN matchparticipants mp2 ON m.id = mp2.match_id
       LEFT JOIN join_requests jr ON m.id = jr.match_id
       WHERE mp.user_id = $1 AND m.user_id != $1
       GROUP BY m.id, u.fullname, u.level_of_game
       ORDER BY m.date_time DESC`,
      [user_id]
    );

    res.json({
      created_matches: createdMatches.rows,
      joined_matches: joinedMatches.rows
    });

  } catch (err) {
    console.error('Get User Matches Error:', err.message);
    res.status(500).json({ message: 'Error fetching user matches', error: err.message });
  }
};

// Update a match (only creator can update)
export const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { date_time, location, players_required, level_of_game, description } = req.body;

    // Check if match exists and user is the creator
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found or you are not the creator' });
    }

    // Check if match is in the future
    const match = matchResult.rows[0];
    if (new Date(match.date_time) <= new Date()) {
      return res.status(400).json({ message: 'Cannot update past matches' });
    }

    // Validate date_time is in the future if provided
    if (date_time && new Date(date_time) <= new Date()) {
      return res.status(400).json({ message: 'Match date must be in the future' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (date_time) {
      updates.push(`date_time = $${paramCount}`);
      values.push(date_time);
      paramCount++;
    }
    if (location) {
      updates.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }
    if (players_required) {
      updates.push(`players_required = $${paramCount}`);
      values.push(players_required);
      paramCount++;
    }
    if (level_of_game) {
      updates.push(`level_of_game = $${paramCount}`);
      values.push(level_of_game);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE matches 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;
    values.push(user_id);

    const result = await pool.query(updateQuery, values);

    // Send match updated notifications
    const changes = {};
    if (date_time) changes.date_time = date_time;
    if (location) changes.location = location;
    if (players_required) changes.players_required = players_required;
    if (level_of_game) changes.level_of_game = level_of_game;
    if (description !== undefined) changes.description = description;
    
    await MatchNotifications.matchUpdated(id, user_id, changes);

    res.json({
      message: 'Match updated successfully',
      match: result.rows[0]
    });

  } catch (err) {
    console.error('Update Match Error:', err.message);
    res.status(500).json({ message: 'Error updating match', error: err.message });
  }
};

// Cancel a match (only creator can cancel)
export const cancelMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if match exists and user is the creator
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found or you are not the creator' });
    }

    // Check if match is in the future
    const match = matchResult.rows[0];
    if (new Date(match.date_time) <= new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past matches' });
    }

    // Update match status to cancelled
    const result = await pool.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    // Send match cancelled notifications before removing participants
    await MatchNotifications.matchDeleted(id, user_id, match);

    // Remove all participants from cancelled match
    await pool.query('DELETE FROM matchparticipants WHERE match_id = $1', [id]);

    res.json({
      message: 'Match cancelled successfully',
      match: result.rows[0]
    });

  } catch (err) {
    console.error('Cancel Match Error:', err.message);
    res.status(500).json({ message: 'Error cancelling match', error: err.message });
  }
};

// Delete a match (only creator can delete)
export const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if match exists and user is the creator
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found or you are not the creator' });
    }

    const match = matchResult.rows[0];

    // Send match deleted notifications before deletion
    await MatchNotifications.matchDeleted(id, user_id, match);

    // Delete match (participants will be deleted due to CASCADE)
    await pool.query('DELETE FROM matches WHERE id = $1', [id]);

    res.json({
      message: 'Match deleted successfully'
    });

  } catch (err) {
    console.error('Delete Match Error:', err.message);
    res.status(500).json({ message: 'Error deleting match', error: err.message });
  }
}; 

export const getParticipatingMatchIds = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query(
      'SELECT match_id FROM matchparticipants WHERE user_id = $1',
      [user_id]
    );
    const matchIds = result.rows.map(row => row.match_id);
    res.json({ matchIds });
  } catch (err) {
    console.error('Get Participating Match IDs Error:', err.message);
    res.status(500).json({ message: 'Error fetching participating matches', error: err.message });
  }
}; 

// Get participants for a match
export const getMatchParticipants = async (req, res) => {
  try {
    const { id } = req.params; // match id
    const result = await pool.query(
      `SELECT u.id, u.fullname, u.email, u.level_of_game
       FROM matchparticipants mp
       JOIN users u ON mp.user_id = u.id
       WHERE mp.match_id = $1
       ORDER BY u.fullname ASC`,
      [id]
    );
    res.json({ participants: result.rows });
  } catch (err) {
    console.error('Get Match Participants Error:', err.message);
    res.status(500).json({ message: 'Error fetching match participants', error: err.message });
  }
}; 