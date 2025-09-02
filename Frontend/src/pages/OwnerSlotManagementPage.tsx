import React, { useState } from 'react';
import { OwnerSlotManager } from '../components/OwnerSlotManager';
import { PlayerSlotGrid } from '../components/PlayerSlotGrid';

export const OwnerSlotManagementPage: React.FC = () => {
  const [courtId, setCourtId] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState<'owner' | 'player'>('owner');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Slot Availability Management</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={activeView}
                onChange={(e) => setActiveView(e.target.value as 'owner' | 'player')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="owner">Owner Management View</option>
                <option value="player">Player Booking View</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveView('owner')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeView === 'owner'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👨‍💼 Owner Management
            </button>
            <button
              type="button"
              onClick={() => setActiveView('player')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeView === 'player'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎾 Player View
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">
            {activeView === 'owner' ? 'Owner Instructions:' : 'Player View:'}
          </h2>
          {activeView === 'owner' ? (
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. <strong>Click on green slots</strong> to block them (make unavailable to players)</li>
              <li>2. <strong>Click on yellow slots</strong> to unblock them (make available to players)</li>
              <li>3. <strong>Red slots are booked</strong> by players and cannot be modified</li>
              <li>4. <strong>Blue dots</strong> indicate unsaved changes</li>
              <li>5. <strong>Click "Save Changes"</strong> to apply your modifications</li>
              <li>6. <strong>Switch to Player View</strong> to see how players will see the slots</li>
            </ul>
          ) : (
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This is how <strong>players see the slots</strong> after owner modifications</li>
              <li>• <strong>Yellow slots (blocked by owner)</strong> cannot be booked by players</li>
              <li>• <strong>Green slots</strong> are available for booking</li>
              <li>• <strong>Red slots</strong> are already booked by other players</li>
              <li>• Players will see "Maintenance" or "Unavailable" for owner-blocked slots</li>
            </ul>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md">
          {activeView === 'owner' ? (
            <OwnerSlotManager 
              courtId={courtId}
              courtName="Court A1"
              facilityName="Demo Facility"
            />
          ) : (
            <div className="p-4">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold">Player Booking View</h2>
                <p className="text-gray-600">This is how players see the slot availability after owner modifications</p>
              </div>
              <PlayerSlotGrid 
                courtId={courtId} 
                date={date} 
                onSlotBooked={() => {
                  console.log('Slot booked successfully!');
                }}
              />
            </div>
          )}
        </div>

        {/* Workflow Example */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Example Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Owner Actions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">👨‍💼 Owner Actions</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <div className="font-medium">Block slots for maintenance</div>
                    <div className="text-sm text-gray-600">Click green slots to make them yellow (blocked)</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <div className="font-medium">Save changes</div>
                    <div className="text-sm text-gray-600">Click "Save Changes" to apply modifications</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <div className="font-medium">Verify player view</div>
                    <div className="text-sm text-gray-600">Switch to Player View to confirm changes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Experience */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">🎾 Player Experience</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                  <div>
                    <div className="font-medium">See updated availability</div>
                    <div className="text-sm text-gray-600">Blocked slots appear as "Maintenance" or "Unavailable"</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">✗</div>
                  <div>
                    <div className="font-medium">Cannot book blocked slots</div>
                    <div className="text-sm text-gray-600">Clicking shows "This slot is not available for booking"</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">i</div>
                  <div>
                    <div className="font-medium">Real-time updates</div>
                    <div className="text-sm text-gray-600">Changes reflect immediately after owner saves</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};