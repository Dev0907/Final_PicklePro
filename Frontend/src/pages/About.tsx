import React from "react";

export const About: React.FC = () => {
  const founders = [
    {
      name: "Dev Parikh",
      bio: "Passionate pickleball player and tech enthusiast. Dev brings 5 years of software development experience and a love for creating seamless user experiences.",
    },
    {
      name: "Yug Panchal",
      bio: "Former professional tennis player turned pickleball advocate. Yug understands the competitive spirit and community aspects that make racquet sports special.",
    },
    {
      name: "Jay Parmar",
      bio: "Sports analytics expert and data scientist. Jay's expertise in AI and machine learning powers our game analysis features.",
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-whisper py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
            About PicklePro
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built by passionate players for passionate players. We're
            revolutionizing how pickleball enthusiasts connect, compete, and
            improve their game.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-sky-mist rounded-xl p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-deep-navy mb-6 text-center">
            Our Mission
          </h2>
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
          <h2 className="text-3xl font-bold text-deep-navy text-center mb-12">
            Meet Our Founders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
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
                  <h3 className="text-xl font-semibold text-deep-navy mb-4">
                    {founder.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{founder.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-deep-navy mb-4">
              Community First
            </h3>
            <p className="text-gray-600">
              We believe pickleball is more than just a sport - it's about
              building connections, fostering friendships, and creating a
              supportive community where everyone can thrive.
            </p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-deep-navy mb-4">
              Seamless Experience
            </h3>
            <p className="text-gray-600">
              From finding matches to booking premium venues, we make every
              aspect of your pickleball journey effortless with real-time
              availability and instant confirmations.
            </p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-deep-navy mb-4">
              Innovation & Excellence
            </h3>
            <p className="text-gray-600">
              We're constantly pushing the boundaries of what's possible with
              technology to enhance your pickleball experience, from AI-powered
              analytics to seamless venue management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
