import React, { useState } from 'react';
import { SlotHighlightTest } from '../components/SlotHighlightTest';
import { PlayerSlotGrid } from '../components/PlayerSlotGrid';

export const SlotHighlightTestPage: React.FC = () => {
  const [courtId, setCourtId] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Slot Highlighting Test</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">Test Instructions:</h2>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Use Court ID: <strong>1</strong> and today's date to see test bookings</li>
            <li>2. Slots at 10:00, 14:00, and 18:00 should be <strong className="text-red-600">RED</strong> (booked by others)</li>
            <li>3. Other slots should be <strong className="text-green-600">WHITE/GREEN</strong> (available)</li>
            <li>4. Try clicking on red slots - they should show an alert and NOT be selectable</li>
            <li>5. Try clicking on green slots - they should be selectable (turn blue)</li>
          </ol>
        </div>
        
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Simple Highlight Test */}
        <div className="mb-8">
          <SlotHighlightTest courtId={courtId} date={date} />
        </div>

        {/* Full Player Grid */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Full Player Slot Grid</h2>
            <p className="text-gray-600">This is the actual component players use to book slots</p>
          </div>
          <PlayerSlotGrid 
            courtId={courtId} 
            date={date} 
            onSlotBooked={() => {
              console.log('Slot booked successfully!');
            }}
          />
        </div>

        {/* Visual Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Visual Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Available Slot Example */}
            <div className="text-center">
              <div className="bg-white border-2 border-green-300 text-green-700 p-3 rounded-lg mb-2 cursor-pointer hover:bg-green-50">
                <div className="text-sm font-medium">10:00 AM</div>
                <div className="text-xs font-medium">Available</div>
                <div className="text-xs text-gray-600">₹500</div>
              </div>
              <p className="text-sm text-green-700 font-medium">✅ Available - Can Click</p>
            </div>

            {/* Booked Slot Example */}
            <div className="text-center">
              <div className="bg-red-200 border-2 border-red-500 text-red-900 p-3 rounded-lg mb-2 cursor-not-allowed relative">
                <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-red-800 font-bold text-xs transform rotate-12">BOOKED</span>
                </div>
                <div className="text-sm font-medium">2:00 PM</div>
                <div className="text-xs font-medium">Booked by Others</div>
                <div className="text-xs text-red-700 font-semibold">₹500</div>
              </div>
              <p className="text-sm text-red-700 font-medium">🔴 Booked - Cannot Click</p>
            </div>

            {/* My Booking Example */}
            <div className="text-center">
              <div className="bg-green-100 border-2 border-green-500 text-green-800 p-3 rounded-lg mb-2 font-semibold">
                <div className="text-sm font-medium">6:00 PM</div>
                <div className="text-xs font-medium">My Booking</div>
                <div className="text-xs text-gray-600">₹500</div>
              </div>
              <p className="text-sm text-green-700 font-medium">🟢 Your Booking</p>
            </div>

            {/* Selected Slot Example */}
            <div className="text-center">
              <div className="bg-blue-100 border-2 border-blue-500 text-blue-800 p-3 rounded-lg mb-2 shadow-lg font-semibold transform scale-105">
                <div className="text-sm font-medium">8:00 PM</div>
                <div className="text-xs font-medium">Selected</div>
                <div className="text-xs text-gray-600">₹500</div>
              </div>
              <p className="text-sm text-blue-700 font-medium">🔵 Selected for Booking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};