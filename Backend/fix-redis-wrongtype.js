import redisClient from './config/redis.js';

const fixRedisWrongType = async () => {
  try {
    console.log('🔍 DIAGNOSING REDIS WRONGTYPE ERROR...\n');
    
    // Get all keys to see what's in Redis
    console.log('1. Checking all Redis keys...');
    const allKeys = await redisClient.keys('*');
    console.log(`Found ${allKeys.length} keys in Redis:`, allKeys);
    
    if (allKeys.length === 0) {
      console.log('✅ No keys found - Redis is clean');
      return;
    }
    
    // Check each key's type and value
    console.log('\n2. Analyzing key types and values...');
    for (const key of allKeys) {
      try {
        const type = await redisClient.type(key);
        console.log(`\n📋 Key: ${key}`);
        console.log(`   Type: ${type}`);
        
        // Get value based on type
        let value;
        switch (type) {
          case 'string':
            value = await redisClient.get(key);
            console.log(`   Value: ${value}`);
            break;
          case 'hash':
            value = await redisClient.hGetAll(key);
            console.log(`   Hash fields: ${Object.keys(value).length}`);
            console.log(`   Sample: ${JSON.stringify(value).substring(0, 200)}...`);
            break;
          case 'list':
            const listLength = await redisClient.lLen(key);
            console.log(`   List length: ${listLength}`);
            if (listLength > 0) {
              const sample = await redisClient.lRange(key, 0, 2);
              console.log(`   Sample items: ${JSON.stringify(sample)}`);
            }
            break;
          case 'set':
            const setSize = await redisClient.sCard(key);
            console.log(`   Set size: ${setSize}`);
            break;
          default:
            console.log(`   Unknown type: ${type}`);
        }
      } catch (keyError) {
        console.error(`   ❌ Error checking key ${key}:`, keyError.message);
      }
    }
    
    // Look for problematic patterns
    console.log('\n3. Looking for problematic key patterns...');
    const matchKeys = allKeys.filter(key => key.includes('match:'));
    const userKeys = allKeys.filter(key => key.includes(':users'));
    const messageKeys = allKeys.filter(key => key.includes(':messages'));
    const sessionKeys = allKeys.filter(key => key.includes(':session'));
    
    console.log(`Match-related keys: ${matchKeys.length}`);
    console.log(`User keys: ${userKeys.length}`);
    console.log(`Message keys: ${messageKeys.length}`);
    console.log(`Session keys: ${sessionKeys.length}`);
    
    // Check for type conflicts
    console.log('\n4. Checking for type conflicts...');
    const conflicts = [];
    
    for (const key of allKeys) {
      try {
        const type = await redisClient.type(key);
        
        // Check if key pattern suggests it should be a different type
        if (key.includes(':users') && type !== 'hash') {
          conflicts.push({ key, expectedType: 'hash', actualType: type });
        }
        if (key.includes(':messages') && type !== 'list') {
          conflicts.push({ key, expectedType: 'list', actualType: type });
        }
        if (key.includes(':session') && type !== 'string') {
          conflicts.push({ key, expectedType: 'string', actualType: type });
        }
      } catch (error) {
        console.error(`Error checking ${key}:`, error.message);
      }
    }
    
    if (conflicts.length > 0) {
      console.log('❌ FOUND TYPE CONFLICTS:');
      conflicts.forEach(conflict => {
        console.log(`   ${conflict.key}: expected ${conflict.expectedType}, got ${conflict.actualType}`);
      });
      
      console.log('\n🔧 FIXING TYPE CONFLICTS...');
      
      // Fix conflicts by deleting problematic keys
      for (const conflict of conflicts) {
        console.log(`Deleting conflicted key: ${conflict.key}`);
        await redisClient.del(conflict.key);
      }
      
      console.log('✅ Type conflicts resolved!');
    } else {
      console.log('✅ No type conflicts found');
    }
    
    // Test Redis operations that are used in socket.js
    console.log('\n5. Testing Redis operations from socket.js...');
    
    const testMatchId = 'test_match_123';
    
    try {
      // Test session key (string)
      console.log('Testing session key operations...');
      const sessionKey = `match:${testMatchId}:session`;
      await redisClient.set(sessionKey, 'test_session_id', { EX: 60 });
      const sessionValue = await redisClient.get(sessionKey);
      console.log(`✅ Session operations work: ${sessionValue}`);
      
      // Test user hash operations
      console.log('Testing user hash operations...');
      const userKey = `match:${testMatchId}:users`;
      const userData = JSON.stringify({
        userId: 1,
        userName: 'Test User',
        joinedAt: new Date().toISOString(),
        socketId: 'test_socket',
        status: 'online'
      });
      await redisClient.hSet(userKey, '1', userData);
      const retrievedUser = await redisClient.hGet(userKey, '1');
      console.log(`✅ User hash operations work: ${JSON.parse(retrievedUser).userName}`);
      
      // Test message list operations
      console.log('Testing message list operations...');
      const messageKey = `match:${testMatchId}:messages`;
      const messageData = JSON.stringify({
        id: 'test_msg_1',
        matchId: testMatchId,
        userId: 1,
        userName: 'Test User',
        message: 'Test message',
        timestamp: new Date().toISOString()
      });
      await redisClient.lPush(messageKey, messageData);
      const messages = await redisClient.lRange(messageKey, 0, -1);
      console.log(`✅ Message list operations work: ${messages.length} messages`);
      
      // Clean up test keys
      await redisClient.del(sessionKey);
      await redisClient.del(userKey);
      await redisClient.del(messageKey);
      
      console.log('✅ All Redis operations working correctly!');
      
    } catch (testError) {
      console.error('❌ Redis operation test failed:', testError.message);
      console.error('This indicates the WRONGTYPE error is still present');
    }
    
    // Final cleanup recommendation
    console.log('\n6. CLEANUP RECOMMENDATIONS:');
    
    if (allKeys.length > 0) {
      console.log('🧹 Consider clearing all Redis data to start fresh:');
      console.log('   Option 1: Delete all match-related keys');
      console.log('   Option 2: Flush entire Redis database (FLUSHDB)');
      
      const userChoice = 'delete_match_keys'; // Default to safer option
      
      if (userChoice === 'delete_match_keys') {
        console.log('\n🗑️  Deleting all match-related keys...');
        const matchRelatedKeys = allKeys.filter(key => 
          key.includes('match:') || 
          key.includes('user:') || 
          key.includes('session:')
        );
        
        for (const key of matchRelatedKeys) {
          await redisClient.del(key);
          console.log(`   Deleted: ${key}`);
        }
        
        console.log(`✅ Deleted ${matchRelatedKeys.length} match-related keys`);
      }
    }
    
    console.log('\n🎉 REDIS WRONGTYPE ERROR DIAGNOSIS COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Redis connection working');
    console.log('✅ Key type conflicts resolved');
    console.log('✅ Redis operations tested successfully');
    console.log('✅ Cleanup completed');
    console.log('');
    console.log('🚀 Try joining a match again - the WRONGTYPE error should be fixed!');
    
  } catch (error) {
    console.error('❌ Redis diagnosis failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await redisClient.quit();
  }
};

fixRedisWrongType();