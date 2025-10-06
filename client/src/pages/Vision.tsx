import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketingLayout from "@/components/MarketingLayout";
import { Link } from "wouter";
import { 
  Heart, 
  Users, 
  Shield, 
  Target,
  Globe,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Handshake,
  Sparkles,
  Phone,
  Clock
} from "lucide-react";

export default function Vision() {
  const values = [
    {
      icon: <Heart className="text-red-500" size={32} />,
      title: "Compassion First",
      description: "Every interaction is designed with genuine care and empathy, treating each senior with the dignity and respect they deserve."
    },
    {
      icon: <Shield className="text-blue-500" size={32} />,
      title: "Privacy & Trust",
      description: "We safeguard personal information with enterprise-grade security, ensuring conversations remain private and confidential."
    },
    {
      icon: <Users className="text-green-500" size={32} />,
      title: "Family Connection",
      description: "We believe technology should strengthen family bonds, not replace them, by enabling better communication and understanding."
    },
    {
      icon: <Target className="text-purple-500" size={32} />,
      title: "Meaningful Impact",
      description: "Our focus is on creating real, measurable improvements in the daily lives of seniors and their families."
    }
  ];

  const whyItMatters = [
    {
      icon: <Phone className="text-blue-600" size={24} />,
      title: "Consistent Connection",
      description: "Regular, predictable conversations that seniors can count on, reducing isolation and loneliness."
    },
    {
      icon: <Sparkles className="text-purple-600" size={24} />,
      title: "Personalized Care",
      description: "AI that learns and remembers preferences, creating genuinely meaningful conversations tailored to each individual."
    },
    {
      icon: <Clock className="text-green-600" size={24} />,
      title: "Always Available",
      description: "Round-the-clock companionship that works around busy schedules and never misses a call."
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            🎯 Our Vision
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight" data-testid="text-hero-title">
            A World Where No Senior
            <br />
            <span className="text-blue-600">Feels Alone</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            We're building a future where every senior has access to daily companionship through 
            caring, intelligent AI-powered phone calls that understand, remember, and genuinely engage.
          </p>
          <Link href="/getstarted">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
              data-testid="button-join-mission"
            >
              Join Our Mission
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To eliminate loneliness among seniors by providing consistent, caring, and intelligent 
                companionship through advanced AI technology that understands, remembers, and genuinely cares.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We envision a world where every senior has access to daily companionship, where families 
                can focus on love instead of worry, and where technology serves humanity's most fundamental 
                need: connection.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                ElderVoice is more than a service—it's a movement to redefine how we care for our aging 
                population, using AI not to replace human connection, but to amplify and extend it.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why It Matters</h3>
              <div className="space-y-6">
                {whyItMatters.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-blue-100 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide every decision we make and every conversation our AI companions have
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{value.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Future We're Building */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">The Future We're Building</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive platform that transforms how families and facilities provide care and companionship to seniors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">For Families</h3>
                <p className="text-gray-600">
                  Peace of mind knowing your loved ones receive daily companionship, with insights into their 
                  wellbeing and mood delivered right to you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="text-purple-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">For Facilities</h3>
                <p className="text-gray-600">
                  Scalable companionship solutions that enhance resident satisfaction and support staff 
                  with better insights into resident engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">For Seniors</h3>
                <p className="text-gray-600">
                  A friendly voice that calls regularly, remembers their stories, and provides genuine 
                  conversation without judgment or rush.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Commitment to You</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Lightbulb className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Continuous Innovation</h3>
                    <p className="text-gray-600 text-sm">We constantly improve our AI companions based on user feedback and the latest research in aging and companionship.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Handshake className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Transparent Partnership</h3>
                    <p className="text-gray-600 text-sm">We maintain open communication with families and healthcare providers about our capabilities and limitations.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Globe className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Accessible Care</h3>
                    <p className="text-gray-600 text-sm">We work to make our service accessible to all families, regardless of location or economic circumstances.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Why Families Choose ElderVoice</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-gray-700">Built with care and empathy for seniors and their families</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-gray-700">Enterprise-grade security protecting sensitive information</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-gray-700">Dedicated support from real people who understand caregiving</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-gray-700">Transparent pricing with no hidden fees or surprises</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-gray-700">Continuous improvement based on family feedback</span>
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
            Join Our Mission to End Senior Loneliness
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Become part of a movement that's transforming senior care through compassionate technology. 
            Together, we can ensure no senior feels alone.
          </p>
          <Link href="/getstarted">
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
              data-testid="button-get-started"
            >
              Get Started Today
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
