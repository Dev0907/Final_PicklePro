import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, DollarSign, Phone } from 'lucide-react';
import { getToken } from '../utils/auth';
import { showErrorAlert, showLoadingAlert, closeLoadingAlert } from '../utils/sweetAlert';

interface Tournament {
  id: string;
  tournament_name: string;
  tournament_date: string;
  start_time: string;
  location: string;
  entry_fee: number;
  number_of_team: number;
  phone: string;
}

interface TournamentEditModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSuccess: () => void;
}

export const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  tournament,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    tournament_name: tournament.tournament_name,
    tournament_date: tournament.tournament_date,
    start_time: tournament.start_time,
    location: tournament.location,
    entry_fee: tournament.entry_fee.toString(),
    number_of_team: tournament.number_of_team.toString(),
    phone: tournament.phone
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tournament_name.trim()) {
      newErrors.tournament_name = 'Tournament name is required';
    }
    if (!formData.tournament_date) {
      newErrors.tournament_date = 'Tournament date is required';
    } else if (new Date(formData.tournament_date) <= new Date()) {
      newErrors.tournament_date = 'Tournament date must be in the future';
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.entry_fee || isNaN(Number(formData.entry_fee)) || Number(formData.entry_fee) < 0) {
      newErrors.entry_fee = 'Valid entry fee is required (0 for free)';
    }
    if (!formData.number_of_team || isNaN(Number(formData.number_of_team)) || Number(formData.number_of_team) < 2) {
      newErrors.number_of_team = 'Minimum 2 teams required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Contact phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
        showErrorAlert('Authentication Required', 'Please log in to update tournament');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.tournament_name,
          date: formData.tournament_date,
          time: formData.start_time,
          location: formData.location,
          fee: Number(formData.entry_fee),
          maxTeams: Number(formData.number_of_team),
          organizerContact: formData.phone
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        showErrorAlert('Update Failed', data.error || 'Failed to update tournament');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (error) {
      showErrorAlert('Network Error', 'Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-deep-navy">Edit Tournament</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close edit form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium text-deep-navy mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              name="tournament_name"
              value={formData.tournament_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                errors.tournament_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter tournament name"
            />
            {errors.tournament_name && <p className="text-red-500 text-sm mt-1">{errors.tournament_name}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Tournament Date *
              </label>
              <input
                type="date"
                name="tournament_date"
                value={formData.tournament_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.tournament_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.tournament_date && <p className="text-red-500 text-sm mt-1">{errors.tournament_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Start Time *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter tournament location"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          {/* Entry Fee and Max Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                <DollarSign className="h-4 w-4 mr-2" />
                Entry Fee (₹) *
              </label>
              <input
                type="number"
                name="entry_fee"
                value={formData.entry_fee}
                onChange={handleChange}
                min="0"
                step="50"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.entry_fee ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0 for free tournament"
              />
              {errors.entry_fee && <p className="text-red-500 text-sm mt-1">{errors.entry_fee}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                <Users className="h-4 w-4 mr-2" />
                Maximum Teams *
              </label>
              <input
                type="number"
                name="number_of_team"
                value={formData.number_of_team}
                onChange={handleChange}
                min="2"
                max="64"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.number_of_team ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Maximum number of teams"
              />
              {errors.number_of_team && <p className="text-red-500 text-sm mt-1">{errors.number_of_team}</p>}
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
              <Phone className="h-4 w-4 mr-2" />
              Contact Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
              disabled={loading}
              className="flex-1 bg-ocean-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};