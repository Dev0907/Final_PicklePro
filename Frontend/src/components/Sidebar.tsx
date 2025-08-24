import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Trophy, 
  Video,
  Calendar,
  Users,
  Settings,
  User,
  Building,
  ClipboardList,
  Clock,
  BarChart3,
  DollarSign,
  Bell
} from 'lucide-react';
import { getCurrentUser } from '../utils/auth';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const isOwner = user?.type === 'Owner' || user?.type === 'owner';
  
  // Debug logging - remove in production
  console.log('Current user:', user);
  console.log('User type:', user?.type);
  console.log('Is owner:', isOwner);

  const playerMenuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/player-dashboard',
      color: 'text-ocean-teal'
    },
    {
      title: 'Create Match',
      icon: <Plus className="h-5 w-5" />,
      path: '/create-match',
      color: 'text-green-600'
    },
    {
      title: 'Join Match',
      icon: <Search className="h-5 w-5" />,
      path: '/join-match',
      color: 'text-blue-600'
    },
    {
      title: 'Manage Join Requests',
      icon: <ClipboardList className="h-5 w-5" />,
      path: '/manage-join-requests',
      color: 'text-orange-600'
    },
    {
      title: 'Book Court Slot',
      icon: <Calendar className="h-5 w-5" />,
      path: '/book-slot',
      color: 'text-emerald-600'
    },
    {
      title: 'Join Tournament',
      icon: <Trophy className="h-5 w-5" />,
      path: '/join-tournament',
      color: 'text-yellow-600'
    },
    {
      title: 'Upload Video',
      icon: <Video className="h-5 w-5" />,
      path: '/upload-video',
      color: 'text-purple-600'
    },
    {
      title: 'My Matches',
      icon: <Calendar className="h-5 w-5" />,
      path: '/my-matches',
      color: 'text-indigo-600'
    },
    {
      title: 'My Bookings',
      icon: <Calendar className="h-5 w-5" />,
      path: '/my-bookings',
      color: 'text-teal-600'
    },
    {
      title: 'My Tournaments',
      icon: <Users className="h-5 w-5" />,
      path: '/my-tournaments',
      color: 'text-pink-600'
    }
  ];

  const ownerMenuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/owner-dashboard',
      color: 'text-ocean-teal'
    },
    // Facility Management
    {
      title: 'Manage Facilities',
      icon: <Building className="h-5 w-5" />,
      path: '/manage-facilities',
      color: 'text-blue-600'
    },
    {
      title: 'Court Management',
      icon: <Calendar className="h-5 w-5" />,
      path: '/court-management',
      color: 'text-purple-600'
    },
    {
      title: 'Time Slot Management',
      icon: <Clock className="h-5 w-5" />,
      path: '/slot-management',
      color: 'text-indigo-600'
    },
    {
      title: 'Booking Management',
      icon: <ClipboardList className="h-5 w-5" />,
      path: '/manage-bookings',
      color: 'text-green-600'
    },
    // Tournament Management
    {
      title: 'Create Tournament',
      icon: <Plus className="h-5 w-5" />,
      path: '/create-tournament',
      color: 'text-yellow-600'
    },
    {
      title: 'Manage Tournaments',
      icon: <Trophy className="h-5 w-5" />,
      path: '/manage-tournaments',
      color: 'text-orange-600'
    },
    {
      title: 'Tournament Registrations',
      icon: <Users className="h-5 w-5" />,
      path: '/tournament-registrations',
      color: 'text-purple-600'
    },
    // Analytics & Reports
    {
      title: 'Analytics & Reports',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/owner-analytics',
      color: 'text-cyan-600'
    },
    {
      title: 'Revenue Management',
      icon: <DollarSign className="h-5 w-5" />,
      path: '/revenue-management',
      color: 'text-emerald-600'
    },
    {
      title: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      path: '/owner-notifications',
      color: 'text-red-600'
    }
  ];

  const menuItems = isOwner ? ownerMenuItems : playerMenuItems;

  const bottomMenuItems = [
    {
      title: 'Profile',
      icon: <User className="h-5 w-5" />,
      path: '/profile',
      color: 'text-gray-600'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
      color: 'text-gray-600'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-16 z-40 overflow-y-auto">
      <div className="p-6">
        <div className="space-y-2">
          {isOwner ? (
            <>
              {/* Owner Dashboard */}
              <Link
                to="/owner-dashboard"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/owner-dashboard')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/owner-dashboard') ? 'text-white' : 'text-ocean-teal'} group-hover:scale-110 transition-transform`}>
                  <LayoutDashboard className="h-5 w-5" />
                </span>
                <span className="font-medium">Dashboard</span>
              </Link>

              {/* Facility Management Section */}
              <div className="pt-4 pb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Facility Management</h4>
              </div>
              
              <Link
                to="/manage-facilities"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/manage-facilities')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/manage-facilities') ? 'text-white' : 'text-blue-600'} group-hover:scale-110 transition-transform`}>
                  <Building className="h-5 w-5" />
                </span>
                <span className="font-medium">Manage Facilities</span>
              </Link>

              <Link
                to="/court-management"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/court-management')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/court-management') ? 'text-white' : 'text-purple-600'} group-hover:scale-110 transition-transform`}>
                  <Calendar className="h-5 w-5" />
                </span>
                <span className="font-medium">Court Management</span>
              </Link>

              <Link
                to="/slot-management"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/slot-management')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/slot-management') ? 'text-white' : 'text-indigo-600'} group-hover:scale-110 transition-transform`}>
                  <Clock className="h-5 w-5" />
                </span>
                <span className="font-medium">Time Slot Management</span>
              </Link>

              <Link
                to="/manage-bookings"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/manage-bookings')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/manage-bookings') ? 'text-white' : 'text-green-600'} group-hover:scale-110 transition-transform`}>
                  <ClipboardList className="h-5 w-5" />
                </span>
                <span className="font-medium">Booking Management</span>
              </Link>

              {/* Tournament Management Section */}
              <div className="pt-4 pb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Tournament Management</h4>
              </div>

              <Link
                to="/create-tournament"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/create-tournament')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/create-tournament') ? 'text-white' : 'text-yellow-600'} group-hover:scale-110 transition-transform`}>
                  <Plus className="h-5 w-5" />
                </span>
                <span className="font-medium">Create Tournament</span>
              </Link>

              <Link
                to="/manage-tournaments"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/manage-tournaments')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/manage-tournaments') ? 'text-white' : 'text-orange-600'} group-hover:scale-110 transition-transform`}>
                  <Trophy className="h-5 w-5" />
                </span>
                <span className="font-medium">Manage Tournaments</span>
              </Link>

              <Link
                to="/tournament-registrations"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/tournament-registrations')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/tournament-registrations') ? 'text-white' : 'text-purple-600'} group-hover:scale-110 transition-transform`}>
                  <Users className="h-5 w-5" />
                </span>
                <span className="font-medium">Tournament Registrations</span>
              </Link>

              {/* Business Analytics Section */}
              <div className="pt-4 pb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Business Analytics</h4>
              </div>

              <Link
                to="/owner-analytics"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/owner-analytics')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/owner-analytics') ? 'text-white' : 'text-cyan-600'} group-hover:scale-110 transition-transform`}>
                  <BarChart3 className="h-5 w-5" />
                </span>
                <span className="font-medium">Analytics & Reports</span>
              </Link>

              <Link
                to="/revenue-management"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/revenue-management')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/revenue-management') ? 'text-white' : 'text-emerald-600'} group-hover:scale-110 transition-transform`}>
                  <DollarSign className="h-5 w-5" />
                </span>
                <span className="font-medium">Revenue Management</span>
              </Link>

              <Link
                to="/owner-notifications"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive('/owner-notifications')
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive('/owner-notifications') ? 'text-white' : 'text-red-600'} group-hover:scale-110 transition-transform`}>
                  <Bell className="h-5 w-5" />
                </span>
                <span className="font-medium">Notifications</span>
              </Link>
            </>
          ) : (
            playerMenuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-white' : item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="space-y-2">
            {bottomMenuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-ocean-teal text-white shadow-lg'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-ocean-teal'
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-white' : item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 