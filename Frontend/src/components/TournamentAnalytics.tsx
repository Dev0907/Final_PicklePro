import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Calendar, Users } from 'lucide-react';
import { getToken } from '../utils/auth';

interface AnalyticsData {
  monthly_data: Array<{
    month: string;
    tournaments: number;
    registrations: number;
    revenue: number;
  }>;
  registration_trends: Array<{
    tournament_name: string;
    registration_count: number;
    max_teams: number;
    fill_rate: number;
  }>;
  revenue_breakdown: Array<{
    tournament_name: string;
    revenue: number;
    registrations: number;
  }>;
}

export const TournamentAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'revenue' | 'registrations'>('revenue');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/tournaments/owner/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching tournament analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-teal"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const currentData = viewMode === 'revenue' 
    ? analyticsData.monthly_data.map(d => ({ ...d, value: d.revenue }))
    : analyticsData.monthly_data.map(d => ({ ...d, value: d.registrations }));

  const maxValue = Math.max(...currentData.map(d => d.value));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-deep-navy flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Tournament Analytics
        </h2>
        
        <div className="flex space-x-2">
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
          <button
            type="button"
            onClick={() => setViewMode('registrations')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'registrations'
                ? 'bg-ocean-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Registrations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends Chart */}
        <div>
          <h3 className="text-lg font-medium text-deep-navy mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Monthly Trends
          </h3>
          
          <div className="relative h-64 bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-full space-x-2">
              {currentData.slice(-6).map((item, index) => {
                const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-ocean-teal to-sky-400 rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
                      style={{ height: `${height}%`, minHeight: item.value > 0 ? '4px' : '0px' }}
                      title={`${formatMonth(item.month)}: ${
                        viewMode === 'revenue' 
                          ? formatCurrency(item.value) 
                          : `${item.value} registrations`
                      }`}
                    />
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      {formatMonth(item.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tournament Performance */}
        <div>
          <h3 className="text-lg font-medium text-deep-navy mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Tournament Performance
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.registration_trends.slice(0, 8).map((tournament, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-deep-navy truncate">
                    {tournament.tournament_name}
                  </h4>
                  <div className="flex items-center mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-ocean-teal h-2 rounded-full transition-all duration-300"
                        style={{ width: `${tournament.fill_rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {tournament.registration_count}/{tournament.max_teams}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-deep-navy">
                    {tournament.fill_rate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Fill Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      {viewMode === 'revenue' && analyticsData.revenue_breakdown.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-deep-navy mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Revenue Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.revenue_breakdown.slice(0, 6).map((tournament, index) => (
              <div key={index} className="bg-gradient-to-r from-ocean-teal/10 to-sky-400/10 rounded-lg p-4">
                <h4 className="font-medium text-deep-navy mb-2 truncate">
                  {tournament.tournament_name}
                </h4>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-deep-navy">
                      {formatCurrency(tournament.revenue)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {tournament.registrations} registrations
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-ocean-teal">
                      {tournament.registrations > 0 
                        ? formatCurrency(tournament.revenue / tournament.registrations)
                        : '₹0'
                      }
                    </div>
                    <div className="text-xs text-gray-500">per team</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-ocean-teal">
              {analyticsData.monthly_data.reduce((sum, d) => sum + d.tournaments, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Tournaments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.monthly_data.reduce((sum, d) => sum + d.registrations, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Registrations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analyticsData.monthly_data.reduce((sum, d) => sum + d.revenue, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsData.registration_trends.length > 0
                ? (analyticsData.registration_trends.reduce((sum, t) => sum + t.fill_rate, 0) / analyticsData.registration_trends.length).toFixed(0)
                : 0
              }%
            </div>
            <div className="text-sm text-gray-600">Avg Fill Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};