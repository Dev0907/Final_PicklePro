import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import redisClient from './redis.js';
import { 
  createChatMessage, 
  isUserInMatch, 
  isMatchReadyForChat,
  generateMatchSessionId,
  updateMessageStatus,
  getMessageStatus
} from '../models/chatModel.js';

export const initializeSocket = (server) => {
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
        
        // Generate or get session ID for this match
        const sessionKey = `match:${matchId}:session`;
        let sessionId = await redisClient.get(sessionKey);
        if (!sessionId) {
          sessionId = generateMatchSessionId(matchId);
          await redisClient.set(sessionKey, sessionId, { EX: 86400 * 7 }); // 7 days expiry
        }
        socket.sessionId = sessionId;
        
        // Store user in Redis for this match with enhanced data
        const userKey = `match:${matchId}:users`;
        const userData = JSON.stringify({
          userId: socket.userId,
          userName: socket.userName,
          joinedAt: new Date().toISOString(),
          socketId: socket.id,
          status: 'online'
        });
        await redisClient.hSet(userKey, String(socket.userId), userData);
        
        // Get online users count
        const onlineUsers = await redisClient.hGetAll(userKey);
        const onlineCount = Object.keys(onlineUsers).length;
        
        // Get and send recent messages from Redis with enhanced data
        try {
          const recentMessages = await redisClient.lRange(`match:${matchId}:messages`, -50, -1);
          const messages = recentMessages.map(msg => {
            const parsedMsg = JSON.parse(msg);
            return {
              ...parsedMsg,
              sessionId: sessionId,
              status: 'delivered' // Default status for existing messages
            };
          });
          socket.emit('recent-messages', messages);
        } catch (redisError) {
          console.error('Redis error getting messages:', redisError);
          socket.emit('recent-messages', []);
        }
        
        socket.emit('joined-match', { matchId, sessionId, onlineCount });
        
        // Notify others that user joined with enhanced data
        socket.to(`match-${matchId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          onlineCount: onlineCount,
          timestamp: new Date().toISOString()
        });

        // Send online users list
        socket.emit('online-users', Object.values(onlineUsers).map(u => JSON.parse(u)));

      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('error', 'Failed to join match chat');
      }
    });

    // Handle new message with WhatsApp-like features
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

        // Save to database with enhanced fields
        const dbMessage = await createChatMessage(matchId, socket.userId, message.trim(), socket.userName);
        
        // Store in Redis with enhanced data (keep last 100 messages)
        await redisClient.lPush(`match:${matchId}:messages`, JSON.stringify(messageData));
        await redisClient.lTrim(`match:${matchId}:messages`, 0, 99);

        // Get online users to track delivery
        const onlineUsers = await redisClient.hGetAll(`match:${matchId}:users`);
        const onlineUserIds = Object.keys(onlineUsers).filter(id => id !== String(socket.userId));

        // Send delivery confirmation to sender first
        socket.emit('message-sent', {
          messageId,
          timestamp: messageData.timestamp,
          status: 'sent'
        });

        // Broadcast to all users in the match (including sender for consistency)
        io.to(`match-${matchId}`).emit('new-message', messageData);

        // Track message delivery for online users
        setTimeout(async () => {
          try {
            for (const userId of onlineUserIds) {
              await updateMessageStatus(messageId, parseInt(userId), 'delivered');
            }
            
            // Update message status in Redis
            const updatedMessage = { ...messageData, status: 'delivered', deliveredTo: onlineUserIds };
            await redisClient.lPush(`match:${matchId}:message_status:${messageId}`, JSON.stringify(updatedMessage));
            
            // Notify sender about delivery
            socket.emit('message-delivered', {
              messageId,
              deliveredTo: onlineUserIds.length,
              timestamp: new Date().toISOString()
            });
          } catch (statusError) {
            console.error('Error updating message status:', statusError);
          }
        }, 100); // Small delay to ensure message is received

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
        await updateMessageStatus(messageId, socket.userId, 'read');
        
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
    socket.on('typing', (data) => {
      const { matchId, isTyping } = data;
      if (socket.currentMatch === matchId) {
        socket.to(`match-${matchId}`).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping
        });
      }
    });

    // Handle user going offline/online status
    socket.on('user-status', async (data) => {
      try {
        const { status, matchId } = data; // 'online', 'away', 'offline'
        
        if (!socket.currentMatch || socket.currentMatch !== matchId) {
          return;
        }

        // Update user status in Redis
        const userKey = `match:${matchId}:users`;
        const userData = await redisClient.hGet(userKey, String(socket.userId));
        if (userData) {
          const user = JSON.parse(userData);
          user.status = status;
          user.lastSeen = new Date().toISOString();
          await redisClient.hSet(userKey, String(socket.userId), JSON.stringify(user));
          
          // Notify others about status change
          socket.to(`match-${matchId}`).emit('user-status-changed', {
            userId: socket.userId,
            userName: socket.userName,
            status,
            lastSeen: user.lastSeen
          });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle disconnect with enhanced cleanup
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userName} disconnected`);
      
      if (socket.currentMatch && socket.userId) {
        try {
          // Update user status to offline in Redis instead of removing
          const userKey = `match:${socket.currentMatch}:users`;
          const userData = await redisClient.hGet(userKey, String(socket.userId));
          if (userData) {
            const user = JSON.parse(userData);
            user.status = 'offline';
            user.lastSeen = new Date().toISOString();
            await redisClient.hSet(userKey, String(socket.userId), JSON.stringify(user));
            
            // Get updated online count
            const allUsers = await redisClient.hGetAll(userKey);
            const onlineCount = Object.values(allUsers).filter(u => JSON.parse(u).status === 'online').length;
            
            // Notify others that user went offline
            socket.to(`match-${socket.currentMatch}`).emit('user-left', {
              userId: socket.userId,
              userName: socket.userName,
              onlineCount,
              lastSeen: user.lastSeen,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });

  return io;
};