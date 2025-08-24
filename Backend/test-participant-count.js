import pool from './db.js';
import { getAllMatchesWithCounts, updateMatchParticipantCount } from './models/matchModel.js';

const testParticipantCounts = async () => {
  try {
    console.log('🧪 Testing participant count functionality...\n');
    
    // Test 1: Get all matches with counts
    console.log('1. Testing getAllMatchesWithCounts...');
    const matches = await getAllMatchesWithCounts();
    console.log(`Found ${matches.length} matches`);
    
    if (matches.length > 0) {
      const match = matches[0];
      console.log('Sample match data:');
      console.log(`- Match ID: ${match.id}`);
      console.log(`- Creator: ${match.creator_name}`);
      console.log(`- Current Participants: ${match.current_participants}`);
      console.log(`- Players Required: ${match.players_required}`);
      console.log(`- Players Needed: ${match.players_needed}`);
      console.log(`- Participant Names: ${match.participant_names || 'None'}`);
      
      // Test 2: Update participant count
      console.log('\n2. Testing updateMatchParticipantCount...');
      const updatedMatch = await updateMatchParticipantCount(match.id);
      if (updatedMatch) {
        console.log(`✅ Updated match ${match.id} participant count: ${updatedMatch.current_participants}`);
      }
    }
    
    // Test 3: Check database consistency
    console.log('\n3. Testing database consistency...');
    const dbCheck = await pool.query(`
      SELECT 
        m.id,
        m.players_required,
        COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END) as accepted_requests,
        COUNT(DISTINCT mp.user_id) as direct_participants
      FROM matches m
      LEFT JOIN join_requests jr ON m.id = jr.match_id
      LEFT JOIN matchparticipants mp ON m.id = mp.match_id
      WHERE m.date_time > NOW()
      GROUP BY m.id, m.players_required
      LIMIT 3
    `);
    
    console.log('Database consistency check:');
    dbCheck.rows.forEach(row => {
      const totalParticipants = 1 + parseInt(row.accepted_requests) + parseInt(row.direct_participants);
      console.log(`- Match ${row.id}: ${totalParticipants}/${row.players_required} (${row.accepted_requests} accepted, ${row.direct_participants} direct)`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
};

testParticipantCounts();