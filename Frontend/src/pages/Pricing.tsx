import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Pricing: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're a casual player or running a pickleball club, we have the perfect plan for your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-deep-navy text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-deep-navy mb-3">
                Can I switch plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-deep-navy mb-3">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes, Pro Player and Club Owner plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-deep-navy mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, and net banking for Indian customers.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-deep-navy mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};