import React, { useState, useEffect } from 'react';
import { getCurrentUser, getToken } from '../utils/auth';
import toast from 'react-hot-toast';

interface DebugChatProps {
  matchId: string;
}

const DebugChat: React.FC<DebugChatProps> = ({ matchId }) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not started');

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testConnection = async () => {
    setDebugInfo([]);
    addDebugInfo('Starting connection test...');

    // Check user authentication
    const currentUser = getCurrentUser();
    const token = getToken();
    
    addDebugInfo(`Current user: ${currentUser ? JSON.stringify(currentUser) : 'null'}`);
    addDebugInfo(`Token exists: ${token ? 'Yes' : 'No'}`);
    addDebugInfo(`Token preview: ${token ? token.substring(0, 20) + '...' : 'null'}`);

    if (!currentUser || !token) {
      addDebugInfo('❌ Authentication failed - missing user or token');
      setConnectionStatus('Authentication failed');
      return;
    }

    // Test backend connection
    try {
      addDebugInfo('Testing backend connection...');
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`✅ Backend connected: ${data.message}`);
      } else {
        addDebugInfo(`❌ Backend responded with status: ${response.status}`);
        setConnectionStatus('Backend connection failed');
        return;
      }
    } catch (error) {
      addDebugInfo(`❌ Backend connection failed: ${error}`);
      setConnectionStatus('Backend unreachable');
      return;
    }

    // Test socket connection
    try {
      addDebugInfo('Attempting socket connection...');
      setConnectionStatus('Connecting...');

      // Dynamic import to avoid build issues
      const { io } = await import('socket.io-client');
      
      const socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        addDebugInfo('✅ Socket connected successfully');
        setConnectionStatus('Connected');
        
        // Try to join match
        addDebugInfo(`Attempting to join match: ${matchId}`);
        socket.emit('join-match', matchId);
      });

      socket.on('joined-match', (joinedMatchId: string) => {
        addDebugInfo(`✅ Successfully joined match: ${joinedMatchId}`);
        setConnectionStatus('Joined match');
      });

      socket.on('chat-not-ready', (message: string) => {
        addDebugInfo(`⚠️ Chat not ready: ${message}`);
        setConnectionStatus('Chat not ready');
      });

      socket.on('error', (error: string) => {
        addDebugInfo(`❌ Socket error: ${error}`);
        setConnectionStatus('Socket error');
      });

      socket.on('connect_error', (error: any) => {
        addDebugInfo(`❌ Connection error: ${error.message}`);
        setConnectionStatus('Connection error');
      });

      socket.on('disconnect', (reason: string) => {
        addDebugInfo(`🔌 Disconnected: ${reason}`);
        setConnectionStatus('Disconnected');
      });

      // Cleanup after 10 seconds
      setTimeout(() => {
        socket.disconnect();
        addDebugInfo('Test completed - socket disconnected');
      }, 10000);

    } catch (error) {
      addDebugInfo(`❌ Socket initialization failed: ${error}`);
      setConnectionStatus('Socket initialization failed');
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Chat Debug Tool</h3>
        <p className="text-sm text-gray-600 mb-2">Match ID: {matchId}</p>
        <p className="text-sm mb-4">Status: <span className="font-mono">{connectionStatus}</span></p>
        
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Connection
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto">
        {debugInfo.length === 0 ? (
          <p>Click "Test Connection" to start debugging...</p>
        ) : (
          debugInfo.map((info, index) => (
            <div key={index}>{info}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugChat;