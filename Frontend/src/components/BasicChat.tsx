import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { getCurrentUser, getToken } from '../utils/auth';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface BasicChatProps {
  matchId: string;
  onClose?: () => void;
}

const BasicChat: React.FC<BasicChatProps> = ({ matchId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const currentUser = getCurrentUser();
  const token = getToken();

  useEffect(() => {
    if (!currentUser || !token) {
      toast.error('Please log in to use chat');
      setLoading(false);
      return;
    }

    initializeChat();

    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch {}
    };
  }, [matchId, currentUser, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Try to connect to socket
      const { io } = await import('socket.io-client');
      const socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to socket');
        setIsConnected(true);
        socket.emit('join-match', matchId);
      });

      socket.on('joined-match', (payload: any) => {
        const joined = typeof payload === 'string' ? payload : payload?.matchId;
        console.log('Joined match:', joined);
        toast.success('Connected to chat');
      });

      socket.on('recent-messages', (recentMessages: Message[]) => {
        console.log('Received recent messages:', recentMessages);
        setMessages(recentMessages);
      });

      socket.on('new-message', (message: Message) => {
        console.log('New message:', message);
        setMessages(prev => [...prev, message]);
      });

      socket.on('error', (error: string) => {
        console.error('Socket error:', error);
        toast.error(`Chat error: ${error}`);
      });

      socket.on('chat-not-ready', (message: string) => {
        console.log('Chat not ready:', message);
        toast.error(message);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket');
        setIsConnected(false);
        toast.error('Disconnected from chat');
      });

      socket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        toast.error('Failed to connect to chat');
        setIsConnected(false);
      });

      // Cleanup handled by useEffect return

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Failed to initialize chat');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    // Create a temporary message for immediate feedback
    const tempMessage: Message = {
      id: Date.now().toString(),
      matchId,
      userId: currentUser!.id,
      userName: currentUser!.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add to messages immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Send via socket to backend
    try {
      socketRef.current?.emit('send-message', { matchId, message: newMessage.trim(), messageType: 'text' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Please log in to access chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-semibold text-gray-800">Match Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No messages yet. Start the conversation!</p>
            <p className="text-sm mt-2">Match ID: {matchId}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = String(message.userId) === String(currentUser.id);
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isMine
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.userName}
                    </p>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    isMine ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicChat;