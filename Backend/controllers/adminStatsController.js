import pool from '../db.js';

// Get dashboard statistics for admin
export const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total owners count
    const ownersResult = await pool.query('SELECT COUNT(*) as count FROM owners');
    const totalOwners = parseInt(ownersResult.rows[0].count);

    // Get total matches count
    const matchesResult = await pool.query('SELECT COUNT(*) as count FROM matches');
    const totalMatches = parseInt(matchesResult.rows[0].count);

    // Get total tournaments count
    const tournamentsResult = await pool.query('SELECT COUNT(*) as count FROM tournaments');
    const totalTournaments = parseInt(tournamentsResult.rows[0].count);

    // Get recent users (last 7 days)
    const recentUsersResult = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    );
    const recentUsers = parseInt(recentUsersResult.rows[0].count);

    // Get recent matches (last 7 days)
    const recentMatchesResult = await pool.query(
      `SELECT COUNT(*) as count FROM matches 
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    );
    const recentMatches = parseInt(recentMatchesResult.rows[0].count);

    // Get match participants count
    const participantsResult = await pool.query('SELECT COUNT(*) as count FROM matchparticipants');
    const totalParticipants = parseInt(participantsResult.rows[0].count);

    // Get tournament registrations count
    let tournamentRegistrations = 0;
    try {
      const registrationsResult = await pool.query('SELECT COUNT(*) as count FROM tournament_registrations');
      tournamentRegistrations = parseInt(registrationsResult.rows[0].count);
    } catch (error) {
      // Table might not exist yet
      console.log('Tournament registrations table not found, defaulting to 0');
    }

    // Get active matches (future matches)
    const activeMatchesResult = await pool.query(
      `SELECT COUNT(*) as count FROM matches 
       WHERE date_time > NOW()`
    );
    const activeMatches = parseInt(activeMatchesResult.rows[0].count);

    // Get active tournaments (future tournaments)
    const activeTournamentsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tournaments 
       WHERE tournament_date > NOW()`
    );
    const activeTournaments = parseInt(activeTournamentsResult.rows[0].count);

    // Calculate growth rates (simplified)
    const userGrowthRate = totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0;
    const matchGrowthRate = totalMatches > 0 ? Math.round((recentMatches / totalMatches) * 100) : 0;

    const stats = {
      overview: {
        totalUsers,
        totalOwners,
        totalMatches,
        totalTournaments,
        totalParticipants,
        tournamentRegistrations
      },
      activity: {
        activeMatches,
        activeTournaments,
        recentUsers,
        recentMatches
      },
      growth: {
        userGrowthRate,
        matchGrowthRate
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get detailed user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    // Get user registration trends (last 30 days)
    const userTrendsResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get user distribution by level
    const userLevelsResult = await pool.query(`
      SELECT 
        level_of_game as level,
        COUNT(*) as count
      FROM users 
      GROUP BY level_of_game
      ORDER BY count DESC
    `);

    // Get user distribution by gender
    const userGenderResult = await pool.query(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM users 
      GROUP BY gender
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        registrationTrends: userTrendsResult.rows,
        levelDistribution: userLevelsResult.rows,
        genderDistribution: userGenderResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
};

// Get match analytics
export const getMatchAnalytics = async (req, res) => {
  try {
    // Get match creation trends (last 30 days)
    const matchTrendsResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM matches 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get matches by skill level
    const matchLevelsResult = await pool.query(`
      SELECT 
        level_of_game as level,
        COUNT(*) as count
      FROM matches 
      GROUP BY level_of_game
      ORDER BY count DESC
    `);

    // Get popular locations
    const popularLocationsResult = await pool.query(`
      SELECT 
        location,
        COUNT(*) as count
      FROM matches 
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        creationTrends: matchTrendsResult.rows,
        levelDistribution: matchLevelsResult.rows,
        popularLocations: popularLocationsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching match analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match analytics'
    });
  }
};