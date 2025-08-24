import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { setCurrentUser } from '../utils/auth';
import { User } from '../types';
import { showLoginSuccess, showErrorAlert, showLoadingAlert, closeLoadingAlert, showValidationError } from '../utils/sweetAlert';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showValidationError('Please fill in all fields');
      return;
    }

    // Show loading alert
    showLoadingAlert('Signing In...', 'Please wait while we verify your credentials');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      closeLoadingAlert();

      if (!response.ok) {
        showErrorAlert('Login Failed', data.error || 'Invalid credentials');
        return;
      }

      setCurrentUser(data.user, data.token);
      await showLoginSuccess(data.user.fullname || data.user.email);

      // Redirect based on user role from backend
      if (data.user.role === 'owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/player-dashboard');
      }
    } catch (err) {
      closeLoadingAlert();
      showErrorAlert('Network Error', 'Please check your connection and try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your PicklePro account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-ocean-teal focus:ring-ocean-teal"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-ocean-teal hover:text-ocean-teal/80">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-ocean-teal text-ivory-whisper py-3 px-6 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
            >
              Sign In
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-ocean-teal hover:text-ocean-teal/80 font-medium">
                Sign up here
              </Link>
            </p>
          </div>

       
        </div>
      </div>
    </div>
  );
};