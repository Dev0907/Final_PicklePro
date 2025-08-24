import React from "react";
import {
  FileText,
  Users,
  CreditCard,
  Shield,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { Footer } from "../components/Footer";

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-deep-navy mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using PicklePro services.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Acceptance of Terms
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                By accessing and using PicklePro, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                User Responsibilities
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>As a user of PicklePro, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Respect other users and maintain good sportsmanship</li>
                <li>Honor your match commitments and bookings</li>
                <li>Follow venue rules and regulations</li>
                <li>
                  Not use the service for any illegal or unauthorized purpose
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Payments and Refunds
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>Payment terms and conditions:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  All payments are processed securely through third-party
                  providers
                </li>
                <li>
                  Subscription fees are billed monthly or annually as selected
                </li>
                <li>
                  Venue booking fees are charged at the time of reservation
                </li>
                <li>Refunds are subject to our cancellation policy</li>
                <li>
                  Tournament entry fees are non-refundable unless the event is
                  cancelled
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Cancellation Policy
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>Cancellation terms:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Match cancellations: 24 hours notice required</li>
                <li>Venue bookings: Cancellation policy varies by venue</li>
                <li>
                  Subscription cancellations: Can be cancelled anytime,
                  effective at period end
                </li>
                <li>
                  Tournament registrations: Subject to tournament-specific
                  policies
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Limitation of Liability
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                PicklePro provides the platform to connect players and venues.
                We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Injuries or accidents during matches or at venues</li>
                <li>Disputes between players or with venue operators</li>
                <li>Quality of venue facilities or services</li>
                <li>Loss of personal property</li>
                <li>Service interruptions or technical issues</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-ocean-teal mr-3" />
              <h2 className="text-2xl font-bold text-deep-navy">
                Modifications to Terms
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                We reserve the right to modify these terms at any time. Users
                will be notified of significant changes via email or through the
                platform. Continued use of the service after modifications
                constitutes acceptance of the new terms.
              </p>
            </div>
          </section>

          <section>
            <div className="bg-sky-mist p-6 rounded-lg">
              <h3 className="text-xl font-bold text-deep-navy mb-4">
                Contact Information
              </h3>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong> legal@picklepro.in
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
