import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketingLayout from "@/components/MarketingLayout";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Heart,
  Code,
  Users,
  TrendingUp,
  Coffee,
  Zap,
  Globe,
  Mail
} from "lucide-react";

export default function Careers() {
  const perks = [
    {
      icon: <Globe className="text-blue-600" size={24} />,
      title: "Remote-First",
      description: "Work from anywhere in the world"
    },
    {
      icon: <Clock className="text-green-600" size={24} />,
      title: "Flexible Hours",
      description: "Balance your work and life"
    },
    {
      icon: <TrendingUp className="text-purple-600" size={24} />,
      title: "Growth Opportunities",
      description: "Learn and advance your career"
    },
    {
      icon: <Heart className="text-red-600" size={24} />,
      title: "Meaningful Work",
      description: "Make a real difference in seniors' lives"
    },
    {
      icon: <Coffee className="text-orange-600" size={24} />,
      title: "Great Culture",
      description: "Collaborative and supportive team"
    },
    {
      icon: <Zap className="text-yellow-600" size={24} />,
      title: "Cutting Edge",
      description: "Work with latest AI technology"
    }
  ];

  const openPositions = [
    {
      id: "fullstack-dev",
      title: "Full-Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-Time",
      compensation: "Competitive",
      description: "Build and scale our AI-powered elder companionship platform. Work with React, Node.js, PostgreSQL, and cutting-edge AI APIs.",
      requirements: [
        "3+ years of full-stack development experience",
        "Strong proficiency in TypeScript, React, and Node.js",
        "Experience with PostgreSQL and RESTful APIs",
        "Familiarity with AI/ML APIs (OpenAI, ElevenLabs, etc.)",
        "Passion for building products that help people"
      ]
    },
    {
      id: "ai-engineer",
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-Time",
      compensation: "Competitive",
      description: "Design and optimize AI conversation systems that provide empathetic, personalized companionship to elderly users.",
      requirements: [
        "Experience with LLM integration and prompt engineering",
        "Strong Python or TypeScript background",
        "Understanding of conversational AI and NLP",
        "Experience with voice AI technologies",
        "Commitment to ethical AI development"
      ]
    },
    {
      id: "product-manager",
      title: "Product Manager",
      department: "Product",
      location: "Remote",
      type: "Full-Time",
      compensation: "Competitive",
      description: "Shape the future of elder care technology by defining features that truly matter to seniors and their families.",
      requirements: [
        "3+ years of product management experience",
        "Strong user empathy and customer discovery skills",
        "Experience in healthcare or elder care preferred",
        "Data-driven decision making",
        "Excellent communication and stakeholder management"
      ]
    },
    {
      id: "customer-success",
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-Time",
      compensation: "Competitive",
      description: "Help families and care facilities get the most out of ElderVoice, ensuring every senior receives compassionate companionship.",
      requirements: [
        "2+ years in customer success or support role",
        "Exceptional empathy and communication skills",
        "Experience working with seniors or healthcare",
        "Problem-solving mindset",
        "Comfort with technology platforms"
      ]
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            💼 Join Our Team
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Build Technology That
            <br />
            <span className="text-blue-600">Changes Lives</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join a mission-driven team using AI to eliminate loneliness among seniors. 
            Work on meaningful problems with cutting-edge technology.
          </p>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Join ElderVoice?</h2>
            <p className="text-xl text-gray-600">
              Work where innovation meets compassion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {perk.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{perk.title}</h3>
                      <p className="text-sm text-gray-600">{perk.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">
              Find your next opportunity to make an impact
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position) => (
              <Card key={position.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid={`card-job-${position.id}`}>
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                    <div className="mb-4 lg:mb-0">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2" data-testid={`text-job-title-${position.id}`}>
                        {position.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase size={16} />
                          <span>{position.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{position.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={16} />
                          <span>{position.compensation}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                      data-testid={`button-apply-${position.id}`}
                    >
                      <a href={`mailto:careers@eldervoice.com?subject=Application for ${position.title}`} data-testid={`link-apply-${position.id}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{position.description}</p>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Requirements:</h4>
                    <ul className="space-y-2">
                      {position.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Culture */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Culture</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We're a small, focused team where every person makes a significant impact. We value:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Code className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Technical Excellence</h3>
                    <p className="text-gray-600 text-sm">We ship quality code and continuously improve our craft</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">User Empathy</h3>
                    <p className="text-gray-600 text-sm">Every decision starts with understanding our users' needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Mission-Driven</h3>
                    <p className="text-gray-600 text-sm">We're here to make a real difference in people's lives</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Don't See Your Role?</h3>
              <p className="text-blue-100 mb-6 leading-relaxed">
                We're always looking for talented, mission-driven individuals. If you're passionate about 
                using technology to help seniors live better lives, we'd love to hear from you.
              </p>
              <Button 
                asChild
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
                data-testid="button-general-inquiry"
              >
                <a href="mailto:careers@eldervoice.com" data-testid="link-general-inquiry">
                  <Mail className="mr-2" size={18} />
                  Send General Inquiry
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join us in our mission to end senior loneliness through compassionate technology.
          </p>
          <Button 
            asChild
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
            data-testid="button-contact-careers"
          >
            <a href="mailto:careers@eldervoice.com" data-testid="link-contact-careers">
              <Mail className="mr-2" size={20} />
              Contact Us
            </a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
