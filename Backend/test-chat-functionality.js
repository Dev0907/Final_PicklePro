// Test script to verify chat functionality
import { 
  createChatMessage, 
  getRecentMessages, 
  isUserInMatch, 
  isMatchReadyForChat,
  getMatchParticipants
} from './models/chatModel.js';

async function testChatFunctionality() {
  console.log('Testing chat functionality...');
  
  try {
    // Test with sample data (replace with actual IDs from your database)
    const testMatchId = 1;
    const testUserId1 = 1;
    const testUserId2 = 2;
    const testUserName1 = 'Player 1';
    const testUserName2 = 'Player 2';
    
    console.log('\n1. Testing match readiness...');
    const isReady = await isMatchReadyForChat(testMatchId);
    console.log(`Match ${testMatchId} ready for chat:`, isReady);
    
    console.log('\n2. Testing user permissions...');
    const user1InMatch = await isUserInMatch(testMatchId, testUserId1);
    const user2InMatch = await isUserInMatch(testMatchId, testUserId2);
    console.log(`User ${testUserId1} in match:`, user1InMatch);
    console.log(`User ${testUserId2} in match:`, user2InMatch);
    
    console.log('\n3. Testing message creation...');
    const message1 = await createChatMessage(testMatchId, testUserId1, 'Hello from Player 1!', testUserName1);
    console.log('Message 1 created:', message1);
    
    const message2 = await createChatMessage(testMatchId, testUserId2, 'Hi Player 1! Ready to play?', testUserName2);
    console.log('Message 2 created:', message2);
    
    console.log('\n4. Testing message retrieval...');
    const recentMessages = await getRecentMessages(testMatchId, 10);
    console.log('Recent messages:', recentMessages);
    
    console.log('\n5. Testing match participants...');
    const participants = await getMatchParticipants(testMatchId);
    console.log('Match participants:', participants);
    
    console.log('\nChat functionality test completed successfully!');
    
  } catch (error) {
    console.error('Error testing chat functionality:', error);
  }
}

// Run the test
testChatFunctionality();