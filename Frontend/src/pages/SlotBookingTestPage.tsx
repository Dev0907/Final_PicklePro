import React, { useState } from 'react';
import { SlotBookingTest } from '../components/SlotBookingTest';
import { PlayerSlotGrid } from '../components/PlayerSlotGrid';

export const SlotBookingTestPage: React.FC = () => {
  const [courtId, setCourtId] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'test' | 'grid'>('test');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Slot Booking Test</h1>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('test')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'test'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Simple Test View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Player Grid View
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md">
          {activeTab === 'test' ? (
            <SlotBookingTest courtId={courtId} date={date} />
          ) : (
            <PlayerSlotGrid 
              courtId={courtId} 
              date={date} 
              onSlotBooked={() => {
                console.log('Slot booked successfully!');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};