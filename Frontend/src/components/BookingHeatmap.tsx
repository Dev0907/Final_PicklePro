import React, { useEffect, useState, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { getToken } from '../utils/auth';

interface HeatmapData {
  day: string;
  day_index: number;
  hours: Array<{
    hour: number;
    time: string;
    booking_count: number;
    revenue: number;
  }>;
}

interface BookingHeatmapProps {
  facilityId: string;
}

export const BookingHeatmap: React.FC<BookingHeatmapProps> = ({ facilityId }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bookings' | 'revenue'>('bookings');

  const fetchHeatmapData = useCallback(async () => {
    if (!facilityId) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/bookings/facility/${facilityId}/heatmap?period=30`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data.heatmap);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const getIntensityColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'bg-gray-100';
    
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-gray-100';
    if (intensity <= 0.2) return 'bg-green-200';
    if (intensity <= 0.4) return 'bg-green-300';
    if (intensity <= 0.6) return 'bg-green-400';
    if (intensity <= 0.8) return 'bg-green-500';
    return 'bg-green-600';
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${period}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal"></div>
      </div>
    );
  }

  if (!heatmapData.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No booking data available</p>
      </div>
    );
  }

  const allValues = heatmapData.flatMap(day => 
    day.hours.map(hour => viewMode === 'bookings' ? hour.booking_count : hour.revenue)
  );
  const maxValue = Math.max(...allValues);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setViewMode('bookings')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'bookings'
                ? 'bg-ocean-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bookings
          </button>
          <button
            type="button"
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'revenue'
                ? 'bg-ocean-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Revenue
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Last 30 days
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Hour headers */}
          <div className="flex mb-2">
            <div className="w-20 flex-shrink-0"></div>
            {heatmapData[0]?.hours.map((hour) => (
              <div key={hour.hour} className="w-8 text-xs text-center text-gray-600">
                {formatTime(hour.hour)}
              </div>
            ))}
          </div>

          {/* Days and data */}
          {heatmapData.map((dayData) => (
            <div key={dayData.day_index} className="flex items-center mb-1">
              <div className="w-20 flex-shrink-0 text-sm text-gray-700 pr-2">
                {dayData.day.slice(0, 3)}
              </div>
              {dayData.hours.map((hourData) => {
                const value = viewMode === 'bookings' ? hourData.booking_count : hourData.revenue;
                return (
                  <div
                    key={hourData.hour}
                    className={`w-8 h-8 mx-0.5 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${getIntensityColor(value, maxValue)}`}
                    title={`${dayData.day} ${hourData.time}: ${
                      viewMode === 'bookings' 
                        ? `${value} booking${value !== 1 ? 's' : ''}` 
                        : formatCurrency(value)
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
          </div>
          <span className="text-gray-600">More</span>
        </div>
        
        <div className="text-gray-600">
          Peak: {viewMode === 'bookings' ? `${maxValue} bookings` : formatCurrency(maxValue)}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-deep-navy mb-2">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Peak Hours:</span>
            <span className="ml-2 font-medium">6 PM - 9 PM</span>
          </div>
          <div>
            <span className="text-gray-600">Busiest Days:</span>
            <span className="ml-2 font-medium">Weekends</span>
          </div>
        </div>
      </div>
    </div>
  );
};