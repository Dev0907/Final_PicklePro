import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const BookingSystemDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState({
    backendConnection: 'checking',
    facilitiesAPI: 'checking',
    bookingsAPI: 'checking',
    databaseConnection: 'checking'
  });

  const runDiagnostics = async () => {
    setDiagnostics({
      backendConnection: 'checking',
      facilitiesAPI: 'checking',
      bookingsAPI: 'checking',
      databaseConnection: 'checking'
    });

    // Test 1: Backend connection
    try {
      const response = await fetch('http://localhost:5000/api/facilities/all');
      if (response.ok) {
        setDiagnostics(prev => ({ ...prev, backendConnection: 'success' }));
        
        // Test 2: Facilities API
        const data = await response.json();
        if (data.facilities) {
          setDiagnostics(prev => ({ ...prev, facilitiesAPI: 'success', databaseConnection: 'success' }));
        } else {
          setDiagnostics(prev => ({ ...prev, facilitiesAPI: 'error' }));
        }
      } else {
        setDiagnostics(prev => ({ ...prev, backendConnection: 'error', facilitiesAPI: 'error' }));
      }
    } catch (error) {
      setDiagnostics(prev => ({ 
        ...prev, 
        backendConnection: 'error', 
        facilitiesAPI: 'error',
        databaseConnection: 'error'
      }));
    }

    // Test 3: Bookings API (if we have facilities)
    try {
      const response = await fetch('http://localhost:5000/api/bookings/court/1/slots?date=2024-01-01');
      if (response.ok || response.status === 404) { // 404 is ok, means API is working
        setDiagnostics(prev => ({ ...prev, bookingsAPI: 'success' }));
      } else {
        setDiagnostics(prev => ({ ...prev, bookingsAPI: 'error' }));
      }
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, bookingsAPI: 'error' }));
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Working';
      case 'error':
        return 'Failed';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-deep-navy">System Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          className="px-4 py-2 bg-ocean-teal text-white rounded-lg hover:bg-ocean-teal/90 transition-colors text-sm"
        >
          Run Diagnostics
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Backend Server Connection</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(diagnostics.backendConnection)}
            <span className="text-sm">{getStatusText(diagnostics.backendConnection)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Facilities API</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(diagnostics.facilitiesAPI)}
            <span className="text-sm">{getStatusText(diagnostics.facilitiesAPI)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Bookings API</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(diagnostics.bookingsAPI)}
            <span className="text-sm">{getStatusText(diagnostics.bookingsAPI)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Database Connection</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(diagnostics.databaseConnection)}
            <span className="text-sm">{getStatusText(diagnostics.databaseConnection)}</span>
          </div>
        </div>
      </div>
      
      {Object.values(diagnostics).some(status => status === 'error') && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            <li>Make sure the backend server is running: <code>npm start</code> in Backend folder</li>
            <li>Check if port 5000 is available and not blocked by firewall</li>
            <li>Verify database connection in Backend/.env file</li>
            <li>Run database setup scripts if needed</li>
          </ul>
        </div>
      )}
    </div>
  );
};