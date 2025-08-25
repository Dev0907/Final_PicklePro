import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { 
  createChatMessage, 
  isUserInMatch, 
  isMatchReadyForChat,
  generateMatchSessionId,
  updateMessageStatus,
  getRecentMessages
} from '../models/chatModel.js';

// Redis client setup
let redisClient;
let redisSubscriber;
let redisPublisher;

const initializeRedis = async () => {
  try {
    // Redis configuration from environment variables
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

    // Main Redis client for general operations
    redisClient = createClient(redisConfig);

    // Separate clients for pub/sub
    redisSubscriber = createClient(redisConfig);
    redisPublisher = createClient(redisConfig);

    await redisClient.connect();
    await redisSubscriber.connect();
    await redisPublisher.connect();

    console.log('Redis clients connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

export const initializeSocket = async (server) => {
  // Initialize Redis first
  await initializeRedis();

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('No token provided in socket connection');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      // Get the actual username from database to ensure consistency
      try {
        const { default: pool } = await import('../db.js');
        const userResult = await pool.query('SELECT fullname FROM users WHERE id = $1', [decoded.id]);
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          socket.userName = user.fullname || 'Unknown User';
        } else {
          socket.userName = 'Unknown User';
        }
      } catch (dbError) {
        console.error('Error fetching username from database:', dbError);
        socket.userName = 'Unknown User';
      }
      
      console.log(`Socket authenticated: User ${socket.userName} (ID: ${socket.userId})`);
      next();
    } catch (err) {
      console.log('Socket authentication failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userName} connected`);

    // Join match room
    socket.on('join-match', async (matchId) => {
      try {
        // Verify user is part of the match
        const userInMatch = await isUserInMatch(matchId, socket.userId);
        if (!userInMatch) {
          socket.emit('error', 'You are not a participant in this match');
          return;
        }

        // Check if chat is available
        const chatReady = await isMatchReadyForChat(matchId);
        if (!chatReady) {
          socket.emit('chat-not-ready', 'Chat will be available when player requirements are met');
          return;
        }

        socket.join(`match-${matchId}`);
        socket.currentMatch = matchId;
        
        // Generate or get session ID for this match using Redis
        const sessionKey = `match:${matchId}:session`;
        let sessionId = await redisClient.get(sessionKey);
        if (!sessionId) {
          sessionId = generateMatchSessionId(matchId);
          await redisClient.setEx(sessionKey, 86400, sessionId); // 24 hours expiry
        }
        socket.sessionId = sessionId;
        
        // Store user session in Redis
        const userSessionKey = `match:${matchId}:users:${socket.userId}`;
        const userData = {
          userId: socket.userId,
          userName: socket.userName,
          joinedAt: new Date().toISOString(),
          socketId: socket.id,
          status: 'online',
          lastSeen: new Date().toISOString()
        };
        await redisClient.setEx(userSessionKey, 3600, JSON.stringify(userData)); // 1 hour expiry
        
        // Add user to match participants set
        await redisClient.sAdd(`match:${matchId}:participants`, socket.userId);
        
        // Get online users count from Redis
        const participantIds = await redisClient.sMembers(`match:${matchId}:participants`);
        const onlineUsers = [];
        
        for (const userId of participantIds) {
          const userKey = `match:${matchId}:users:${userId}`;
          const userDataStr = await redisClient.get(userKey);
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            onlineUsers.push(userData);
          }
        }
        
        const onlineCount = onlineUsers.filter(u => u.status === 'online').length;
        
        // Get recent messages from database
        const recentMessages = await getRecentMessages(matchId, 50);
        const messages = recentMessages.map(msg => ({
          ...msg,
          sessionId: sessionId,
          status: 'delivered'
        }));
        
        socket.emit('recent-messages', messages);
        socket.emit('joined-match', { matchId, sessionId, onlineCount });
        
        // Notify others that user joined
        socket.to(`match-${matchId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          onlineCount: onlineCount,
          timestamp: new Date().toISOString()
        });

        // Send online users list
        socket.emit('online-users', onlineUsers);

        // Subscribe to Redis pub/sub for this match
        const channelName = `match:${matchId}:events`;
        await redisSubscriber.subscribe(channelName, (message) => {
          try {
            const event = JSON.parse(message);
            if (event.type === 'user-status-changed' && event.userId !== socket.userId) {
              socket.emit('user-status-changed', event.data);
            }
          } catch (error) {
            console.error('Error processing Redis message:', error);
          }
        });

      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('error', 'Failed to join match chat');
      }
    });

    // Handle new message with Redis storage
    socket.on('send-message', async (data) => {
      try {
        const { matchId, message, messageType = 'text', replyTo = null } = data;
        
        if (!socket.currentMatch || socket.currentMatch !== matchId) {
          socket.emit('error', 'You must join the match first');
          return;
        }

        // Verify user is still part of the match and chat is ready
        const userInMatch = await isUserInMatch(matchId, socket.userId);
        const chatReady = await isMatchReadyForChat(matchId);
        
        if (!userInMatch || !chatReady) {
          socket.emit('error', 'You cannot send messages to this match');
          return;
        }

        // Create enhanced message object with UUID
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageData = {
          id: messageId,
          matchId,
          userId: socket.userId,
          userName: socket.userName,
          message: message.trim(),
          messageType,
          replyTo,
          sessionId: socket.sessionId,
          timestamp: new Date().toISOString(),
          status: 'sent',
          deliveredTo: [],
          readBy: []
        };

        // Save to database
        try {
          await createChatMessage(matchId, socket.userId, message.trim(), socket.userName);
        } catch (dbError) {
          console.error('Error saving message to database:', dbError);
        }
        
        // Store message in Redis for quick access
        const messageKey = `match:${matchId}:messages`;
        await redisClient.lPush(messageKey, JSON.stringify(messageData));
        await redisClient.lTrim(messageKey, 0, 99); // Keep last 100 messages
        await redisClient.expire(messageKey, 86400); // 24 hours expiry

        // Get online users from Redis to track delivery
        const participantIds = await redisClient.sMembers(`match:${matchId}:participants`);
        const onlineUserIds = [];
        
        for (const userId of participantIds) {
          if (userId !== socket.userId.toString()) {
            const userKey = `match:${matchId}:users:${userId}`;
            const userDataStr = await redisClient.get(userKey);
            if (userDataStr) {
              const userData = JSON.parse(userDataStr);
              if (userData.status === 'online') {
                onlineUserIds.push(userId);
              }
            }
          }
        }

        // Send delivery confirmation to sender first
        socket.emit('message-sent', {
          messageId,
          timestamp: messageData.timestamp,
          status: 'sent'
        });

        // Broadcast to all users in the match
        io.to(`match-${matchId}`).emit('new-message', messageData);

        // Track message delivery for online users
        setTimeout(async () => {
          try {
            for (const userId of onlineUserIds) {
              try {
                await updateMessageStatus(messageId, parseInt(userId), 'delivered');
              } catch (statusError) {
                console.error('Error updating message status:', statusError);
              }
            }
            
            // Store delivery info in Redis
            const deliveryKey = `message:${messageId}:delivery`;
            await redisClient.setEx(deliveryKey, 3600, JSON.stringify({
              deliveredTo: onlineUserIds,
              deliveredAt: new Date().toISOString()
            }));
            
            // Notify sender about delivery
            socket.emit('message-delivered', {
              messageId,
              deliveredTo: onlineUserIds.length,
              timestamp: new Date().toISOString()
            });
          } catch (statusError) {
            console.error('Error updating message status:', statusError);
          }
        }, 100);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle message read status
    socket.on('message-read', async (data) => {
      try {
        const { messageId, matchId } = data;
        
        if (!socket.currentMatch || socket.currentMatch !== matchId) {
          return;
        }

        // Update message status to read
        try {
          await updateMessageStatus(messageId, socket.userId, 'read');
          
          // Store read status in Redis
          const readKey = `message:${messageId}:read:${socket.userId}`;
          await redisClient.setEx(readKey, 3600, JSON.stringify({
            userId: socket.userId,
            userName: socket.userName,
            readAt: new Date().toISOString()
          }));
          
        } catch (statusError) {
          console.error('Error updating message read status:', statusError);
        }
        
        // Notify other users about read status
        socket.to(`match-${matchId}`).emit('message-read-by', {
          messageId,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error updating message read status:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { matchId, isTyping } = data;
        if (socket.currentMatch === matchId) {
          // Store typing status in Redis with short expiry
          const typingKey = `match:${matchId}:typing:${socket.userId}`;
          if (isTyping) {
            await redisClient.setEx(typingKey, 5, JSON.stringify({
              userId: socket.userId,
              userName: socket.userName,
              isTyping: true,
              timestamp: new Date().toISOString()
            }));
          } else {
            await redisClient.del(typingKey);
          }
          
          socket.to(`match-${matchId}`).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping
          });
        }
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    // Handle user status changes
    socket.on('user-status', async (data) => {
      try {
        const { status, matchId } = data; // 'online', 'away', 'offline'
        
        if (!socket.currentMatch || socket.currentMatch !== matchId) {
          return;
        }

        // Update user status in Redis
        const userSessionKey = `match:${matchId}:users:${socket.userId}`;
        const userDataStr = await redisClient.get(userSessionKey);
        
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.status = status;
          userData.lastSeen = new Date().toISOString();
          
          await redisClient.setEx(userSessionKey, 3600, JSON.stringify(userData));
          
          // Publish status change event
          const channelName = `match:${matchId}:events`;
          await redisPublisher.publish(channelName, JSON.stringify({
            type: 'user-status-changed',
            userId: socket.userId,
            data: {
              userId: socket.userId,
              userName: socket.userName,
              status,
              lastSeen: userData.lastSeen
            }
          }));
          
          // Notify others about status change
          socket.to(`match-${matchId}`).emit('user-status-changed', {
            userId: socket.userId,
            userName: socket.userName,
            status,
            lastSeen: userData.lastSeen
          });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle disconnect with Redis cleanup
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userName} disconnected`);
      
      if (socket.currentMatch && socket.userId) {
        try {
          const matchId = socket.currentMatch;
          
          // Update user status to offline in Redis
          const userSessionKey = `match:${matchId}:users:${socket.userId}`;
          const userDataStr = await redisClient.get(userSessionKey);
          
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userData.status = 'offline';
            userData.lastSeen = new Date().toISOString();
            
            // Keep user data for a short while after disconnect
            await redisClient.setEx(userSessionKey, 300, JSON.stringify(userData)); // 5 minutes
            
            // Get updated online count
            const participantIds = await redisClient.sMembers(`match:${matchId}:participants`);
            let onlineCount = 0;
            
            for (const userId of participantIds) {
              const userKey = `match:${matchId}:users:${userId}`;
              const userDataStr = await redisClient.get(userKey);
              if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.status === 'online') {
                  onlineCount++;
                }
              }
            }
            
            // Notify others that user went offline
            socket.to(`match-${matchId}`).emit('user-left', {
              userId: socket.userId,
              userName: socket.userName,
              onlineCount,
              lastSeen: userData.lastSeen,
              timestamp: new Date().toISOString()
            });
          }
          
          // Clean up typing indicators
          const typingKey = `match:${matchId}:typing:${socket.userId}`;
          await redisClient.del(typingKey);
          
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down socket server...');
    if (redisClient) await redisClient.quit();
    if (redisSubscriber) await redisSubscriber.quit();
    if (redisPublisher) await redisPublisher.quit();
    io.close();
  });

  return io;
};