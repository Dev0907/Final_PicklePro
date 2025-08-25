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

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<{ [messageId: string]: any }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketService = SocketService.getInstance();
  const currentUser = getCurrentUser();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const hasShownDisconnectToast = useRef(false);
  const onMessageCountChangeRef = useRef(onMessageCountChange);

  // Update ref when callback changes
  useEffect(() => {
    onMessageCountChangeRef.current = onMessageCountChange;
  }, [onMessageCountChange]);

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
          if (!hasShownDisconnectToast.current) {
            toast.success("Connected to match chat");
          }
        };

        const handleRecentMessages = (recentMessages: Message[]) => {
          console.log('Received recent messages:', recentMessages);
          // Sort messages by timestamp to ensure proper order (oldest first, latest at bottom)
          const sortedMessages = recentMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
        };

        const handleNewMessage = (message: Message) => {
          console.log('Received new message:', message);
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg.id === message.id);
            if (messageExists) {
              console.log('Duplicate message prevented:', message.id);
              return prev;
            }
            // Simply append new message at the end (no sorting to prevent wobbling)
            const newMessages = [...prev, message];
            console.log('Updated messages array:', newMessages.length);
            return newMessages;
          });
          
          // Increment unread count if message is from another user and chat is not visible
          if (message.userId !== currentUser?.id?.toString() && !isVisible) {
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              // Notify parent component about message count change
              onMessageCountChangeRef.current?.(newCount);
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
  }, [matchId, currentUser]);

  useEffect(() => {
    // Only scroll to bottom for new messages, not when messages are reordered
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length]); // Only depend on message count, not the entire messages array

  // Separate effect for handling visibility changes and unread count
  useEffect(() => {
    if (isVisible && unreadCount > 0) {
      setUnreadCount(0);
      onMessageCountChangeRef.current?.(0);
    }
  }, [isVisible, unreadCount]);

  // Track visibility for unread count
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
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
    if (message.userId !== currentUser?.id?.toString() && message.userId !== currentUser?.id) return null;
    
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
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-[#FEFFFD] to-[#E6FD53]/10 rounded-xl border-2 border-[#E6FD53]/30 shadow-lg">
        <div className="text-center p-8">
          <div className="mb-6">
            <div className="bg-[#E6FD53]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-[#204F56]" />
            </div>
          </div>
          <p className="text-[#1B263F] mb-6 font-semibold text-lg">
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
              className="px-8 py-3 bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] rounded-full hover:from-[#1B263F] hover:to-[#204F56] transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm font-semibold shadow-lg hover:shadow-xl"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-[#FEFFFD] rounded-xl shadow-xl border border-[#204F56]/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#204F56] to-[#1B263F] shadow-lg">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FEFFFD] to-[#FEFFFD]/95 scroll-smooth">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[#E6FD53]/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-[#204F56]" />
            </div>
            <p className="text-[#1B263F]/70 font-medium">No messages yet</p>
            <p className="text-[#1B263F]/50 text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.userId === currentUser.id?.toString() || message.userId === currentUser.id
                  ? "justify-end"
                  : "justify-start"
              }`}
              onDoubleClick={() => handleMessageRead(message.id)}
            >
              <div className="max-w-xs lg:max-w-md group">
                {/* Reply indicator */}
                {message.replyTo && (
                  <div className="mb-1 px-3 py-1 bg-[#E6FD53]/20 rounded-t-lg border-l-4 border-[#204F56]">
                    <p className="text-xs text-[#1B263F]/70 font-medium">
                      Replying to: {messages.find(m => m.id === message.replyTo)?.message?.substring(0, 30)}...
                    </p>
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg relative transition-all duration-200 hover:shadow-xl ${
                    message.userId === currentUser.id?.toString() || message.userId === currentUser.id
                      ? "bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] rounded-br-md border border-[#204F56]/30"
                      : "bg-[#FEFFFD] text-[#1B263F] border-2 border-[#E6FD53]/50 rounded-bl-md shadow-[#E6FD53]/20"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className={`flex items-center justify-between mt-2 ${
                    message.userId === currentUser.id?.toString() || message.userId === currentUser.id ? "text-[#FEFFFD]/70" : "text-gray-500"
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
                  className={`text-xs mt-1 px-2 font-semibold ${
                    message.userId === currentUser.id?.toString() || message.userId === currentUser.id
                      ? "text-right text-[#204F56]"
                      : "text-left text-[#1B263F]/70"
                  }`}
                >
                  {message.userId === currentUser.id?.toString() || message.userId === currentUser.id ? "You" : (message.userName || "Unknown User")}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-[#E6FD53]/30 border-2 border-[#E6FD53]/50 px-4 py-2 rounded-2xl rounded-bl-md shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#204F56] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#204F56] rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-[#204F56] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <p className="text-xs text-[#1B263F] font-medium">
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
        <div className="px-4 py-3 bg-gradient-to-r from-[#E6FD53]/20 to-[#E6FD53]/10 border-t-2 border-[#E6FD53]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-[#204F56]" />
              <div>
                <p className="text-xs text-[#204F56] font-semibold">
                  Replying to {replyingTo.userName}
                </p>
                <p className="text-xs text-[#1B263F]/70 truncate max-w-xs">
                  {replyingTo.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-[#1B263F]/50 hover:text-[#1B263F] p-1 rounded-full hover:bg-[#E6FD53]/30 transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-[#E6FD53]/30 bg-gradient-to-r from-[#FEFFFD] to-[#E6FD53]/5">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 border-2 border-[#E6FD53]/40 rounded-full focus:outline-none focus:ring-2 focus:ring-[#204F56] focus:border-[#204F56] disabled:bg-gray-100 text-[#1B263F] bg-[#FEFFFD] placeholder-[#1B263F]/50 shadow-inner"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-3 bg-gradient-to-r from-[#204F56] to-[#1B263F] text-[#FEFFFD] rounded-full hover:from-[#1B263F] hover:to-[#204F56] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
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
