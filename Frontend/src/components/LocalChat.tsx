import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface LocalChatProps {
  matchId: string;
  onClose?: () => void;
}

const LocalChat: React.FC<LocalChatProps> = ({ matchId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Load messages from localStorage
    const savedMessages = localStorage.getItem(`chat_${matchId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage
    localStorage.setItem(`chat_${matchId}`, JSON.stringify(messages));
  }, [messages, matchId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const message: Message = {
      id: Date.now().toString(),
      matchId,
      userId: currentUser.id,
      userName: currentUser.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    toast.success('Message sent (local storage)');
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

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat_${matchId}`);
    toast.success('Chat cleared');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Please log in to access chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="font-semibold text-gray-800">Local Chat (Demo)</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
            title="Clear chat"
          >
            Clear
          </button>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500">Local Storage</span>
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
            <p className="text-xs mt-1 text-green-600">This is a demo using local storage</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.userId === currentUser.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.userId !== currentUser.id && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {message.userName}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.userId === currentUser.id ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
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
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocalChat;