import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const testRedis = async () => {
  try {
    console.log('Testing Redis connection...');
    
    const redisConfig = process.env.REDIS_URL ? {
      url: process.env.REDIS_URL
    } : {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD || ''
    };

    console.log('Redis config:', {
      host: redisConfig.socket?.host || 'URL-based',
      port: redisConfig.socket?.port || 'URL-based',
      username: redisConfig.username || 'none'
    });

    const client = createClient(redisConfig);
    
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    await client.connect();
    
    // Test basic operations
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    console.log('Test value:', value);
    
    await client.del('test:key');
    console.log('Redis test completed successfully!');
    
    await client.quit();
    process.exit(0);
    
  } catch (error) {
    console.error('Redis test failed:', error);
    process.exit(1);
  }
};

testRedis();