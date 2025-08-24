import React, { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  location: '',
  no_of_courts: '',
};

const OwnerSignUp: React.FC = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Valid 10-digit phone number required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.no_of_courts.trim() || isNaN(Number(formData.no_of_courts))) newErrors.no_of_courts = 'Number of courts is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    if (!validateForm()) return;
    try {
      const response = await fetch('http://localhost:5000/api/auth/owner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          location: formData.location,
          no_of_courts: formData.no_of_courts
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ api: data.error || 'Signup failed' });
        return;
      }
      setSuccess('Owner account created successfully!');
      setFormData(initialForm);
    } catch (err) {
      setErrors({ api: 'Network error' });
    }
  };

  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy mb-2">Owner Registration</h1>
            <p className="text-gray-600">This page is hidden and only accessible via direct URL.</p>
          </div>
          {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter your full name" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="your.email@example.com" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="9876543210" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Location *</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.location ? 'border-red-500' : 'border-gray-300'}`} placeholder="Location" />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Number of Courts *</label>
                <input type="number" name="no_of_courts" value={formData.no_of_courts} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.no_of_courts ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g. 3" min="1" />
                {errors.no_of_courts && <p className="text-red-500 text-sm mt-1">{errors.no_of_courts}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-navy mb-2">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter a strong password" />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>
            {errors.api && <p className="text-red-500 text-sm mt-1">{errors.api}</p>}
            {/* Remove gender input field */}
            <button type="submit" className="w-full bg-lemon-zest text-deep-navy py-3 px-6 rounded-lg font-semibold hover:bg-lemon-zest/90 transition-all transform hover:scale-[1.02]">Create Owner Account</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignUp;