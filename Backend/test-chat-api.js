import pool from './db.js';
import { isUserInMatch, isMatchReadyForChat, getMatchParticipants } from './models/chatModel.js';

const testChatAPI = async () => {
  try {
    console.log('Testing chat API functions...');
    
    // Test with match ID 54 (from the error)
    const matchId = '54';
    
    // Check if match exists
    const matchCheck = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
    if (matchCheck.rows.length === 0) {
      console.log(`❌ Match ${matchId} does not exist`);
      
      // Show available matches
      const availableMatches = await pool.query('SELECT id, creator_id, players_needed FROM matches LIMIT 5');
      console.log('Available matches:');
      availableMatches.rows.forEach(match => {
        console.log(`  - Match ${match.id}: Creator ${match.creator_id}, Needs ${match.players_needed} players`);
      });
      return;
    }
    
    console.log(`✅ Match ${matchId} exists`);
    const match = matchCheck.rows[0];
    console.log(`   Creator: ${match.creator_id}, Players needed: ${match.players_needed}`);
    
    // Test with the creator user ID
    const userId = match.creator_id;
    console.log(`Testing with user ID: ${userId}`);
    
    // Test isUserInMatch
    const userInMatch = await isUserInMatch(matchId, userId);
    console.log(`✅ User ${userId} in match ${matchId}: ${userInMatch}`);
    
    // Test isMatchReadyForChat
    const chatReady = await isMatchReadyForChat(matchId);
    console.log(`✅ Chat ready for match ${matchId}: ${chatReady}`);
    
    // Test getMatchParticipants
    const participants = await getMatchParticipants(matchId);
    console.log(`✅ Participants in match ${matchId}:`, participants.length);
    participants.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
    });
    
    // Show join requests for this match
    const joinRequests = await pool.query(`
      SELECT jr.*, u.name as user_name 
      FROM join_requests jr 
      JOIN users u ON jr.user_id = u.id 
      WHERE jr.match_id = $1
    `, [matchId]);
    
    console.log(`📋 Join requests for match ${matchId}:`);
    joinRequests.rows.forEach(jr => {
      console.log(`   - ${jr.user_name} (${jr.status})`);
    });
    
  } catch (error) {
    console.error('❌ Chat API test failed:', error);
  } finally {
    await pool.end();
  }
};

testChatAPI();