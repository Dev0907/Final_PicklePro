import pool from '../db.js';

/**
 * Get match by ID
 * @param {number} matchId - The ID of the match to retrieve
 * @returns {Promise<Object>} The match object
 */
export const getMatchById = async (matchId) => {
    try {
        const query = `
            SELECT m.*, 
                   u.fullname AS creator_username
            FROM matches m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.id = $1
        `;
        const result = await pool.query(query, [matchId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting match by ID:', error);
        throw error;
    }
};

/**
 * Update match with new opponent
 * @param {number} matchId - The ID of the match to update
 * @param {number} opponentId - The ID of the new opponent
 * @returns {Promise<Object>} The updated match
 */
export const updateMatchOpponent = async (matchId, opponentId) => {
    try {
        const query = `
            UPDATE matches 
            SET status = 'scheduled',
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [matchId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error updating match opponent:', error);
        throw error;
    }
};

/**
 * Get all matches for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Array>} Array of matches
 */
export const getMatchesByUser = async (userId) => {
    try {
        const query = `
            SELECT m.*, 
                   u.fullname AS creator_username
            FROM matches m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.user_id = $1
            ORDER BY m.date_time DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting matches by user:', error);
        throw error;
    }
};

/**
 * Get current participant count for a match (excluding creator)
 * @param {number} matchId - The ID of the match
 * @returns {Promise<number>} Current participant count (not including creator)
 */
export const getCurrentParticipantCount = async (matchId) => {
    try {
        const query = `
            SELECT 
                COALESCE(COUNT(DISTINCT jr.user_id), 0) as accepted_requests,
                COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != m.user_id THEN mp.user_id END), 0) as participants
            FROM matches m
            LEFT JOIN join_requests jr ON m.id = jr.match_id AND jr.status = 'accepted'
            LEFT JOIN matchparticipants mp ON m.id = mp.match_id
            WHERE m.id = $1
            GROUP BY m.id, m.user_id
        `;
        const result = await pool.query(query, [matchId]);
        
        if (result.rows.length === 0) return 0;
        
        const row = result.rows[0];
        // Count only non-creator participants (accepted requests + direct participants excluding creator)
        return Math.max(parseInt(row.accepted_requests), parseInt(row.participants));
    } catch (error) {
        console.error('Error getting current participant count:', error);
        throw error;
    }
};

/**
 * Update match participant count in real-time
 * @param {number} matchId - The ID of the match
 * @returns {Promise<Object>} Updated match with current participant count
 */
export const updateMatchParticipantCount = async (matchId) => {
    try {
        const currentCount = await getCurrentParticipantCount(matchId);
        
        const query = `
            UPDATE matches 
            SET current_participants = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *, 
                (players_required - current_participants) as players_needed
        `;
        const result = await pool.query(query, [matchId, currentCount]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error updating match participant count:', error);
        throw error;
    }
};

/**
 * Get all matches with current participant counts
 * @returns {Promise<Array>} Array of matches with participant counts
 */
export const getAllMatchesWithCounts = async () => {
    try {
        const query = `
            SELECT 
                m.*,
                u.fullname AS creator_name,
                u.level_of_game as creator_level,
                -- Count only non-creator participants (accepted requests + direct participants excluding creator)
                (COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
                 COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != m.user_id THEN mp.user_id END), 0)
                ) as current_participants,
                -- Calculate players needed (players_required - current_participants, not including creator)
                GREATEST(0, m.players_required - (
                 COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
                 COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != m.user_id THEN mp.user_id END), 0)
                )) as players_needed,
                -- Get list of participant names for display (excluding creator)
                STRING_AGG(DISTINCT 
                    CASE 
                        WHEN jr.status = 'accepted' THEN (SELECT fullname FROM users WHERE id = jr.user_id)
                        WHEN mp.user_id != m.user_id THEN (SELECT fullname FROM users WHERE id = mp.user_id)
                    END, ', '
                ) as participant_names
            FROM matches m
            LEFT JOIN users u ON m.user_id = u.id
            LEFT JOIN join_requests jr ON m.id = jr.match_id
            LEFT JOIN matchparticipants mp ON m.id = mp.match_id
            WHERE m.date_time > NOW() 
              AND (m.status IS NULL OR m.status = 'active' OR m.status = 'upcoming')
            GROUP BY m.id, u.fullname, u.level_of_game
            ORDER BY m.date_time ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting all matches with counts:', error);
        throw error;
    }
};

export default {
    getMatchById,
    updateMatchOpponent,
    getMatchesByUser,
    getCurrentParticipantCount,
    updateMatchParticipantCount,
    getAllMatchesWithCounts
};
