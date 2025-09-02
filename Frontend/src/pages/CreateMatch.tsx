import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getToken } from '../utils/auth';
import { showMatchCreated, showErrorAlert, showLoadingAlert, closeLoadingAlert, showValidationError } from '../utils/sweetAlert';

const CreateMatch: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    playersNeeded: 2,
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.location) {
      showValidationError('Please fill in all required fields');
      return;
    }

    showLoadingAlert('Creating Match...', 'Setting up your match for other players to join');
    setLoading(true);
    setError('');
    
    try {
      // Combine date and time into ISO string for backend
      const date_time = `${formData.date}T${formData.time}`;
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/matches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          date_time,
          location: formData.location,
          players_required: formData.playersNeeded,
          level_of_game: formData.level,
          description: formData.description
        })
      });
      
      const data = await res.json();
      closeLoadingAlert();
      
      if (!res.ok) {
        showErrorAlert('Failed to Create Match', data.message || 'Unable to create match');
        return;
      }
      
      await showMatchCreated();
      navigate('/my-matches');
    } catch (err) {
      closeLoadingAlert();
      showErrorAlert('Network Error', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'playersNeeded' ? parseInt(value) : value
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFF7]">
      <Sidebar />
      <div className="ml-64 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-[#F0F7B1]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1E1F26] mb-2">
              Create a Match
            </h1>
            <p className="text-[#1E1F26]">
              Set up a new pickleball match and invite players to join
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-[#1E1F26] mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  Match Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-[#1E1F26] mb-2">
                  <Clock className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  Match Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors"
                />
              </div>
            </div>

            {/* Level and Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1E1F26] mb-2">
                  Skill Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-[#1E1F26] mb-2">
                  <Users className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                  Players Needed
                </label>
                <input
                  type="number"
                  name="playersNeeded"
                  value={formData.playersNeeded}
                  onChange={handleChange}
                  min="1"
                  max="3"
                  required
                  className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center text-sm font-medium text-[#1E1F26] mb-2">
                <MapPin className="h-4 w-4 mr-2 text-[#1B3F2E]" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Enter court location or address"
                className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1E1F26] mb-2">
                Match Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Add any additional details about the match..."
                className="w-full px-4 py-3 border border-[#C4C4C4] rounded-lg focus:ring-2 focus:ring-[#1B3F2E] focus:border-[#1B3F2E] transition-colors resize-none"
              />
            </div>

            {/* Match Preview */}
            <div className="bg-[#F0F7B1] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#1E1F26] mb-4">Match Preview</h3>
              <div className="space-y-2 text-sm text-[#1E1F26]">
                <p><strong>Date:</strong> {formData.date || 'Not selected'}</p>
                <p><strong>Time:</strong> {formData.time || 'Not selected'}</p>
                <p><strong>Level:</strong> {formData.level}</p>
                <p><strong>Players Needed:</strong> {formData.playersNeeded}</p>
                <p><strong>Location:</strong> {formData.location || 'Not specified'}</p>
              </div>
            </div>

            {error && <div className="text-red-600 text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-[#EFFF4F] text-[#1E1F26] py-3 px-6 rounded-lg font-semibold hover:bg-[#F5FF9F] transition-all transform hover:scale-[1.02] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CreateMatch;