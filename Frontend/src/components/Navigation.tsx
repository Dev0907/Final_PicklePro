import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { getCurrentUser, logout } from '../utils/auth';
import { SearchBar } from './SearchBar';
import { NotificationSystem } from './NotificationSystem';
import { showLogoutConfirm } from '../utils/sweetAlert';
import PickleProLogo from '../assets/PicklePr.jpg';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const user = getCurrentUser();
  const isAdmin = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await showLogoutConfirm();
    if (result.isConfirmed) {
      logout();
      navigate('/');
      setIsMenuOpen(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Implement search functionality
  };

  return (
    <nav className="bg-ocean-teal text-ivory-whisper sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={PickleProLogo} 
              alt="PicklePro Logo" 
              className="h-10 w-auto rounded-md"
            />
            <span className="text-2xl font-bold">
              Pickle<span className="text-lemon-zest">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="hover:text-lemon-zest transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-lemon-zest transition-colors">
              About Us
            </a>
            <a href="#pricing" className="hover:text-lemon-zest transition-colors">
              Pricing
            </a>
            <a href="#contact" className="hover:text-lemon-zest transition-colors">
              Contact Us
            </a>
            {isAdmin && (
              <Link 
                to="/admin/dashboard" 
                className="ml-4 px-3 py-1 bg-ocean-teal text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Search, Notification, and Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-ocean-teal/80 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            {user && <NotificationSystem />}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={user.type === 'Player' ? '/player-dashboard' : '/owner-dashboard'}
                  className="hover:text-lemon-zest transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-lemon-zest transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-lemon-zest text-deep-navy px-4 py-2 rounded-lg font-medium hover:bg-lemon-zest/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signup"
                  className="bg-lemon-zest text-deep-navy px-4 py-2 rounded-lg font-medium hover:bg-lemon-zest/90 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="border border-ivory-whisper px-4 py-2 rounded-lg hover:bg-ivory-whisper hover:text-ocean-teal transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="pb-4">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-ocean-teal border-t border-ocean-teal/20">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#home"
              className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#about"
              className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </a>
            <a
              href="#pricing"
              className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </a>
            
            {user ? (
              <>
                <Link
                  to={user.type === 'Player' ? '/player-dashboard' : '/owner-dashboard'}
                  className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 hover:bg-ocean-teal/80 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="block px-3 py-2 bg-lemon-zest text-deep-navy rounded-md font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 border border-ivory-whisper rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};