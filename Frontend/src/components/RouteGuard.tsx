import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'player' | 'owner';
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  redirectTo 
}) => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    if (requiredRole) {
      const userRole = user.role || user.type || (user.email?.toLowerCase().includes('owner') ? 'owner' : 'player');
      
      if (userRole !== requiredRole) {
        // Wrong role, redirect to appropriate dashboard
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate(userRole === 'owner' ? '/owner-dashboard' : '/player-dashboard');
        }
        return;
      }
    }
  }, [user, requiredRole, redirectTo, navigate]);

  // Don't render children if user is not authenticated or has wrong role
  if (!user) {
    return (
      <div className="min-h-screen bg-ivory-whisper flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    const userRole = user.role || user.type || (user.email?.toLowerCase().includes('owner') ? 'owner' : 'player');
    
    if (userRole !== requiredRole) {
      return (
        <div className="min-h-screen bg-ivory-whisper flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-teal mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};