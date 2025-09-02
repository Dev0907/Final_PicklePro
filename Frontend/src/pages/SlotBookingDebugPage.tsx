import React, { useState } from 'react';
import { SlotStatusDebug } from '../components/SlotStatusDebug';
import { PlayerSlotGrid } from '../components/PlayerSlotGrid';

export const SlotBookingDebugPage: React.FC = () => {
  const [courtId, setCourtId] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Slot Booking Debug & Test</h1>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Court ID
              </label>
              <input
                type="number"
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Debug View */}
        <div className="mb-8">
          <SlotStatusDebug courtId={courtId} date={date} />
        </div>

        {/* Actual Player Grid */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Player Slot Grid (Actual Component)</h2>
            <p className="text-gray-600">This is how players see the slot booking interface</p>
          </div>
          <PlayerSlotGrid 
            courtId={courtId} 
            date={date} 
            onSlotBooked={() => {
              console.log('Slot booked successfully!');
            }}
          />
        </div>
      </div>
    </div>
  );
};