import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Check, CheckCheck, Reply, Clock, Wifi, WifiOff } from "lucide-react";
import SocketService from "../utils/socket";
import { getCurrentUser } from "../utils/auth";
import toast from "react-hot-toast";

interface Message {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  messageType?: string;
  replyTo?: string;
  sessionId?: string;
  status?: 'sent' | 'delivered' | 'read';
  deliveredTo?: string[];
  readBy?: string[];
}

interface OnlineUser {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

interface SimpleMatchChatProps {
  matchId: string;
  onMessageCountChange?: (count: number) => void;
}

const SimpleMatchChat: React.FC<SimpleMatchChatProps> = ({ matchId, onMessageCountChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: string }>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<{ [messageId: string]: any }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketService = SocketService.getInstance();
  const currentUser = getCurrentUser();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const hasShownDisconnectToast = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      setConnectionError("Please log in to use chat");
      return;
    }

    if (isInitialized) return; // Prevent multiple initializations

    const initializeChat = async () => {
      try {
        setConnectionError(null);
        hasShownDisconnectToast.current = false;
        
        const socket = socketService.connect();
        
        // Set up event listeners first
        const handleConnect = () => {
          console.log("Socket connected");
          setIsConnected(true);
          setConnectionError(null);
          // Join the match after connection is established
          socketService.joinMatch(matchId);
        };

        const handleDisconnect = (reason: string) => {
          console.log("Socket disconnected:", reason);
          setIsConnected(false);
          
          // Only show disconnect toast once and if it's not a planned disconnect
          if (!hasShownDisconnectToast.current && reason !== 'io client disconnect') {
            hasShownDisconnectToast.current = true;
            toast.error("Connection lost. Trying to reconnect...");
          }
        };

        const handleJoinedMatch = (data: any) => {
          console.log("Joined match:", data);
          setIsInitialized(true);
          setSessionId(data.sessionId || data);
          if (!hasShownDisconnectToast.current) {
            toast.success("Connected to match chat");
          }
        };

        const handleRecentMessages = (recentMessages: Message[]) => {
          // Sort messages by timestamp to ensure proper order (oldest first, latest at bottom)
          const sortedMessages = recentMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
        };

        const handleNewMessage = (message: Message) => {
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg.id === message.id);
            if (messageExists) {
              console.log('Duplicate message prevented:', message.id);
              return prev;
            }
            // Add new message at the end (latest at bottom)
            const newMessages = [...prev, message];
            // Sort to ensure proper chronological order
            return newMessages.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
          
          // Increment unread count if message is from another user and chat is not visible
          if (message.userId !== currentUser?.id && !isVisible) {
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              // Notify parent component about message count change
              onMessageCountChange?.(newCount);
              return newCount;
            });
          }
        };

        const handleUserJoined = (user: any) => {
          setOnlineUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== user.userId);
            return [...filtered, { 
              userId: user.userId, 
              userName: user.userName, 
              status: 'online' 
            }];
          });
          // Reduce notification spam
          if (user.userId !== currentUser.id) {
            toast(`${user.userName} joined`, { icon: "👋", duration: 2000 });
          }
        };

        const handleUserLeft = (user: any) => {
          setOnlineUsers((prev) => 
            prev.map((u) => 
              u.userId === user.userId 
                ? { ...u, status: 'offline' as const, lastSeen: user.lastSeen }
                : u
            )
          );
          // Reduce notification spam
          if (user.userId !== currentUser.id) {
            toast(`${user.userName} left`, { icon: "👋", duration: 2000 });
          }
        };

        const handleOnlineUsers = (users: OnlineUser[]) => {
          setOnlineUsers(users);
        };

        const handleMessageSent = (data: any) => {
          setMessageStatuses(prev => ({
            ...prev,
            [data.messageId]: { ...data, status: 'sent' }
          }));
        };

        const handleMessageDelivered = (data: any) => {
          setMessageStatuses(prev => ({
            ...prev,
            [data.messageId]: { ...prev[data.messageId], status: 'delivered', deliveredTo: data.deliveredTo }
          }));
        };

        const handleMessageReadBy = (data: any) => {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, status: 'read' }
              : msg
          ));
        };

        const handleUserStatusChanged = (data: any) => {
          setOnlineUsers(prev => 
            prev.map(user => 
              user.userId === data.userId 
                ? { ...user, status: data.status, lastSeen: data.lastSeen }
                : user
            )
          );
        };

        const handleParticipantCountUpdated = (data: any) => {
          console.log('Participant count updated:', data);
          // You can emit this to parent components if needed
          // For now, just log it as the parent components will refresh
        };

        const handleUserTyping = ({
          userId,
          userName,
          isTyping: typing,
        }: {
          userId: string;
          userName: string;
          isTyping: boolean;
        }) => {
          if (typing) {
            setIsTyping((prev) => ({ ...prev, [userId]: userName }));
          } else {
            setIsTyping((prev) => {
              const newTyping = { ...prev };
              delete newTyping[userId];
              return newTyping;
            });
          }
        };

        const handleChatNotReady = (message: string) => {
          setConnectionError(message);
        };

        const handleError = (error: string) => {
          console.error("Socket error:", error);
          setConnectionError(error);
        };

        // Remove ALL existing listeners to prevent duplicates
        socket.removeAllListeners();

        // Add event listeners
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("joined-match", handleJoinedMatch);
        socket.on("recent-messages", handleRecentMessages);
        socket.on("new-message", handleNewMessage);
        socket.on("user-joined", handleUserJoined);
        socket.on("user-left", handleUserLeft);
        socket.on("online-users", handleOnlineUsers);
        socket.on("user-typing", handleUserTyping);
        socket.on("user-status-changed", handleUserStatusChanged);
        socket.on("message-sent", handleMessageSent);
        socket.on("message-delivered", handleMessageDelivered);
        socket.on("message-read-by", handleMessageReadBy);
        socket.on("participant-count-updated", handleParticipantCountUpdated);
        socket.on("chat-not-ready", handleChatNotReady);
        socket.on("error", handleError);

        // If already connected, join immediately
        if (socket.connected) {
          handleConnect();
        }

      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setConnectionError("Failed to connect to chat. Please try again.");
        setIsConnected(false);
      }
    };

    initializeChat();

    return () => {
      // Clean up on unmount
      setIsInitialized(false);
      hasShownDisconnectToast.current = false;
    };
  }, [matchId, currentUser, isInitialized, isVisible]);

  useEffect(() => {
    scrollToBottom();
    // Reset unread count when messages change and chat is visible
    if (isVisible) {
      setUnreadCount(0);
      onMessageCountChange?.(0);
    }
  }, [messages, isVisible, onMessageCountChange]);

  // Track visibility for unread count
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      matchId,
      message: newMessage.trim(),
      messageType: 'text',
      replyTo: replyingTo?.id || null
    };

    socketService.getSocket()?.emit('send-message', messageData);
    setNewMessage("");
    setReplyingTo(null);

    // Stop typing indicator
    socketService.sendTyping(matchId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleMessageRead = (messageId: string) => {
    if (socketService.getSocket()) {
      socketService.getSocket()?.emit('message-read', { messageId, matchId });
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.userId !== currentUser?.id) return null;
    
    const status = messageStatuses[message.id]?.status || message.status;
    
    switch (status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typingUsers = Object.values(isTyping);

  if (!currentUser || connectionError) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#FEFFFD] rounded-lg border border-gray-200">
        <div className="text-center p-6">
          <div className="mb-4">
            <WifiOff className="w-12 h-12 text-[#9E8BF9] mx-auto mb-2" />
          </div>
          <p className="text-[#1B263F] mb-4 font-medium">
            {connectionError || "Please log in to access chat"}
          </p>
          {connectionError && connectionError !== "Please log in to access chat" && (
            <button
              type="button"
              onClick={() => {
                setConnectionError(null);
                setIsInitialized(false);
                hasShownDisconnectToast.current = false;
              }}
              className="px-6 py-3 bg-[#204F56] text-[#FEFFFD] rounded-full hover:bg-[#1B263F] transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm font-medium"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#204F56] to-[#1B263F] rounded-t-lg">
        <div className="flex items-center">
          <h3 className="font-semibold text-[#FEFFFD]">Match Chat</h3>
          {messages.length > 0 && (
            <span className="ml-2 bg-[#FEFFFD]/20 text-[#FEFFFD] text-xs rounded-full px-2 py-1 font-medium">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="ml-2 bg-[#E6FD53] text-[#1B263F] text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-[#FEFFFD]" />
            <span className="text-sm text-[#FEFFFD]">
              {onlineUsers.filter(u => u.status === 'online').length} online
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FEFFFD]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.userId === currentUser.id
                  ? "justify-end"
                  : "justify-start"
              }`}
              onDoubleClick={() => handleMessageRead(message.id)}
            >
              <div className="max-w-xs lg:max-w-md group">
                {/* Reply indicator */}
                {message.replyTo && (
                  <div className="mb-1 px-3 py-1 bg-gray-100 rounded-t-lg border-l-4 border-[#9E8BF9]">
                    <p className="text-xs text-gray-600">
                      Replying to: {messages.find(m => m.id === message.replyTo)?.message?.substring(0, 30)}...
                    </p>
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm relative ${
                    message.userId === currentUser.id
                      ? "bg-[#204F56] text-[#FEFFFD] rounded-br-md"
                      : "bg-white text-[#1B263F] border border-gray-200 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className={`flex items-center justify-between mt-2 ${
                    message.userId === currentUser.id ? "text-[#FEFFFD]/70" : "text-gray-500"
                  }`}>
                    <span className="text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getMessageStatusIcon(message)}
                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => handleReply(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Username beneath the message bubble */}
                <p
                  className={`text-xs mt-1 px-2 font-medium ${
                    message.userId === currentUser.id
                      ? "text-right text-[#204F56]"
                      : "text-left text-[#9E8BF9]"
                  }`}
                >
                  {message.userId === currentUser.id ? "You" : (message.userName || "Unknown User")}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#9E8BF9] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#9E8BF9] rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-[#9E8BF9] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <p className="text-xs text-gray-500">
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#9E8BF9]/10 border-t border-[#9E8BF9]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-[#9E8BF9]" />
              <div>
                <p className="text-xs text-[#9E8BF9] font-medium">
                  Replying to {replyingTo.userName}
                </p>
                <p className="text-xs text-gray-600 truncate max-w-xs">
                  {replyingTo.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#204F56] focus:border-transparent disabled:bg-gray-100 text-[#1B263F]"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-3 bg-[#204F56] text-[#FEFFFD] rounded-full hover:bg-[#1B263F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleMatchChat;
