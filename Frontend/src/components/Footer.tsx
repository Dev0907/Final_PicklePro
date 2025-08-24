import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-navy text-ivory-whisper py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold">
                Pickle<span className="text-lemon-zest">Pro</span>
              </span>
            </Link>
            <p className="text-gray-300 mb-4">
              Built by passionate players for passionate players. Revolutionizing how pickleball enthusiasts connect, compete, and improve their game.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/dev_molarity/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lemon-zest transition-colors"
                title="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://www.linkedin.com/in/devparikh-charusat09/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lemon-zest transition-colors"
                title="Connect with us on LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-300 hover:text-lemon-zest transition-colors">Home</a></li>
              <li><a href="#about" className="text-gray-300 hover:text-lemon-zest transition-colors">About Us</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-lemon-zest transition-colors">Pricing</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-lemon-zest transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-300 hover:text-lemon-zest transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-lemon-zest transition-colors">Terms of Service</Link></li>
              <li><Link to="/support" className="text-gray-300 hover:text-lemon-zest transition-colors">Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 PicklePro. All rights reserved. Made with ❤️ by Dev Parikh, Jay Parmar & Yug Panchal.
          </p>
        </div>
      </div>
    </footer>
  );
};