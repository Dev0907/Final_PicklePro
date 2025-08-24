import React from "react";
import { Eye, Lock, Users, Database, Mail } from "lucide-react";
import { Footer } from "../components/Footer";
import PickleProLogo from "../assets/PicklePr.jpg";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={PickleProLogo} 
              alt="PicklePro Logo" 
              className="h-20 w-auto rounded-lg shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-deep-navy mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. Learn how we collect, use, and
            protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                We collect information you provide directly to us, such as when
                you create an account, join matches, book venues, or contact us
                for support.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal information (name, email, phone number)</li>
                <li>Profile information (skill level, location preferences)</li>
                <li>Match and booking history</li>
                <li>
                  Payment information (processed securely through third-party
                  providers)
                </li>
                <li>Communication preferences</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                How We Use Your Information
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our services</li>
                <li>Match you with suitable players and venues</li>
                <li>Process bookings and payments</li>
                <li>Send you important updates and notifications</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Information Sharing
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties without your consent, except in the
                following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  With other players when you join matches (limited profile
                  information)
                </li>
                <li>With venue partners for booking confirmations</li>
                <li>With payment processors for transaction processing</li>
                <li>When required by law or to protect our rights</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Data Security
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                We implement appropriate security measures to protect your
                personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL encryption for data transmission</li>
                <li>Secure servers and databases</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information</li>
                <li>Secure payment processing through certified providers</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">Contact Us</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                If you have any questions about this Privacy Policy, please
                contact us:
              </p>
              <div className="bg-sky-mist p-4 rounded-lg">
                <p>
                  <strong>Email:</strong> privacy@picklepro.in
                </p>
                <p>
                  <strong>Phone:</strong> +91 98765 43210
                </p>
                <p>
                  <strong>Address:</strong> Mumbai, Maharashtra, India
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
