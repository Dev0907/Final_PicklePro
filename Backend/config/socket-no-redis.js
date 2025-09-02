import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { 
  createChatMessage, 
  isUserInMatch, 
  isMatchReadyForChat,
  generateMatchSessionId,
  updateMessageStatus,
  getMessageStatus
} from '../models/chatModel.js';

<<<<<<< HEAD
let io = null;

=======
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
// In-memory storage for chat (replaces Redis)
const matchSessions = new Map(); // matchId -> sessionId
const matchUsers = new Map(); // matchId -> Map(userId -> userData)
const matchMessages = new Map(); // matchId -> Array of messages

<<<<<<< HEAD
/**
 * Initialize Socket.IO with the given HTTP server
 * @param {import('http').Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
=======
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
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
        
        // Generate or get session ID for this match (in-memory)
        let sessionId = matchSessions.get(matchId);
        if (!sessionId) {
          sessionId = generateMatchSessionId(matchId);
          matchSessions.set(matchId, sessionId);
        }
        socket.sessionId = sessionId;
        
        // Store user in memory for this match
        if (!matchUsers.has(matchId)) {
          matchUsers.set(matchId, new Map());
        }
        const usersMap = matchUsers.get(matchId);
        const userData = {
          userId: socket.userId,
          userName: socket.userName,
          joinedAt: new Date().toISOString(),
          socketId: socket.id,
          status: 'online'
        };
        usersMap.set(socket.userId, userData);
        
        // Get online users count
        const onlineCount = Array.from(usersMap.values()).filter(u => u.status === 'online').length;
        
        // Get recent messages from database to ensure consistency
        try {
          const { getRecentMessages } = await import('../models/chatModel.js');
          const dbMessages = await getRecentMessages(matchId, 50);
          const messages = dbMessages.map(msg => ({
            id: msg.id,
            matchId: msg.matchId,
            userId: msg.userId.toString(),
            userName: msg.userName,
            message: msg.message,
            timestamp: msg.timestamp,
            messageType: msg.messageType || 'text',
            sessionId: sessionId,
            status: 'delivered'
          }));
          socket.emit('recent-messages', messages);
          
          // Also store in memory for faster access
          matchMessages.set(matchId, messages);
        } catch (dbError) {
          console.error('Error fetching recent messages from database:', dbError);
          // Fallback to memory
          const recentMessages = matchMessages.get(matchId) || [];
          const messages = recentMessages.slice(-50).map(msg => ({
            ...msg,
            sessionId: sessionId,
            status: 'delivered'
          }));
          socket.emit('recent-messages', messages);
        }
        
        socket.emit('joined-match', { matchId, sessionId, onlineCount });
        
        // Notify others that user joined
        socket.to(`match-${matchId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          onlineCount: onlineCount,
          timestamp: new Date().toISOString()
        });

        // Send online users list
        socket.emit('online-users', Array.from(usersMap.values()));

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

        // Save to database first to get proper ID
        let savedMessage;
        try {
          savedMessage = await createChatMessage(matchId, socket.userId, message.trim(), socket.userName);
        } catch (dbError) {
          console.error('Error saving message to database:', dbError);
          socket.emit('error', 'Failed to save message');
          return;
        }

        // Create enhanced message object with database ID
        const messageData = {
          id: savedMessage.id.toString(),
          matchId,
          userId: socket.userId.toString(),
          userName: socket.userName,
          message: message.trim(),
          messageType,
          replyTo,
          sessionId: socket.sessionId,
          timestamp: savedMessage.created_at || new Date().toISOString(),
          status: 'sent',
          deliveredTo: [],
          readBy: []
        };
        
        // Store in memory (keep last 100 messages)
        if (!matchMessages.has(matchId)) {
          matchMessages.set(matchId, []);
        }
        const messages = matchMessages.get(matchId);
        messages.push(messageData);
        if (messages.length > 100) {
          messages.shift(); // Remove oldest message
        }

        // Get online users to track delivery
        const usersMap = matchUsers.get(matchId) || new Map();
        const onlineUserIds = Array.from(usersMap.keys()).filter(id => 
          id !== socket.userId && usersMap.get(id).status === 'online'
        );

        // Send delivery confirmation to sender first
        socket.emit('message-sent', {
          messageId: messageData.id,
          timestamp: messageData.timestamp,
          status: 'sent'
        });

        // Broadcast to all users in the match room
        io.to(`match-${matchId}`).emit('new-message', messageData);
        
        console.log(`Message broadcasted to match-${matchId}:`, {
          messageId: messageData.id,
          from: socket.userName,
          message: messageData.message.substring(0, 50) + '...'
        });

        // Track message delivery for online users
        setTimeout(async () => {
          try {
            for (const userId of onlineUserIds) {
              try {
                await updateMessageStatus(messageData.id, parseInt(userId), 'delivered');
              } catch (statusError) {
                console.error('Error updating message status:', statusError);
              }
            }
            
            // Notify sender about delivery
            socket.emit('message-delivered', {
              messageId: messageData.id,
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

        // Update user status in memory
        const usersMap = matchUsers.get(matchId);
        if (usersMap && usersMap.has(socket.userId)) {
          const userData = usersMap.get(socket.userId);
          userData.status = status;
          userData.lastSeen = new Date().toISOString();
          usersMap.set(socket.userId, userData);
          
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

    // Handle disconnect with enhanced cleanup
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userName} disconnected`);
      
      if (socket.currentMatch && socket.userId) {
        try {
          // Update user status to offline in memory
          const usersMap = matchUsers.get(socket.currentMatch);
          if (usersMap && usersMap.has(socket.userId)) {
            const userData = usersMap.get(socket.userId);
            userData.status = 'offline';
            userData.lastSeen = new Date().toISOString();
            usersMap.set(socket.userId, userData);
            
            // Get updated online count
            const onlineCount = Array.from(usersMap.values()).filter(u => u.status === 'online').length;
            
            // Notify others that user went offline
            socket.to(`match-${socket.currentMatch}`).emit('user-left', {
              userId: socket.userId,
              userName: socket.userName,
              onlineCount,
              lastSeen: userData.lastSeen,
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
<<<<<<< HEAD
};

/**
 * Get the Socket.IO server instance
 * @returns {Server} Socket.IO server instance
 * @throws {Error} If Socket.IO is not initialized
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

export default {
  initializeSocket,
  getIO
=======
>>>>>>> 12946fadfcc9c905af2618b001d8e52dcce05e5c
};