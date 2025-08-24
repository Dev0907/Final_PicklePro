import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, Users, Phone } from 'lucide-react';
import { getToken } from '../utils/auth';
import { showTournamentCreated, showErrorAlert, showLoadingAlert, closeLoadingAlert, showValidationError } from '../utils/sweetAlert';

export const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '', 
    time: '',
    location: '',
    fee: '',
    maxTeams: '',
    organizerContact: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.fee) newErrors.fee = 'Entry fee is required';
    if (!formData.maxTeams) newErrors.maxTeams = 'Maximum teams is required';
    if (!formData.organizerContact.trim()) newErrors.organizerContact = 'Contact information is required';

    // Validate phone number
    if (formData.organizerContact && !/^\+?[\d\s-()]+$/.test(formData.organizerContact)) {
      newErrors.organizerContact = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showValidationError('Please fix the errors in the form');
      return;
    }

    showLoadingAlert('Creating Tournament...', 'Setting up your tournament for players to join');
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        showErrorAlert('Authentication Required', 'Please log in as an owner to create a tournament.');
        return;
      }
      const res = await fetch('http://localhost:5000/api/tournaments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          fee: Number(formData.fee),
          maxTeams: Number(formData.maxTeams)
        })
      });
      const data = await res.json();
      closeLoadingAlert();
      setLoading(false);
      if (!res.ok) {
        showErrorAlert('Failed to Create Tournament', data.error || 'Unable to create tournament');
        return;
      }
      await showTournamentCreated(formData.name);
      navigate('/manage-tournaments');
    } catch (err) {
      closeLoadingAlert();
      setLoading(false);
      showErrorAlert('Network Error', 'Please check your connection and try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              Create Tournament
            </h1>
            <p className="text-gray-600">
              Set up a new tournament for your club and community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tournament name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-deep-navy mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the tournament, rules, prizes, etc."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Tournament Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  Start Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
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
                placeholder="Enter venue address or court location"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Entry Fee and Max Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Entry Fee (₹) *
                </label>
                <input
                  type="number"
                  name="fee"
                  value={formData.fee}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.fee ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0 for free tournament"
                />
                {errors.fee && <p className="text-red-500 text-sm mt-1">{errors.fee}</p>}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Maximum Teams *
                </label>
                <input
                  type="number"
                  name="maxTeams"
                  value={formData.maxTeams}
                  onChange={handleChange}
                  min="4"
                  max="64"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                    errors.maxTeams ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="16"
                />
                {errors.maxTeams && <p className="text-red-500 text-sm mt-1">{errors.maxTeams}</p>}
              </div>
            </div>

            {/* Organizer Contact */}
            <div>
              <label className="flex items-center text-sm font-medium text-deep-navy mb-2">
                <Phone className="h-4 w-4 mr-2" />
                Organizer Contact *
              </label>
              <input
                type="tel"
                name="organizerContact"
                value={formData.organizerContact}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors ${
                  errors.organizerContact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+91 98765 43210"
              />
              {errors.organizerContact && <p className="text-red-500 text-sm mt-1">{errors.organizerContact}</p>}
            </div>

            {/* Tournament Preview */}
            <div className="bg-sky-mist rounded-lg p-6">
              <h3 className="text-lg font-semibold text-deep-navy mb-4">Tournament Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-deep-navy">
                <div>
                  <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
                  <p><strong>Date:</strong> {formData.date || 'Not selected'}</p>
                  <p><strong>Time:</strong> {formData.time || 'Not selected'}</p>
                  <p><strong>Location:</strong> {formData.location || 'Not specified'}</p>
                </div>
                <div>
                  <p><strong>Entry Fee:</strong> ₹{formData.fee || '0'}</p>
                  <p><strong>Max Teams:</strong> {formData.maxTeams || 'Not specified'}</p>
                  <p><strong>Contact:</strong> {formData.organizerContact || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-ocean-teal text-ivory-whisper py-3 px-6 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}