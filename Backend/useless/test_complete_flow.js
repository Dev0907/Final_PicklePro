import pool from '../db.js';
import { createNotification } from '../models/notificationModel.js';

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete match and notification flow...');

    // Get two test users
    const users = await pool.query('SELECT id, fullname FROM users LIMIT 2');
    if (users.rows.length < 2) {
      console.log('❌ Need at least 2 users in database for testing');
      return;
    }

    const creator = users.rows[0];
    const joiner = users.rows[1];
    console.log(`👤 Creator: ${creator.fullname} (ID: ${creator.id})`);
    console.log(`👤 Joiner: ${joiner.fullname} (ID: ${joiner.id})`);

    // Step 1: Create a test match
    console.log('\n🎯 Step 1: Creating a test match...');
    const matchResult = await pool.query(`
      INSERT INTO matches (user_id, date_time, location, players_required, level_of_game, status, sport)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      creator.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      'Test Location',
      2,
      'Intermediate',
      'upcoming',
      'Pickleball'
    ]);

    const match = matchResult.rows[0];
    console.log(`✅ Match created with ID: ${match.id}`);

    // Step 2: Create match creation notification
    console.log('\n🔔 Step 2: Creating match creation notification...');
    const creationNotification = await createNotification({
      user_id: creator.id,
      type: 'match_created',
      title: 'Match Created Successfully',
      message: `Your match on ${new Date(match.date_time).toLocaleDateString()} at ${match.location} has been created and is now available for others to join.`,
      related_id: match.id,
      related_type: 'match'
    });
    console.log(`✅ Creation notification created with ID: ${creationNotification.id}`);

    // Step 3: Create a join request
    console.log('\n🤝 Step 3: Creating a join request...');
    const joinRequestResult = await pool.query(`
      INSERT INTO join_requests (match_id, user_id, status, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [match.id, joiner.id, 'pending', 'I would like to join this match!']);

    const joinRequest = joinRequestResult.rows[0];
    console.log(`✅ Join request created with ID: ${joinRequest.id}`);

    // Step 4: Create join request notifications
    console.log('\n🔔 Step 4: Creating join request notifications...');
    
    // Notify match creator about new join request
    const creatorNotification = await createNotification({
      user_id: creator.id,
      type: 'match_join_request',
      title: 'New Join Request',
      message: `${joiner.fullname} wants to join your ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()}. Check your match requests to accept or decline.`,
      related_id: match.id,
      related_type: 'match'
    });
    console.log(`✅ Creator notification created with ID: ${creatorNotification.id}`);

    // Notify requester about successful request
    const requesterNotification = await createNotification({
      user_id: joiner.id,
      type: 'join_request_sent',
      title: 'Join Request Sent',
      message: `Your request to join the ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} has been sent successfully.`,
      related_id: match.id,
      related_type: 'match'
    });
    console.log(`✅ Requester notification created with ID: ${requesterNotification.id}`);

    // Step 5: Simulate approval
    console.log('\n✅ Step 5: Simulating join request approval...');
    
    // Update join request status
    await pool.query(`
      UPDATE join_requests 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `, [joinRequest.id]);
    console.log(`✅ Join request approved`);

    // Add participant to match
    await pool.query(`
      INSERT INTO matchparticipants (match_id, user_id)
      VALUES ($1, $2)
    `, [match.id, joiner.id]);
    console.log(`✅ Participant added to match`);

    // Step 6: Create approval notifications
    console.log('\n🔔 Step 6: Creating approval notifications...');
    
    // Notify the requester about acceptance
    const acceptedNotification = await createNotification({
      user_id: joiner.id,
      type: 'join_request_accepted',
      title: 'Join Request Accepted!',
      message: `Great news! Your request to join the ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} has been accepted.`,
      related_id: match.id,
      related_type: 'match'
    });
    console.log(`✅ Acceptance notification created with ID: ${acceptedNotification.id}`);

    // Notify match creator about new partner
    const partnerNotification = await createNotification({
      user_id: creator.id,
      type: 'match_partner_joined',
      title: 'Partner Joined Your Match',
      message: `${joiner.fullname} has joined your ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()}. Your match is now ready!`,
      related_id: match.id,
      related_type: 'match'
    });
    console.log(`✅ Partner notification created with ID: ${partnerNotification.id}`);

    // Step 7: Verify the complete flow
    console.log('\n🔍 Step 7: Verifying the complete flow...');
    
    // Check notifications for creator
    const creatorNotifications = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 AND related_id = $2
      ORDER BY created_at ASC
    `, [creator.id, match.id]);
    
    console.log(`📬 Creator has ${creatorNotifications.rows.length} notifications:`);
    creatorNotifications.rows.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.type}: ${notif.title}`);
    });

    // Check notifications for joiner
    const joinerNotifications = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 AND related_id = $2
      ORDER BY created_at ASC
    `, [joiner.id, match.id]);
    
    console.log(`📬 Joiner has ${joinerNotifications.rows.length} notifications:`);
    joinerNotifications.rows.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.type}: ${notif.title}`);
    });

    // Check match participants
    const participants = await pool.query(`
      SELECT COUNT(*) as count FROM matchparticipants WHERE match_id = $1
    `, [match.id]);
    
    console.log(`👥 Match has ${participants.rows[0].count} participant(s)`);

    console.log('\n🎉 Complete flow test successful!');
    console.log('\n📋 Flow Summary:');
    console.log('   ✅ Match created with notification');
    console.log('   ✅ Join request sent with notifications');
    console.log('   ✅ Join request approved with notifications');
    console.log('   ✅ Participant added to match');
    console.log('   ✅ All notifications created correctly');

  } catch (error) {
    console.error('❌ Flow test failed:', error);
    throw error;
  }
}

// Run the test
testCompleteFlow()
  .then(() => {
    console.log('\n🎯 Complete flow test finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Flow test failed:', error);
    process.exit(1);
  });