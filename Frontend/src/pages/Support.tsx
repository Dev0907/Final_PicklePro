import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, Book, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from '../components/Footer';
import PickleProLogo from '../assets/PicklePr.jpg';

export const Support: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: '',
    message: ''
  });

  const faqs = [
    {
      question: "How do I create a match?",
      answer: "To create a match, go to your dashboard and click 'Create Match'. Fill in the details like date, time, location, and skill level. Other players can then join your match."
    },
    {
      question: "How do I book a venue?",
      answer: "Navigate to 'Book Venue' from the main menu. Browse available venues, select your preferred date and time, and complete the booking with payment."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel bookings according to the venue's cancellation policy. Most venues allow cancellation up to 24 hours before the booking time."
    },
    {
      question: "How does the AI video analysis work?",
      answer: "Upload your match videos through the 'Upload Video' section. Our AI analyzes your gameplay and provides insights on technique, positioning, and areas for improvement."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets for Indian users."
    },
    {
      question: "How do I join a tournament?",
      answer: "Browse available tournaments in the 'Join Tournament' section. Select a tournament that matches your skill level and complete the registration process."
    },
    {
      question: "Can I change my subscription plan?",
      answer: "Yes, you can upgrade or downgrade your plan anytime from your account settings. Changes take effect immediately."
    },
    {
      question: "How do I report a problem with another player?",
      answer: "Use the 'Report' feature in the match details or contact our support team directly. We take all reports seriously and investigate promptly."
    }
  ];

  const categories = [
    "General Question",
    "Account Issues",
    "Booking Problems",
    "Payment Issues",
    "Technical Support",
    "Feature Request",
    "Bug Report"
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support form submitted:', contactForm);
    alert('Thank you for contacting us! We\'ll get back to you within 24 hours.');
    setContactForm({ name: '', email: '', category: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFF7] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={PickleProLogo} 
              alt="PicklePro Logo" 
              className="h-20 w-auto rounded-lg shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E1F26] mb-4">
            Support Center
          </h1>
          <p className="text-xl text-[#1E1F26]">
            Get help with PicklePro. Find answers to common questions or contact our support team.
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <MessageCircle className="h-12 w-12 text-ocean-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-deep-navy mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our support team in real-time</p>
            <button type="button" className="bg-ocean-teal text-white px-6 py-2 rounded-lg hover:bg-ocean-teal/90 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Mail className="h-12 w-12 text-ocean-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-deep-navy mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get detailed help via email</p>
            <a
              href="mailto:support@picklepro.in"
              className="bg-lemon-zest text-deep-navy px-6 py-2 rounded-lg hover:bg-lemon-zest/90 transition-colors inline-block"
            >
              Send Email
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Phone className="h-12 w-12 text-ocean-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-deep-navy mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us for immediate assistance</p>
            <a
              href="tel:+919876543210"
              className="bg-sky-mist text-deep-navy px-6 py-2 rounded-lg hover:bg-sky-mist/90 transition-colors inline-block"
            >
              Call Now
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <div>
            <div className="flex items-center mb-6">
              <Book className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-3xl font-bold text-deep-navy">Frequently Asked Questions</h2>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
              />
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-deep-navy">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-ocean-teal" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-ocean-teal" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No FAQs found matching your search.</p>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div>
            <div className="flex items-center mb-6">
              <MessageCircle className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-3xl font-bold text-deep-navy">Contact Support</h2>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-deep-navy mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={contactForm.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-deep-navy mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-deep-navy mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={contactForm.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-deep-navy mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent resize-none"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-ocean-teal text-white py-3 px-6 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
                >
                  Send Message
                </button>
              </form>

              <div className="mt-6 p-4 bg-sky-mist rounded-lg">
                <p className="text-sm text-deep-navy">
                  <strong>Response Time:</strong> We typically respond within 24 hours during business days.
                  For urgent issues, please call our support line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};