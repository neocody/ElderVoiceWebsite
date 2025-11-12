import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketingLayout from "@/components/MarketingLayout";
import { APP_DOMAIN } from "@/config/domains";
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  Shield, 
  Heart, 
  Bell,
  Users,
  BarChart3,
  CheckCircle,
  Zap,
  Brain,
  Calendar,
  ArrowRight
} from "lucide-react";

export default function Features() {
  const coreFeatures = [
    {
      icon: <Phone className="text-blue-600" size={32} />,
      title: "Regular AI Calls",
      description: "Scheduled daily or weekly phone calls that provide consistent companionship and check-ins for your loved ones.",
      benefits: [
        "Customizable call frequency and timing",
        "Natural conversation flow",
        "No apps or devices required",
        "Works with any standard phone"
      ]
    },
    {
      icon: <MessageCircle className="text-green-600" size={32} />,
      title: "Personalized Conversations",
      description: "AI companions that remember personal details, interests, and preferences to create meaningful, engaging conversations.",
      benefits: [
        "Remembers family members and pets",
        "Discusses hobbies and interests",
        "Adapts conversation style to personality",
        "Learns and improves over time"
      ]
    },
    {
      icon: <Bell className="text-orange-600" size={32} />,
      title: "Medication Reminders",
      description: "Gentle, caring reminders for medications, appointments, and important daily activities to support health routines.",
      benefits: [
        "Customizable reminder schedules",
        "Gentle, non-intrusive approach",
        "Tracks acknowledgment",
        "Emergency contact alerts if needed"
      ]
    },
    {
      icon: <Shield className="text-purple-600" size={32} />,
      title: "Health Monitoring",
      description: "Intelligent conversation analysis to detect changes in mood, health concerns, or emergency situations.",
      benefits: [
        "Mood and wellbeing tracking",
        "Emergency phrase recognition",
        "Health concern alerts",
        "Family notification system"
      ]
    }
  ];

  const advancedFeatures = [
    {
      icon: <BarChart3 className="text-blue-600" size={24} />,
      title: "Family Insights",
      description: "Detailed weekly reports about conversations, mood patterns, and overall wellbeing for family members.",
      highlight: "Popular"
    },
    {
      icon: <Calendar className="text-green-600" size={24} />,
      title: "Flexible Scheduling",
      description: "Easy-to-use scheduling system that adapts to changing routines and preferences.",
      highlight: "Easy Setup"
    },
    {
      icon: <Brain className="text-purple-600" size={24} />,
      title: "AI Learning",
      description: "Continuously improving conversations based on preferences and feedback.",
      highlight: "Smart"
    },
    {
      icon: <Users className="text-orange-600" size={24} />,
      title: "Multi-Family Support",
      description: "Connect multiple family members to receive updates and manage care together.",
      highlight: "Collaborative"
    },
    {
      icon: <Zap className="text-yellow-600" size={24} />,
      title: "Instant Alerts",
      description: "Real-time notifications for emergencies or concerning conversation patterns.",
      highlight: "Peace of Mind"
    },
    {
      icon: <Clock className="text-red-600" size={24} />,
      title: "24/7 Availability",
      description: "Round-the-clock system monitoring with emergency response capabilities.",
      highlight: "Always On"
    }
  ];

  const comparisonFeatures = [
    { feature: "Regular phone calls", aiCompanion: true, traditional: false, homecare: true },
    { feature: "24/7 availability", aiCompanion: true, traditional: false, homecare: false },
    { feature: "Personalized conversations", aiCompanion: true, traditional: false, homecare: true },
    { feature: "Medication reminders", aiCompanion: true, traditional: false, homecare: true },
    { feature: "Family updates", aiCompanion: true, traditional: false, homecare: false },
    { feature: "Emergency detection", aiCompanion: true, traditional: false, homecare: true },
    { feature: "No setup required", aiCompanion: true, traditional: true, homecare: false },
    { feature: "Cost-effective", aiCompanion: true, traditional: true, homecare: false },
    { feature: "Scalable", aiCompanion: true, traditional: false, homecare: false }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            ✨ Comprehensive Care Features
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for
            <br />
            <span className="text-blue-600">Senior Care & Companionship</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our AI companion platform combines cutting-edge technology with genuine care 
            to provide comprehensive support for elderly loved ones and peace of mind for families.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = `${APP_DOMAIN}/getstarted`}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
          >
            Start Free Trial
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Core Features</h2>
            <p className="text-xl text-gray-600">
              Essential tools for comprehensive elderly care and family connection
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-start space-x-3">
                        <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Advanced Capabilities</h2>
            <p className="text-xl text-gray-600">
              Powerful features that set AI Companion apart from traditional care options
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow relative">
                <CardContent className="p-6">
                  {feature.highlight && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white">
                      {feature.highlight}
                    </Badge>
                  )}
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How We Compare</h2>
            <p className="text-xl text-gray-600">
              See how AI Companion stacks up against traditional care options
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">AI Companion</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Traditional Check-ins</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Home Care</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonFeatures.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {row.aiCompanion ? (
                          <CheckCircle className="text-green-500 mx-auto" size={20} />
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.traditional ? (
                          <CheckCircle className="text-green-500 mx-auto" size={20} />
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.homecare ? (
                          <CheckCircle className="text-green-500 mx-auto" size={20} />
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Integration & Security */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Secure & Reliable
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built with enterprise-grade security and reliability standards to protect 
                your family's privacy and ensure consistent service.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                    <p className="text-sm text-gray-600">All conversations and data are protected with enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">99.9% Uptime</h3>
                    <p className="text-sm text-gray-600">Reliable service with redundant systems and 24/7 monitoring</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Privacy First</h3>
                    <p className="text-sm text-gray-600">Your family's conversations and data are never shared or sold</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Setup Process</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-gray-700">Create account and add loved one's details</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-gray-700">Set call preferences and schedule</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-gray-700">First AI companion call within 24 hours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span className="text-gray-700">Receive first family update report</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Experience All These Features?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial today and see how AI Companion can transform 
            the care and connection for your loved ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => window.location.href = '/api/login'}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 h-auto"
            >
              View All Plans
            </Button>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            ✓ 7-day free trial • ✓ No credit card required • ✓ Full feature access
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}