import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { AudioChip } from "@/components/AudioChip";
import { APP_DOMAIN } from "@/config/domains";
import {
  Heart,
  Phone,
  Shield,
  Users,
  Clock,
  MessageCircle,
  CheckCircle,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import conversationImg from "@assets/07dfffcd-d96d-43de-a157-fce812f07ed4 (1)_1759002401463.png";
import lauraImg from "@assets/larah_1759080723474.jpeg";
import marcusImg from "@assets/marcus_1759080723474.jpeg";
import jamesImg from "@assets/james_1759080723473.jpeg";
import msWalkerImg from "@assets/ms-walker-image-frontpage_1759172802980.png";
import msWalkerLargeImg from "@assets/c683ee8f-11de-4c6d-b2a3-b1a01d9d3b39_1759174275328.png";
import voiceIntroAudio from "@assets/voice-intro-homepage_1759172807483.mp3";

export default function Landing() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Laura Ellis",
      role: "daughter",
      content:
        "Elder Care AI calls Mom every morning. She laughs more now. I get a quick summary and real peace of mind.",
      rating: 5,
      image: lauraImg,
    },
    {
      name: "Marcus Hill",
      role: "son",
      content:
        "Dad hates apps, but he answers the phone. The AI remembers his stories and keeps him talking. I can breathe again.",
      rating: 5,
      image: marcusImg,
    },
    {
      name: "James Hayes",
      role: "facility care manager",
      content:
        "We piloted it on one wing. Fewer lonely afternoons, calmer residents, and a clear dashboard. Setup was simple.",
      rating: 5,
      image: jamesImg,
    },
  ];

  const benefits = [
    "No apps or devices needed - just regular phone calls",
    "Personalized conversations based on interests and health",
    "Emergency contact alerts for concerning responses",
    "Detailed family updates and insights",
    "24/7 support whenever you need it",
  ];

  const howItWorksSteps = [
    {
      step: "1",
      title: "Simple Setup",
      description:
        "Tell us about your loved one's interests, preferences, and health needs in a quick 5-minute setup.",
    },
    {
      step: "2",
      title: "Schedule Calls",
      description:
        "Choose the best times for calls - daily, weekly, or custom schedules that work for their routine.",
    },
    {
      step: "3",
      title: "AI Calls Begin",
      description:
        "Our caring AI companion starts making regular calls, building rapport and providing meaningful conversations.",
    },
    {
      step: "4",
      title: "Stay Connected",
      description:
        "Receive insights, alerts, and summaries to stay informed about your loved one's wellbeing and mood.",
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              🎉 Now accepting new families
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Compassionate AI Calls
              <br />
              <span className="text-blue-600">for Seniors</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Keep your elderly loved ones connected and engaged with regular,
              caring phone calls from Elder Voice. No apps, no devices - just
              meaningful conversations that reduce isolation and give families
              peace of mind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a href={`${APP_DOMAIN}/getstarted`}>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
                  data-testid="button-start-trial"
                >
                  Start 7-Day Trial
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </a>
              <Link href="/individuals">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 h-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              ✓ 7-day free trial • ✓ No setup fees • ✓ Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Value + Proof Section with Background Image */}
      <section
        className="py-20 min-h-[600px] relative overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50"
        style={{
          maxHeight: "700px",
        }}
      >
        {/* Background image - only visible on large screens */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{
            backgroundImage: `url(${msWalkerLargeImg})`,
            backgroundPosition: "bottom right",
            backgroundSize: "auto 100%",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        {/* Gradient overlay for better text readability - only on large screens */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-blue-50/95 via-blue-50/90 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Value Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px]">
            {/* Content Box - Full width on mobile, constrained on large screens */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-lg w-full lg:max-w-lg">
              <p className="text-[#2962EB] font-medium text-sm uppercase tracking-wide mb-4">
                A friendly call that fits their day
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                A real conversation that brightens the week
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Elder Voice calls on a schedule you choose and talks like a
                familiar friend. No apps to learn. Just pick a voice, set the
                times, and we take it from there.
              </p>

              {/* Checklist */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle
                    className="text-green-500 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-gray-700">
                    Natural, caring conversations
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle
                    className="text-green-500 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-gray-700">
                    Flexible schedule you control
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle
                    className="text-green-500 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-gray-700">Private by design</span>
                </div>
              </div>

              {/* Audio Chip */}
              <AudioChip
                src={voiceIntroAudio}
                label="Hear what it sounds like"
                duration={13}
                className="mt-6"
              />
            </div>

            {/* Right Side - Empty space for background image on large screens */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple setup process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((item, index) => (
              <div key={index} className="relative">
                <Card className="text-center p-6 h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="text-gray-300" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center lg:order-1">
              <img
                src={conversationImg}
                alt="Senior having a friendly phone conversation with AI companion"
                className="w-full max-w-md h-auto"
                data-testid="img-conversation"
              />
            </div>
            <div className="lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Everything Your Family Needs
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our AI companion service is designed with seniors and their
                families in mind, providing comprehensive care and connection
                without complexity.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle
                      className="text-green-500 mt-0.5 flex-shrink-0"
                      size={20}
                    />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Families Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from families who trust Elder Voice
            </p>
          </div>

          <div className="max-w-6xl mx-auto relative">
            {/* Desktop - Show all 3 */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full"
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Stars */}
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="text-yellow-400 fill-current"
                          size={16}
                        />
                      ))}
                    </div>

                    {/* Review Text - Flexible space */}
                    <blockquote className="text-gray-700 italic text-sm leading-relaxed flex-grow mb-6">
                      "{testimonial.content}"
                    </blockquote>

                    {/* Profile Section - Fixed at bottom */}
                    <div className="flex items-center space-x-4 mt-auto">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-200 shadow-md flex-shrink-0">
                        <img
                          src={testimonial.image}
                          alt={`${testimonial.name} profile`}
                          className="w-full h-full object-cover"
                          data-testid={`img-testimonial-${index}`}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-base">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tablet - Show 2 with carousel */}
            <div className="hidden md:block lg:hidden">
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 50}%)` }}
                  >
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="w-1/2 flex-shrink-0 px-3">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                          <CardContent className="p-6 h-full flex flex-col">
                            <div className="flex mb-4">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="text-yellow-400 fill-current"
                                  size={16}
                                />
                              ))}
                            </div>
                            <blockquote className="text-gray-700 italic text-sm leading-relaxed flex-grow mb-6">
                              "{testimonial.content}"
                            </blockquote>
                            <div className="flex items-center space-x-4 mt-auto">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-200 shadow-md flex-shrink-0">
                                <img
                                  src={testimonial.image}
                                  alt={`${testimonial.name} profile`}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-testimonial-${index}`}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-base">
                                  {testimonial.name}
                                </div>
                                <div className="text-sm text-gray-600 capitalize">
                                  {testimonial.role}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation arrows for tablet */}
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-prev-testimonial"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() =>
                    setCurrentIndex(
                      Math.min(testimonials.length - 2, currentIndex + 1),
                    )
                  }
                  disabled={currentIndex >= testimonials.length - 2}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-next-testimonial"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Mobile - Show 1 with carousel */}
            <div className="block md:hidden">
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="w-full flex-shrink-0 px-2">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                          <CardContent className="p-6 h-full flex flex-col">
                            <div className="flex mb-4">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="text-yellow-400 fill-current"
                                  size={16}
                                />
                              ))}
                            </div>
                            <blockquote className="text-gray-700 italic text-sm leading-relaxed flex-grow mb-6">
                              "{testimonial.content}"
                            </blockquote>
                            <div className="flex items-center space-x-4 mt-auto">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-200 shadow-md flex-shrink-0">
                                <img
                                  src={testimonial.image}
                                  alt={`${testimonial.name} profile`}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-testimonial-${index}`}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-base">
                                  {testimonial.name}
                                </div>
                                <div className="text-sm text-gray-600 capitalize">
                                  {testimonial.role}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation arrows for mobile */}
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-prev-testimonial-mobile"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() =>
                    setCurrentIndex(
                      Math.min(testimonials.length - 1, currentIndex + 1),
                    )
                  }
                  disabled={currentIndex >= testimonials.length - 1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-next-testimonial-mobile"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dots indicator for mobile */}
              <div className="flex justify-center space-x-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-blue-600" : "bg-blue-300"
                    }`}
                    data-testid={`dot-testimonial-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Bring Joy to Your Loved One?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of families who have already discovered the peace of
            mind that comes with knowing their loved ones have a caring
            companion just a phone call away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`${APP_DOMAIN}/getstarted`}>
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-4 h-auto"
                data-testid="button-get-started"
              >
                Get Started
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </a>
            <Link href="/individuals">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            ✓ No credit card required • ✓ Setup takes under 5 minutes • ✓ Cancel
            anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
