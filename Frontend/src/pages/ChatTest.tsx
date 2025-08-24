import React, { useState } from "react";
import SimpleMatchChat from "../components/SimpleMatchChat";
import { getCurrentUser } from "../utils/auth";
import { MessageCircle, Users, Wifi, CheckCheck } from 'lucide-react';

const ChatTest: React.FC = () => {
  const [testMatchId, setTestMatchId] = useState("1");
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FEFFFD] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <MessageCircle className="w-16 h-16 text-[#9E8BF9] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1B263F] mb-4">Chat Test</h1>
          <p className="text-[#204F56]">Please log in to test the enhanced chat functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFFFD] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B263F] mb-2">
            Enhanced Chat Test
          </h1>
          <p className="text-[#204F56]">WhatsApp-like chat with real-time features</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-[#1B263F] flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#9E8BF9]" />
            Test Configuration
          </h2>
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="matchId" className="font-medium text-[#204F56]">Match ID:</label>
              <input
                id="matchId"
                type="text"
                value={testMatchId}
                onChange={(e) => setTestMatchId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#204F56] focus:border-transparent"
                placeholder="Enter match ID"
              />
            </div>
            <div className="flex items-center space-x-2 bg-[#9E8BF9]/10 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-[#1B263F] font-medium">
                {currentUser.fullname || currentUser.name}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-[#1B263F] flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-[#204F56]" />
            Live Chat Test
          </h2>
          <SimpleMatchChat matchId={testMatchId} />
        </div>

        <div className="mt-6 bg-gradient-to-r from-[#9E8BF9]/10 to-[#204F56]/10 border border-[#9E8BF9]/20 rounded-2xl p-6">
          <h3 className="font-semibold text-[#1B263F] mb-4 flex items-center">
            <CheckCheck className="w-5 h-5 mr-2 text-[#204F56]" />
            Enhanced Features to Test:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-[#204F56]">Real-time Features:</h4>
              <ul className="text-[#1B263F] text-sm space-y-1 ml-4">
                <li>• Message delivery status (sent/delivered/read)</li>
                <li>• Typing indicators with animation</li>
                <li>• Online/offline user status</li>
                <li>• Real-time participant count</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-[#204F56]">WhatsApp-like UI:</h4>
              <ul className="text-[#1B263F] text-sm space-y-1 ml-4">
                <li>• Message replies and threading</li>
                <li>• Enhanced message bubbles</li>
                <li>• Connection status indicators</li>
                <li>• Smooth animations and transitions</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#E6FD53]/20 rounded-xl border border-[#E6FD53]/30">
            <p className="text-sm text-[#1B263F]">
              <strong>Pro Tip:</strong> Open multiple browser tabs with different users to test multi-user chat functionality!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTest;
