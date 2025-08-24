import pool from '../db.js';

// Create a new join request
export async function createJoinRequest(joinRequest) {
  const { match_id, user_id, message } = joinRequest;

  const res = await pool.query(
    `INSERT INTO join_requests 
      (match_id, user_id, message, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'pending', NOW(), NOW())
     RETURNING *`,
    [match_id, user_id, message]
  );
  return res.rows[0];
}

// Get join requests for a specific match
export async function getJoinRequestsByMatch(match_id) {
  const res = await pool.query(
    `SELECT 
        jr.*,
        u.fullname as requester_name,
        u.email as requester_email,
        u.phone_no as requester_phone
     FROM join_requests jr
     JOIN users u ON jr.user_id = u.id
     WHERE jr.match_id = $1
     ORDER BY jr.created_at ASC`,
    [match_id]
  );
  return res.rows;
}

// Get join requests by user
export async function getJoinRequestsByUser(user_id) {
  const res = await pool.query(
    `SELECT 
        jr.*,
        m.sport,
        m.date_time,
        m.location,
        m.description,
        creator.fullname as match_creator_name
     FROM join_requests jr
     JOIN matches m ON jr.match_id = m.id
     JOIN users creator ON m.user_id = creator.id
     WHERE jr.user_id = $1
     ORDER BY jr.created_at DESC`,
    [user_id]
  );
  return res.rows;
}

// Get join request by ID
export async function getJoinRequestById(id) {
  const res = await pool.query(
    `SELECT 
        jr.*,
        u.fullname as requester_name,
        u.email as requester_email,
        m.sport,
        m.date_time,
        m.location,
        m.user_id as match_creator_id
     FROM join_requests jr
     JOIN users u ON jr.user_id = u.id
     JOIN matches m ON jr.match_id = m.id
     WHERE jr.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

// Update join request status
export async function updateJoinRequestStatus(id, status) {
  const res = await pool.query(
    `UPDATE join_requests 
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return res.rows[0] || null;
}

// Delete join request
export async function deleteJoinRequest(id, user_id) {
  const res = await pool.query(
    `DELETE FROM join_requests 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, user_id]
  );
  return res.rows[0] || null;
}

// Check if user already has a pending request for a match
export async function hasExistingRequest(match_id, user_id) {
  const res = await pool.query(
    `SELECT id FROM join_requests 
     WHERE match_id = $1 AND user_id = $2 AND status = 'pending'`,
    [match_id, user_id]
  );
  return res.rows.length > 0;
}

// Get pending join requests for matches created by a user
export async function getPendingRequestsForUserMatches(user_id) {
  const res = await pool.query(
    `SELECT 
        jr.*,
        u.fullname as requester_name,
        u.email as requester_email,
        u.phone_no as requester_phone,
        m.sport,
        m.date_time,
        m.location,
        m.description
     FROM join_requests jr
     JOIN users u ON jr.user_id = u.id
     JOIN matches m ON jr.match_id = m.id
     WHERE m.user_id = $1 AND jr.status = 'pending'
     ORDER BY jr.created_at ASC`,
    [user_id]
  );
  return res.rows;
}

// Get join request statistics for a user's matches
export async function getJoinRequestStats(user_id) {
  const res = await pool.query(
    `SELECT 
        COUNT(jr.id) as total_requests,
        COUNT(CASE WHEN jr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN jr.status = 'accepted' THEN 1 END) as accepted_requests,
        COUNT(CASE WHEN jr.status = 'declined' THEN 1 END) as declined_requests
     FROM join_requests jr
     JOIN matches m ON jr.match_id = m.id
     WHERE m.user_id = $1`,
    [user_id]
  );
  return res.rows[0];
}

// Get user's join request statistics
export async function getUserJoinRequestStats(user_id) {
  const res = await pool.query(
    `SELECT 
        COUNT(jr.id) as total_sent,
        COUNT(CASE WHEN jr.status = 'pending' THEN 1 END) as pending_sent,
        COUNT(CASE WHEN jr.status = 'accepted' THEN 1 END) as accepted_sent,
        COUNT(CASE WHEN jr.status = 'declined' THEN 1 END) as declined_sent
     FROM join_requests jr
     WHERE jr.user_id = $1`,
    [user_id]
  );
  return res.rows[0];
}

// Clean up old declined/accepted requests
export async function cleanupOldJoinRequests(days = 30) {
  const res = await pool.query(
    `DELETE FROM join_requests 
     WHERE status IN ('declined', 'accepted') 
     AND updated_at < NOW() - INTERVAL '${days} days'
     RETURNING COUNT(*) as deleted_count`
  );
  return res.rows[0];
}