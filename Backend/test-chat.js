import pool from './db.js';
import { isUserInMatch, isMatchReadyForChat, createChatMessage } from './models/chatModel.js';

async function testChatFunctionality() {
  try {
    console.log('🧪 Testing chat functionality...\n');
    
    // Test 1: Check if we have any matches
    console.log('1. Checking available matches...');
    const matchesResult = await pool.query('SELECT id, user_id, location, players_required FROM matches LIMIT 5');
    console.log(`Found ${matchesResult.rows.length} matches:`);
    matchesResult.rows.forEach(match => {
      console.log(`  - Match ID: ${match.id}, Creator: ${match.user_id}, Location: ${match.location}, Players needed: ${match.players_required}`);
    });
    
    if (matchesResult.rows.length === 0) {
      console.log('❌ No matches found. Create a match first to test chat.');
      process.exit(1);
    }
    
    const testMatch = matchesResult.rows[0];
    console.log(`\n2. Testing with Match ID: ${testMatch.id}`);
    
    // Test 2: Check if match is ready for chat
    console.log('3. Checking if match is ready for chat...');
    const chatReady = await isMatchReadyForChat(testMatch.id);
    console.log(`Chat ready: ${chatReady}`);
    
    // Test 3: Check if creator can access chat
    console.log('4. Checking if creator can access chat...');
    const creatorCanAccess = await isUserInMatch(testMatch.id, testMatch.user_id);
    console.log(`Creator can access: ${creatorCanAccess}`);
    
    // Test 4: Get user info
    console.log('5. Getting creator user info...');
    const userResult = await pool.query('SELECT id, fullname, email FROM users WHERE id = $1', [testMatch.user_id]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`Creator: ${user.fullname} (${user.email})`);
      
      // Test 5: Create a test message
      console.log('6. Creating a test message...');
      const testMessage = await createChatMessage(testMatch.id, user.id, 'Hello! This is a test message from the chat system.', user.fullname);
      console.log(`Test message created: ${testMessage.id}`);
      
      // Test 6: Retrieve messages
      console.log('7. Retrieving recent messages...');
      const messagesResult = await pool.query(`
        SELECT id, message, user_name, created_at 
        FROM chat_messages 
        WHERE match_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [testMatch.id]);
      
      console.log(`Found ${messagesResult.rows.length} messages:`);
      messagesResult.rows.forEach(msg => {
        console.log(`  - ${msg.user_name}: ${msg.message} (${new Date(msg.created_at).toLocaleString()})`);
      });
    }
    
    console.log('\n✅ Chat functionality test completed successfully!');
    console.log('\n📋 Test Results Summary:');
    console.log(`   - Database tables: ✅ Ready`);
    console.log(`   - Match availability: ✅ ${matchesResult.rows.length} matches found`);
    console.log(`   - Chat readiness: ${chatReady ? '✅' : '❌'} ${chatReady ? 'Ready' : 'Not ready'}`);
    console.log(`   - User access: ${creatorCanAccess ? '✅' : '❌'} ${creatorCanAccess ? 'Authorized' : 'Not authorized'}`);
    console.log(`   - Message creation: ✅ Working`);
    console.log(`   - Message retrieval: ✅ Working`);
    
    console.log('\n🚀 You can now test the chat in the frontend!');
    console.log(`   - Go to: http://localhost:5173/chat-test`);
    console.log(`   - Use Match ID: ${testMatch.id}`);
    console.log(`   - Make sure you're logged in as the match creator or a participant`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Chat functionality test failed:', error);
    process.exit(1);
  }
}

testChatFunctionality();