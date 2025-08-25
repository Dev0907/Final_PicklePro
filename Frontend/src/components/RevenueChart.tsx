import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getToken } from '../utils/auth';

interface RevenueData {
  daily_revenue: Array<{
    date: string;
    revenue: number;
    bookings: number;
    court_name: string;
    sport_type: string;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
}

interface RevenueChartProps {
  facilityId: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ facilityId }) => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const fetchRevenueData = useCallback(async () => {
    if (!facilityId) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/bookings/facility/${facilityId}/revenue?period=30`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRevenueData(data.revenue);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount.toString()) || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal"></div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No revenue data available</p>
      </div>
    );
  }

  const currentData = viewMode === 'daily' ? revenueData.daily_revenue : revenueData.monthly_revenue;
  const maxRevenue = Math.max(...currentData.map(d => parseFloat(d.revenue.toString()) || 0));

  // Calculate trend
  const recentRevenue = currentData.slice(-7).reduce((sum, d) => sum + (parseFloat(d.revenue.toString()) || 0), 0);
  const previousRevenue = currentData.slice(-14, -7).reduce((sum, d) => sum + (parseFloat(d.revenue.toString()) || 0), 0);
  const trendPercentage = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'daily'
                ? 'bg-[#204F56] text-[#FEFFFD]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'monthly'
                ? 'bg-[#204F56] text-[#FEFFFD]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {trendPercentage >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trendPercentage).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-full space-x-1">
          {currentData.slice(-10).map((item, index) => {
            const revenue = parseFloat(item.revenue.toString()) || 0;
            const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#204F56] to-[#E6FD53] rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ height: `${height}%`, minHeight: revenue > 0 ? '4px' : '0px' }}
                  title={`${viewMode === 'daily' ? formatDate(item.date) : formatMonth(item.month)}: ${formatCurrency(revenue)}`}
                />
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {viewMode === 'daily' ? formatDate(item.date) : formatMonth(item.month)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Total Revenue</div>
          <div className="text-lg font-semibold text-[#1B263F]">
            {formatCurrency(currentData.reduce((sum, d) => sum + (parseFloat(d.revenue.toString()) || 0), 0))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Average {viewMode === 'daily' ? 'Daily' : 'Monthly'}</div>
          <div className="text-lg font-semibold text-[#1B263F]">
            {formatCurrency(currentData.reduce((sum, d) => sum + (parseFloat(d.revenue.toString()) || 0), 0) / currentData.length)}
          </div>
        </div>
      </div>
    </div>
  );
};