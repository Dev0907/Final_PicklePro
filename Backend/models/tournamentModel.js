import pool from '../db.js';

// Create a new tournament aligned with DB schema
// DB columns:
// id (PK), owner_id, tournament_name, tournament_date, start_time,
// location, entry_fee, number_of_team, phone
export async function createTournament(tournament) {
  const {
    name,
    date,
    time,
    location,
    fee,
    maxTeams,
    organizerContact,
    owner_id,
  } = tournament;

  const entryFeeNumber = fee != null ? Number(fee) : null;
  const numberOfTeam = maxTeams != null ? Number(maxTeams) : null;
  const phone = organizerContact ?? null;

  const res = await pool.query(
    `INSERT INTO tournaments 
      (owner_id, tournament_name, tournament_date, start_time, location, entry_fee, number_of_team, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [owner_id, name, date, time, location, entryFeeNumber, numberOfTeam, phone]
  );
  return res.rows[0];
}

// Fetch all tournaments with organizer info
export async function getAllTournaments() {
  const res = await pool.query(
    `SELECT 
        t.id,
        t.tournament_name AS name,
        t.tournament_date AS date,
        t.start_time AS time,
        t.location,
        t.entry_fee AS fee,
        t.number_of_team AS "maxTeams",
        t.phone AS "organizerContact",
        o.full_name AS organizer
     FROM tournaments t
     JOIN owners o ON t.owner_id = o.id
     ORDER BY t.tournament_date ASC, t.start_time ASC`
  );
  return res.rows;
}

// Register a team for a tournament
export async function registerForTournament(registration) {
  const {
    tournament_id,
    user_id,
    team_name,
    player1_name,
    player1_phone,
    player2_name,
    player2_phone
  } = registration;

  const res = await pool.query(
    `INSERT INTO tournament_registrations 
      (tournament_id, user_id, team_name, player1_name, player1_phone, player2_name, player2_phone, registration_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [tournament_id, user_id, team_name, player1_name, player1_phone, player2_name, player2_phone]
  );
  return res.rows[0];
}

// Get all registrations for a tournament
export async function getTournamentRegistrations(tournament_id) {
  const res = await pool.query(
    `SELECT 
        tr.*,
        u.fullname as registered_by_name,
        u.email as registered_by_email
     FROM tournament_registrations tr
     JOIN users u ON tr.user_id = u.id
     WHERE tr.tournament_id = $1
     ORDER BY tr.registration_date ASC`,
    [tournament_id]
  );
  return res.rows;
}

// Get user's registered tournaments
export async function getUserRegisteredTournaments(user_id) {
  const res = await pool.query(
    `SELECT tournament_id, registration_date
     FROM tournament_registrations
     WHERE user_id = $1
     ORDER BY registration_date DESC`,
    [user_id]
  );
  return res.rows;
}

// Get user's tournament registrations with full details
export async function getUserTournamentRegistrations(user_id) {
  const res = await pool.query(
    `SELECT 
        tr.id,
        tr.tournament_id,
        tr.team_name,
        tr.player1_name,
        tr.player1_phone,
        tr.player2_name,
        tr.player2_phone,
        tr.registration_date,
        t.tournament_name,
        t.tournament_date,
        t.start_time,
        t.location,
        t.entry_fee,
        o.full_name as organizer,
        t.phone as "organizerContact"
     FROM tournament_registrations tr
     JOIN tournaments t ON tr.tournament_id = t.id
     JOIN owners o ON t.owner_id = o.id
     WHERE tr.user_id = $1
     ORDER BY t.tournament_date ASC, t.start_time ASC`,
    [user_id]
  );
  return res.rows;
}

// Update tournament registration
export async function updateTournamentRegistration(registration_id, user_id, updates) {
  const {
    team_name,
    player1_name,
    player1_phone,
    player2_name,
    player2_phone
  } = updates;

  const res = await pool.query(
    `UPDATE tournament_registrations 
     SET team_name = $3, 
         player1_name = $4, 
         player1_phone = $5, 
         player2_name = $6, 
         player2_phone = $7,
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [registration_id, user_id, team_name, player1_name, player1_phone, player2_name, player2_phone]
  );

  if (res.rows.length === 0) {
    return null;
  }

  // Get tournament details for notification
  const tournamentRes = await pool.query(
    `SELECT t.tournament_name, t.id as tournament_id
     FROM tournaments t
     JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE tr.id = $1`,
    [registration_id]
  );

  return {
    ...res.rows[0],
    tournament_name: tournamentRes.rows[0]?.tournament_name,
    tournament_id: tournamentRes.rows[0]?.tournament_id
  };
}

// Delete tournament registration
export async function deleteTournamentRegistration(registration_id, user_id) {
  // First get tournament details for notification
  const tournamentRes = await pool.query(
    `SELECT t.tournament_name, t.id as tournament_id
     FROM tournaments t
     JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE tr.id = $1 AND tr.user_id = $2`,
    [registration_id, user_id]
  );

  if (tournamentRes.rows.length === 0) {
    return null;
  }

  const res = await pool.query(
    `DELETE FROM tournament_registrations 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [registration_id, user_id]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return {
    ...res.rows[0],
    tournament_name: tournamentRes.rows[0].tournament_name,
    tournament_id: tournamentRes.rows[0].tournament_id
  };
}

// Create notification
export async function createNotification(notification) {
  const {
    user_id,
    type,
    title,
    message,
    related_id
  } = notification;

  const res = await pool.query(
    `INSERT INTO notifications 
      (user_id, type, title, message, related_id, created_at, is_read)
     VALUES ($1, $2, $3, $4, $5, NOW(), false)
     RETURNING *`,
    [user_id, type, title, message, related_id]
  );
  return res.rows[0];
}

// Get owner's tournaments with registration stats
export async function getOwnerTournaments(owner_id) {
  const res = await pool.query(
    `SELECT 
        t.*,
        COUNT(tr.id) as registration_count,
        SUM(CASE WHEN tr.id IS NOT NULL THEN t.entry_fee ELSE 0 END) as total_revenue
     FROM tournaments t
     LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE t.owner_id = $1
     GROUP BY t.id
     ORDER BY t.tournament_date DESC`,
    [owner_id]
  );
  return res.rows;
}

// Get owner tournament statistics
export async function getOwnerTournamentStats(owner_id) {
  const res = await pool.query(
    `SELECT 
        COUNT(t.id) as total_tournaments,
        COUNT(CASE WHEN t.tournament_date > NOW() THEN 1 END) as active_tournaments,
        COUNT(tr.id) as total_registrations,
        SUM(CASE WHEN tr.id IS NOT NULL THEN t.entry_fee ELSE 0 END) as total_revenue,
        CASE 
          WHEN COUNT(t.id) > 0 THEN COUNT(tr.id)::float / COUNT(t.id)
          ELSE 0
        END as avg_registrations_per_tournament
     FROM tournaments t
     LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE t.owner_id = $1`,
    [owner_id]
  );
  return res.rows[0];
}

// Get owner tournament analytics
export async function getOwnerTournamentAnalytics(owner_id) {
  // Monthly data
  const monthlyRes = await pool.query(
    `SELECT 
        DATE_TRUNC('month', t.tournament_date) as month,
        COUNT(t.id) as tournaments,
        COUNT(tr.id) as registrations,
        SUM(CASE WHEN tr.id IS NOT NULL THEN t.entry_fee ELSE 0 END) as revenue
     FROM tournaments t
     LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE t.owner_id = $1 
     AND t.tournament_date >= NOW() - INTERVAL '12 months'
     GROUP BY DATE_TRUNC('month', t.tournament_date)
     ORDER BY month ASC`,
    [owner_id]
  );

  // Registration trends
  const trendsRes = await pool.query(
    `SELECT 
        t.tournament_name,
        COUNT(tr.id) as registration_count,
        t.number_of_team as max_teams,
        CASE 
          WHEN t.number_of_team > 0 THEN (COUNT(tr.id)::float / t.number_of_team) * 100
          ELSE 0
        END as fill_rate
     FROM tournaments t
     LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE t.owner_id = $1
     GROUP BY t.id, t.tournament_name, t.number_of_team
     ORDER BY fill_rate DESC
     LIMIT 10`,
    [owner_id]
  );

  // Revenue breakdown
  const revenueRes = await pool.query(
    `SELECT 
        t.tournament_name,
        COUNT(tr.id) as registrations,
        SUM(CASE WHEN tr.id IS NOT NULL THEN t.entry_fee ELSE 0 END) as revenue
     FROM tournaments t
     LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
     WHERE t.owner_id = $1
     GROUP BY t.id, t.tournament_name
     HAVING SUM(CASE WHEN tr.id IS NOT NULL THEN t.entry_fee ELSE 0 END) > 0
     ORDER BY revenue DESC
     LIMIT 10`,
    [owner_id]
  );

  return {
    monthly_data: monthlyRes.rows,
    registration_trends: trendsRes.rows,
    revenue_breakdown: revenueRes.rows
  };
}

// Update tournament
export async function updateTournament(tournament_id, owner_id, updates) {
  const {
    name,
    date,
    time,
    location,
    fee,
    maxTeams,
    organizerContact
  } = updates;

  const res = await pool.query(
    `UPDATE tournaments 
     SET tournament_name = $3,
         tournament_date = $4,
         start_time = $5,
         location = $6,
         entry_fee = $7,
         number_of_team = $8,
         phone = $9
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [tournament_id, owner_id, name, date, time, location, fee, maxTeams, organizerContact]
  );
  return res.rows[0] || null;
}

// Delete tournament
export async function deleteTournament(tournament_id, owner_id) {
  const res = await pool.query(
    `DELETE FROM tournaments 
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [tournament_id, owner_id]
  );
  return res.rows[0] || null;
}