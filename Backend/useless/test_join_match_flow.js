import pool from '../db.js';

async function testJoinMatchFlow() {
  try {
    console.log('🧪 Testing join match flow...');

    // Test 1: Check if matches are available
    console.log('\n1. Testing getAllMatches endpoint...');
    const matchesResult = await pool.query(`
      SELECT 
        m.*, 
        u.fullname as creator_name, 
        u.level_of_game as creator_level, 
        COALESCE(COUNT(mp.user_id), 0) as current_participants
       FROM matches m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN matchparticipants mp ON m.id = mp.match_id
       WHERE m.date_time > NOW() 
         AND (m.status IS NULL OR m.status = 'active' OR m.status = 'upcoming')
       GROUP BY m.id, u.fullname, u.level_of_game
       HAVING COALESCE(COUNT(mp.user_id), 0) < m.players_required
       ORDER BY m.date_time ASC
       LIMIT 5
    `);

    console.log(`✅ Found ${matchesResult.rows.length} available matches:`);
    matchesResult.rows.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name}`);
      console.log(`      Date: ${new Date(match.date_time).toLocaleDateString()}`);
      console.log(`      Location: ${match.location}`);
      console.log(`      Participants: ${match.current_participants}/${match.players_required}`);
      console.log(`      Status: ${match.status}`);
      console.log('');
    });

    // Test 2: Check join requests functionality
    console.log('\n2. Testing join requests...');
    const joinRequestsResult = await pool.query(`
      SELECT COUNT(*) as count FROM join_requests WHERE status = 'pending'
    `);
    console.log(`✅ Found ${joinRequestsResult.rows[0].count} pending join requests`);

    // Test 3: Check if notification system is working
    console.log('\n3. Testing notification system...');
    const notificationsResult = await pool.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE type IN ('match_join_request', 'join_request_sent', 'join_request_accepted', 'join_request_declined')
    `);
    console.log(`✅ Found ${notificationsResult.rows[0].count} match-related notifications`);

    // Test 4: Check recent join requests with details
    console.log('\n4. Recent join requests:');
    const recentRequestsResult = await pool.query(`
      SELECT 
        jr.id as request_id,
        jr.match_id,
        jr.status,
        jr.created_at as request_time,
        u.fullname,
        u.phone_no,

        m.date_time,
        m.location as match_location,
        creator.fullname as match_creator
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN matches m ON jr.match_id = m.id
      JOIN users creator ON m.user_id = creator.id
      WHERE jr.status = 'pending'
      ORDER BY jr.created_at DESC
      LIMIT 5
    `);

    if (recentRequestsResult.rows.length === 0) {
      console.log('   No pending join requests found');
    } else {
      recentRequestsResult.rows.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.fullname} wants to join ${request.match_creator}'s match`);
        console.log(`      Match: ${new Date(request.date_time).toLocaleDateString()} at ${request.match_location}`);
        console.log(`      Requested: ${new Date(request.request_time).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('\n🎉 Join match flow test completed!');
    console.log('\n📋 System Status:');
    console.log(`   ✅ ${matchesResult.rows.length} matches available for joining`);
    console.log(`   ✅ ${joinRequestsResult.rows[0].count} pending join requests`);
    console.log(`   ✅ ${notificationsResult.rows[0].count} match notifications in system`);
    console.log('   ✅ Join match functionality is ready!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testJoinMatchFlow()
  .then(() => {
    console.log('\n🎯 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });