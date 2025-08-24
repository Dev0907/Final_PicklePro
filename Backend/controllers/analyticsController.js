import pool from '../db.js';

// Get owner analytics overview
export async function getOwnerAnalytics(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    // Get facility count
    const facilitiesRes = await pool.query(
      'SELECT COUNT(*) as facility_count FROM facilities WHERE owner_id = $1',
      [owner_id]
    );

    // Get total bookings
    const bookingsRes = await pool.query(
      `SELECT COUNT(*) as total_bookings 
       FROM bookings b 
       JOIN courts c ON b.court_id = c.id 
       JOIN facilities f ON c.facility_id = f.id 
       WHERE f.owner_id = $1`,
      [owner_id]
    );

    // Get total revenue
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(b.total_cost), 0) as total_revenue 
       FROM bookings b 
       JOIN courts c ON b.court_id = c.id 
       JOIN facilities f ON c.facility_id = f.id 
       WHERE f.owner_id = $1 AND b.status = 'confirmed'`,
      [owner_id]
    );

    // Get tournaments count
    const tournamentsRes = await pool.query(
      'SELECT COUNT(*) as tournament_count FROM tournaments WHERE owner_id = $1',
      [owner_id]
    );

    // Get recent bookings
    const recentBookingsRes = await pool.query(
      `SELECT 
        b.id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.total_cost,
        b.status,
        f.facility_name,
        c.court_name,
        u.full_name as player_name
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       JOIN facilities f ON c.facility_id = f.id
       JOIN users u ON b.user_id = u.id
       WHERE f.owner_id = $1
       ORDER BY b.created_at DESC
       LIMIT 10`,
      [owner_id]
    );

    const analytics = {
      facility_count: parseInt(facilitiesRes.rows[0].facility_count),
      total_bookings: parseInt(bookingsRes.rows[0].total_bookings),
      total_revenue: parseFloat(revenueRes.rows[0].total_revenue),
      tournament_count: parseInt(tournamentsRes.rows[0].tournament_count),
      recent_bookings: recentBookingsRes.rows
    };

    return res.status(200).json({ analytics });

  } catch (error) {
    console.error("Error fetching owner analytics:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// Get owner stats (monthly data)
export async function getOwnerStats(req, res) {
  try {
    const owner_id = req.user?.id;
    if (!owner_id) {
      return res.status(401).json({ error: "Unauthorized. Owner ID missing." });
    }

    // Get monthly booking stats for the last 12 months
    const monthlyStatsRes = await pool.query(
      `SELECT 
        DATE_TRUNC('month', b.booking_date) as month,
        COUNT(*) as booking_count,
        COALESCE(SUM(b.total_cost), 0) as revenue
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       JOIN facilities f ON c.facility_id = f.id
       WHERE f.owner_id = $1 
         AND b.booking_date >= CURRENT_DATE - INTERVAL '12 months'
         AND b.status = 'confirmed'
       GROUP BY DATE_TRUNC('month', b.booking_date)
       ORDER BY month DESC`,
      [owner_id]
    );

    // Get court utilization stats
    const courtStatsRes = await pool.query(
      `SELECT 
        c.court_name,
        f.facility_name,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(b.total_cost), 0) as revenue
       FROM courts c
       JOIN facilities f ON c.facility_id = f.id
       LEFT JOIN bookings b ON c.id = b.court_id AND b.status = 'confirmed'
       WHERE f.owner_id = $1
       GROUP BY c.id, c.court_name, f.facility_name
       ORDER BY booking_count DESC`,
      [owner_id]
    );

    const stats = {
      monthly_stats: monthlyStatsRes.rows,
      court_stats: courtStatsRes.rows
    };

    return res.status(200).json({ stats });

  } catch (error) {
    console.error("Error fetching owner stats:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}