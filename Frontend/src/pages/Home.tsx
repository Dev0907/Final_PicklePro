import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Trophy, Video, Calendar, Check, Mail, Phone, MapPin, Instagram, Linkedin, Github, BarChart3, Zap } from "lucide-react";
import { Footer } from "../components/Footer";
import PickleProLogo from "../assets/PicklePr.jpg";

export const Home: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0');
            setVisibleCards(prev => [...prev, cardIndex]);
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Users className="h-12 w-12 text-ocean-teal" />,
      title: "Match Creation & Joining",
      description:
        "Easily create matches or join existing ones. Find players at your skill level and location.",
    },
    {
      icon: <Calendar className="h-12 w-12 text-ocean-teal" />,
      title: "Venue Booking & Court Reservations",
      description:
        "Book courts at premium venues with real-time availability. Reserve your perfect time slot instantly.",
    },
    {
      icon: <Trophy className="h-12 w-12 text-ocean-teal" />,
      title: "Tournament Registration",
      description:
        "Participate in local tournaments and compete with the best players in your area.",
    },
    {
      icon: <Video className="h-12 w-12 text-ocean-teal" />,
      title: "AI Video Analysis",
      description:
        "Upload your game videos and get AI-powered insights to improve your performance.",
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-ocean-teal" />,
      title: "Performance Analytics",
      description:
        "Track your progress with detailed statistics and performance metrics over time.",
    },
    {
      icon: <Zap className="h-12 w-12 text-ocean-teal" />,
      title: "Real-time Notifications",
      description:
        "Stay updated with instant notifications for match invites, bookings, and tournament updates.",
    },
  ];

  const founders = [
    {
      name: "Dev Parikh",
      role: "Co-Founder & CTO",
      bio: "Passionate pickleball player and tech enthusiast. Dev brings 5 years of software development experience and a love for creating seamless user experiences.",
      instagram: "https://www.instagram.com/dev_molarity/",
      linkedin: "https://www.linkedin.com/in/devparikh-charusat09/",
      github: "https://github.com/devparikh"
    },
    {
      name: "Jay Parmar",
      role: "Co-Founder & CEO",
      bio: "Sports analytics expert and data scientist. Jay's expertise in AI and machine learning powers our game analysis features.",
      instagram: "https://www.instagram.com/jay_parmar/",
      linkedin: "https://www.linkedin.com/in/jay-parmar/",
      github: "https://github.com/jayparmar"
    },
    {
      name: "Yug Panchal",
      role: "Co-Founder & COO",
      bio: "Former professional tennis player turned pickleball advocate. Yug understands the competitive spirit and community aspects that make racquet sports special.",
      instagram: "https://www.instagram.com/yug_panchal/",
      linkedin: "https://www.linkedin.com/in/yug-panchal/",
      github: "https://github.com/yugpanchal"
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for casual players",
      features: [
        "Join matches",
        "Create basic profile",
        "View other players",
        "Basic match history"
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-sky-mist text-deep-navy hover:bg-sky-mist/90",
      popular: false
    },
    {
      name: "Pro Player",
      price: "₹99",
      period: "per month",
      description: "For serious players who want more",
      features: [
        "Everything in Free",
        "Create unlimited matches",
        "Advanced analytics",
        "Video upload & AI analysis",
        "Priority support",
        "Advanced filtering"
      ],
      buttonText: "Start Pro Trial",
      buttonStyle: "bg-lemon-zest text-deep-navy hover:bg-lemon-zest/90",
      popular: true
    },
    {
      name: "Club Owner",
      price: "₹199",
      period: "per month",
      description: "Complete solution for clubs and organizers",
      features: [
        "Everything in Pro Player",
        "Create tournaments",
        "Manage club members",
        "Club analytics dashboard",
        "Custom branding",
        "Priority customer support",
        "Revenue tracking"
      ],
      buttonText: "Start Club Trial",
      buttonStyle: "bg-ocean-teal text-ivory-whisper hover:bg-ocean-teal/90",
      popular: false
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-ocean-teal to-deep-navy text-ivory-whisper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* PicklePro Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={PickleProLogo} 
                alt="PicklePro Logo" 
                className="h-32 w-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Dink, Drive, Dominate <br />
              <span className="text-lemon-zest">Pickleball</span> with
              PicklePro.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Create matches, join tournaments, and analyze your game like a
              pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/join-match"
                className="bg-lemon-zest text-deep-navy px-8 py-4 rounded-lg text-lg font-semibold hover:bg-lemon-zest/90 transition-all transform hover:scale-105"
              >
                Join a Match
              </Link>
              <Link
                to="/book-slot"
                className="bg-ocean-teal text-ivory-whisper px-8 py-4 rounded-lg text-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-105"
              >
                Book Venue
              </Link>
              <Link
                to="/create-match"
                className="bg-white text-deep-navy px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Create a Match
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ivory-whisper to-transparent"></div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">
              Everything You Need to Excel at Pickleball
            </h2>
            <p className="text-xl text-gray-600">
              From casual matches to competitive tournaments, we've got you
              covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                data-card-index={index}
                className={`feature-card bg-gradient-to-br from-ivory-whisper to-lemon-zest/20 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-700 transform hover:-translate-y-2 border-2 border-lemon-zest/30 ${
                  visibleCards.includes(index) 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-deep-navy mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-deep-navy/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
              About PicklePro
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by passionate players for passionate players. We're
              revolutionizing how pickleball enthusiasts connect, compete, and
              improve their game.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-lemon-zest/30 to-lemon-zest/10 rounded-xl p-8 md:p-12 mb-16 border-2 border-lemon-zest/40">
            <h3 className="text-3xl font-bold text-deep-navy mb-6 text-center">
              Our Mission
            </h3>
            <p className="text-lg text-deep-navy text-center leading-relaxed">
              "PicklePro is built by passionate players for passionate players. We
              simplify match organization, enable seamless venue booking, help you
              find competitive partners, and elevate your game with advanced
              analytics. Our goal is to create a thriving community where every
              player, from beginner to pro, can find their perfect match, book
              premium courts, and continuously improve their skills."
            </p>
          </div>

          {/* Founders */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-deep-navy text-center mb-12">
              Meet Our Founders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {founders.map((founder, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-ocean-teal rounded-full mx-auto mb-6 flex items-center justify-center">
                      <span className="text-2xl font-bold text-ivory-whisper">
                        {founder.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-deep-navy mb-2">
                      {founder.name}
                    </h4>
                    <p className="text-ocean-teal font-medium mb-4">{founder.role}</p>
                    <p className="text-gray-600 leading-relaxed mb-6">{founder.bio}</p>
                    
                    {/* Social Links */}
                    <div className="flex justify-center space-x-4">
                      <a
                        href={founder.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                        title="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a
                        href={founder.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        title="GitHub"
                      >
                        <Github className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h4 className="text-2xl font-bold text-deep-navy mb-4">
                Community First
              </h4>
              <p className="text-gray-600">
                We believe pickleball is more than just a sport - it's about
                building connections, fostering friendships, and creating a
                supportive community where everyone can thrive.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h4 className="text-2xl font-bold text-deep-navy mb-4">
                Seamless Experience
              </h4>
              <p className="text-gray-600">
                From finding matches to booking premium venues, we make every
                aspect of your pickleball journey effortless with real-time
                availability and instant confirmations.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h4 className="text-2xl font-bold text-deep-navy mb-4">
                Innovation & Excellence
              </h4>
              <p className="text-gray-600">
                We're constantly pushing the boundaries of what's possible with
                technology to enhance your pickleball experience, from AI-powered
                analytics to seamless venue management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-ivory-whisper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a casual player or running a pickleball club, we have the perfect plan for your needs.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-xl shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-lemon-zest transform scale-105' : ''
                } hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-lemon-zest text-deep-navy px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-deep-navy mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-deep-navy">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all transform hover:scale-[1.02] ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div>
            <h3 className="text-3xl font-bold text-deep-navy text-center mb-12">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-deep-navy mb-3">
                  Can I switch plans anytime?
                </h4>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-deep-navy mb-3">
                  Is there a free trial?
                </h4>
                <p className="text-gray-600">
                  Yes, Pro Player and Club Owner plans come with a 14-day free trial. No credit card required.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-deep-navy mb-3">
                  What payment methods do you accept?
                </h4>
                <p className="text-gray-600">
                  We accept all major credit cards, debit cards, UPI, and net banking for Indian customers.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-deep-navy mb-3">
                  Can I cancel anytime?
                </h4>
                <p className="text-gray-600">
                  Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
              Contact Us
            </h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-ivory-whisper rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-deep-navy mb-6">Send us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-deep-navy mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-deep-navy mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-deep-navy mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-teal focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-ocean-teal text-ivory-whisper py-3 px-6 rounded-lg font-semibold hover:bg-ocean-teal/90 transition-all transform hover:scale-[1.02]"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-lemon-zest/30 to-lemon-zest/10 rounded-xl p-8 animate-fade-in-up border-2 border-lemon-zest/40">
                <h3 className="text-2xl font-bold text-deep-navy mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                    <Mail className="h-6 w-6 text-ocean-teal" />
                    <div>
                      <p className="font-medium text-deep-navy">Email</p>
                      <p className="text-gray-600">devparikh200479@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                    <Phone className="h-6 w-6 text-ocean-teal" />
                    <div>
                      <p className="font-medium text-deep-navy">Phone</p>
                      <p className="text-gray-600">+91 91061 58720</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
                    <MapPin className="h-6 w-6 text-ocean-teal" />
                    <div>
                      <p className="font-medium text-deep-navy">Office</p>
                      <p className="text-gray-600">76RH+FX3, Kaladarshan Char Rasta, Waghodia, Vadodara, Gujarat 390025</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-ivory-whisper rounded-xl shadow-lg p-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-xl font-bold text-deep-navy mb-4">Our Location</h3>
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Google Maps Integration</p>
                    <p className="text-sm">Waghodia, Vadodara, Gujarat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ocean-teal text-ivory-whisper py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Take Your Game to the Next Level?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of players who are already using PicklePro to improve
            their game
          </p>
          <Link
            to="/signup"
            className="inline-block bg-lemon-zest text-deep-navy px-8 py-4 rounded-lg text-lg font-semibold hover:bg-lemon-zest/90 transition-all transform hover:scale-105"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
