import React, { useState } from 'react';
import { PlayerSlotGrid } from '../components/PlayerSlotGrid';

const SlotBookingDemo: React.FC = () => {
  const [selectedCourt, setSelectedCourt] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-[#FFFFF7] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#1E1F26] mb-4">
            🏓 Pickleball Slot Booking Demo
          </h1>
          <p className="text-[#1E1F26] opacity-75 mb-6">
            This demo shows how players can view and book available slots, and how owners can manage slot availability.
          </p>
          
          {/* Demo Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E1F26] mb-2">
                Select Court:
              </label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full px-3 py-2 border border-[#C4C4C4] rounded-lg text-[#1E1F26] focus:outline-none focus:ring-2 focus:ring-[#EFFF4F]"
              >
                <option value="1">Court 1 (Pickleball)</option>
                <option value="2">Court 2 (Pickleball)</option>
                <option value="3">Court 3 (Tennis)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1E1F26] mb-2">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-[#C4C4C4] rounded-lg text-[#1E1F26] focus:outline-none focus:ring-2 focus:ring-[#EFFF4F]"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#F0F7B1]/30 border border-[#F0F7B1] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#1E1F26] mb-3">📋 How to Use This Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#1E1F26]">
            <div>
              <h3 className="font-semibold mb-2">For Players:</h3>
              <ul className="space-y-1">
                <li>• <strong>Light Olive slots</strong> are available to book</li>
                <li>• <strong>Red slots</strong> are booked by other players</li>
                <li>• <strong>Grey slots</strong> are under maintenance</li>
                <li>• <strong>Dark Green slots</strong> are your own bookings</li>
                <li>• Click on available slots to select them</li>
                <li>• Use the "Book Slots" button to confirm your selection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">For Owners:</h3>
              <ul className="space-y-1">
                <li>• Use the Owner Slot Management page</li>
                <li>• Block slots for maintenance</li>
                <li>• Unblock slots to make them available</li>
                <li>• Set maintenance reasons for blocked slots</li>
                <li>• Real-time updates for all users</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#1E1F26] mb-4">
            Available Slots for Court {selectedCourt} on {new Date(selectedDate).toLocaleDateString()}
          </h2>
          
          <PlayerSlotGrid
            courtId={selectedCourt}
            date={selectedDate}
            onSlotBooked={() => {
              console.log('Slot booked successfully!');
              // You could add a success message here
            }}
          />
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-[#1E1F26] mb-2">Smart Slot Management</h3>
            <p className="text-sm text-[#1E1F26] opacity-75">
              Automatic slot generation based on court operating hours. No need to manually create slots every day.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-[#1E1F26] mb-2">Conflict Prevention</h3>
            <p className="text-sm text-[#1E1F26] opacity-75">
              Real-time availability checking prevents double booking. Players see immediate updates when slots are taken.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-[#1E1F26] mb-2">Owner Controls</h3>
            <p className="text-sm text-[#1E1F26] opacity-75">
              Easy maintenance scheduling and slot blocking. Owners can manage availability with simple clicks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotBookingDemo;