import React, { useState } from 'react';
import { X, Users, Phone, User } from 'lucide-react';
import { Tournament } from '../types';
import { getToken } from '../utils/auth';

interface TournamentRegistrationFormProps {
  tournament: Tournament;
  onClose: () => void;
  onSuccess: () => void;
}

export const TournamentRegistrationForm: React.FC<TournamentRegistrationFormProps> = ({
  tournament,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    teamName: '',
    player1Name: '',
    player1Phone: '',
    player2Name: '',
    player2Phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }
    if (!formData.player1Name.trim()) {
      newErrors.player1Name = 'Player 1 name is required';
    }
    if (!formData.player1Phone.trim()) {
      newErrors.player1Phone = 'Player 1 phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.player1Phone)) {
      newErrors.player1Phone = 'Please enter a valid phone number';
    }

    // Player 2 is optional, but if name is provided, phone should be too
    if (formData.player2Name.trim() && !formData.player2Phone.trim()) {
      newErrors.player2Phone = 'Player 2 phone is required when name is provided';
    }
    if (formData.player2Phone.trim() && !/^\+?[\d\s-()]+$/.test(formData.player2Phone)) {
      newErrors.player2Phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Please log in to register for tournaments');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/tournaments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tournament_id: tournament.id,
          team_name: formData.teamName,
          player1_name: formData.player1Name,
          player1_phone: formData.player1Phone,
          player2_name: formData.player2Name || null,
          player2_phone: formData.player2Phone || null
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Call onSuccess first to update the parent component's state
      onSuccess();
      // Then close the modal
      onClose();
    } catch (error) {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    const requiredFields = ['teamName', 'player1Name', 'player1Phone'];
    const hasRequiredFields = requiredFields.every(field => formData[field as keyof typeof formData].trim() !== '');
    
    // If player2 name is provided, phone is also required
    const player2Valid = !formData.player2Name.trim() || 
      (formData.player2Name.trim() && formData.player2Phone.trim());
    
    // Check phone number format for required fields only
    const player1PhoneValid = formData.player1Phone.trim() && /^\+?[\d\s-()]+$/.test(formData.player1Phone);
    const player2PhoneValid = !formData.player2Phone.trim() || /^\+?[\d\s-()]+$/.test(formData.player2Phone);
    
    return hasRequiredFields && player2Valid && player1PhoneValid && player2PhoneValid;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-deep-navy">Register for Tournament</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close registration form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tournament Info */}
        <div className="p-6 bg-sky-mist">
          <h3 className="text-lg font-semibold text-deep-navy mb-2">{tournament.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-deep-navy">
            <div>
              <p><strong>Date:</strong> {new Date(tournament.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {tournament.time}</p>
            </div>
            <div>
              <p><strong>Location:</strong> {tournament.location}</p>
              <p><strong>Entry Fee:</strong> {tournament.fee === 0 ? 'FREE' : `₹${tournament.fee}`}</p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
              <Users className="h-4 w-4 mr-2" />
              Team Name *
            </label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                errors.teamName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your team name"
            />
            {errors.teamName && <p className="text-red-500 text-sm mt-1">{errors.teamName}</p>}
          </div>

          {/* Player 1 */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-deep-navy flex items-center">
              <User className="h-5 w-5 mr-2" />
              Player 1 (Required)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="player1Name"
                  value={formData.player1Name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.player1Name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Player 1 full name"
                />
                {errors.player1Name && <p className="text-red-500 text-sm mt-1">{errors.player1Name}</p>}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="player1Phone"
                  value={formData.player1Phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.player1Phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.player1Phone && <p className="text-red-500 text-sm mt-1">{errors.player1Phone}</p>}
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-deep-navy flex items-center">
              <User className="h-5 w-5 mr-2" />
              Player 2 (Optional)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="player2Name"
                  value={formData.player2Name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.player2Name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Player 2 full name (optional)"
                />
                {errors.player2Name && <p className="text-red-500 text-sm mt-1">{errors.player2Name}</p>}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="player2Phone"
                  value={formData.player2Phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.player2Phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210 (optional)"
                />
                {errors.player2Phone && <p className="text-red-500 text-sm mt-1">{errors.player2Phone}</p>}
              </div>
            </div>
          </div>

          {/* Registration Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-deep-navy mb-2">Registration Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Tournament:</strong> {tournament.name}</p>
              <p><strong>Team:</strong> {formData.teamName || 'Not specified'}</p>
              <p><strong>Players:</strong> {formData.player1Name || 'Player 1'}{formData.player2Name ? ` & ${formData.player2Name}` : ''}</p>
              <p><strong>Entry Fee:</strong> {tournament.fee === 0 ? 'FREE' : `₹${tournament.fee}`}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex-1 bg-ocean-teal text-ivory-whisper px-6 py-3 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};