import pool from '../db.js';
import { createNotification } from '../models/notificationModel.js';

async function testMatchAndNotifications() {
  try {
    console.log('🧪 Testing match creation and notifications...');

    // Test 1: Check if matches table exists and has data
    console.log('\n1. Checking matches table...');
    const matchesResult = await pool.query('SELECT COUNT(*) FROM matches');
    console.log(`   ✅ Matches table exists with ${matchesResult.rows[0].count} matches`);

    // Test 2: Check if notifications table exists
    console.log('\n2. Checking notifications table...');
    const notificationsResult = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`   ✅ Notifications table exists with ${notificationsResult.rows[0].count} notifications`);

    // Test 3: Check if matchparticipants table exists
    console.log('\n3. Checking matchparticipants table...');
    const participantsResult = await pool.query('SELECT COUNT(*) FROM matchparticipants');
    console.log(`   ✅ Matchparticipants table exists with ${participantsResult.rows[0].count} participants`);

    // Test 4: Check if join_requests table exists
    console.log('\n4. Checking join_requests table...');
    const joinRequestsResult = await pool.query('SELECT COUNT(*) FROM join_requests');
    console.log(`   ✅ Join_requests table exists with ${joinRequestsResult.rows[0].count} requests`);

    // Test 5: Get a sample user to test notifications
    console.log('\n5. Testing notification creation...');
    const usersResult = await pool.query('SELECT id, fullname FROM users LIMIT 1');
    
    if (usersResult.rows.length > 0) {
      const testUser = usersResult.rows[0];
      console.log(`   📝 Testing with user: ${testUser.fullname} (ID: ${testUser.id})`);

      // Create a test notification
      const testNotification = await createNotification({
        user_id: testUser.id,
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working.',
        related_id: null,
        related_type: 'system'
      });

      console.log(`   ✅ Test notification created with ID: ${testNotification.id}`);
    } else {
      console.log('   ⚠️  No users found in database');
    }

    // Test 6: Check recent matches query
    console.log('\n6. Testing matches query...');
    const recentMatches = await pool.query(`
      SELECT 
        m.*, 
        u.fullname as creator_name, 
        u.level_of_game as creator_level, 
        COALESCE(COUNT(mp.user_id), 0) as current_participants
       FROM matches m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN matchparticipants mp ON m.id = mp.match_id
       WHERE m.date_time > NOW() 
         AND (m.status IS NULL OR m.status = 'active')
       GROUP BY m.id, u.fullname, u.level_of_game
       HAVING COALESCE(COUNT(mp.user_id), 0) < m.players_required
       ORDER BY m.date_time ASC
       LIMIT 5
    `);

    console.log(`   ✅ Found ${recentMatches.rows.length} available matches`);
    recentMatches.rows.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name} on ${new Date(match.date_time).toLocaleDateString()}`);
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 System Status:');
    console.log('   ✅ Database tables are properly set up');
    console.log('   ✅ Notification system is functional');
    console.log('   ✅ Match queries are working');
    console.log('   ✅ Ready for testing!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testMatchAndNotifications()
  .then(() => {
    console.log('\n🎯 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });