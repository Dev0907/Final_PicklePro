import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Users, 
  X, 
  AlertCircle,
  Loader2,
  UserCheck
} from 'lucide-react';
import SocketService from '../utils/socket';
import { getToken, getCurrentUser } from '../utils/auth';

interface Message {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface MatchChatProps {
  matchId: string;
  onClose: () => void;
}

export const MatchChat: React.FC<MatchChatProps> = ({ matchId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chatAvailable, setChatAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketService = SocketService.getInstance();
  const currentUser = getCurrentUser();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeChat();
    return () => {
      cleanup();
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if chat is available
      const response = await fetch(`http://localhost:5000/api/chat/match/${matchId}/chat-status`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check chat status');
        setLoading(false);
        return;
      }

      const { chatAvailable: available } = await response.json();
      setChatAvailable(available);

      if (!available) {
        setError('Chat will be available when player requirements are met');
        setLoading(false);
        return;
      }

      // Fetch participants
      await fetchParticipants();

      // Connect to socket
      const socket = socketService.connect();
      setupSocketListeners(socket);
      socketService.joinMatch(matchId);

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/match/${matchId}/participants`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { participants } = await response.json();
        setParticipants(participants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const setupSocketListeners = (socket: any) => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('joined-match', () => {
      setIsConnected(true);
    });

    socket.on('recent-messages', (recentMessages: Message[]) => {
      setMessages(recentMessages);
    });

    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-typing', ({ userName, isTyping }: { userName: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter(user => user !== userName);
        }
      });
    });

    socket.on('chat-not-ready', (message: string) => {
      setError(message);
      setChatAvailable(false);
    });

    socket.on('error', (error: string) => {
      setError(error);
    });
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.disconnect();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected || sending) return;

    setSending(true);
    socketService.sendMessage(matchId, newMessage.trim());
    setNewMessage('');
    
    // Stop typing indicator
    socketService.sendTyping(matchId, false);
    
    setTimeout(() => setSending(false), 500);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isConnected) return;

    // Send typing indicator
    socketService.sendTyping(matchId, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(matchId, false);
    }, 2000);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-ocean-teal" />
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !chatAvailable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Chat Not Available</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="bg-ocean-teal text-white px-6 py-2 rounded-lg hover:bg-ocean-teal/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-ocean-teal mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-deep-navy">Match Chat</h3>
              <div className="flex items-center text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {participants.length} participants
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.userId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.userId === currentUser?.id
                          ? 'bg-ocean-teal text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.userId !== currentUser?.id && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.userName}
                        </p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.userId === currentUser?.id ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  disabled={!isConnected || sending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected || sending}
                  className="px-4 py-2 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Participants Sidebar */}
          <div className="w-64 border-l border-gray-200 bg-gray-50">
            <div className="p-4">
              <h4 className="font-semibold text-deep-navy mb-4 flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Participants ({participants.length})
              </h4>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center p-2 bg-white rounded-lg"
                  >
                    <div className="w-8 h-8 bg-ocean-teal rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {participant.name}
                        {participant.id === currentUser?.id && (
                          <span className="text-xs text-gray-500 ml-1">(You)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};