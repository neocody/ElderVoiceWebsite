import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketingLayout from "@/components/MarketingLayout";
import FacilityContactForm from "@/components/FacilityContactForm";
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp,
  Clock,
  Heart,
  CheckCircle,
  ArrowRight,
  Star,
  BarChart3,
  Zap,
  UserCheck,
  FileText,
  Phone
} from "lucide-react";

export default function Facilities() {
  const facilityBenefits = [
    {
      icon: <Users className="text-blue-600" size={32} />,
      title: "Enhanced Resident Engagement",
      description: "Increase social interaction and mental stimulation for all residents with personalized AI companions.",
      metrics: "43% increase in resident satisfaction scores",
      details: [
        "Personalized conversations based on each resident's history",
        "Consistent companionship for isolated residents",
        "Memory exercises and cognitive stimulation",
        "Social connection for those with limited family visits"
      ]
    },
    {
      icon: <TrendingUp className="text-green-600" size={32} />,
      title: "Improved Health Outcomes",
      description: "Early detection of health changes and medication compliance support leads to better resident care.",
      metrics: "31% reduction in emergency interventions",
      details: [
        "Early detection of mood and cognitive changes",
        "Medication reminder support",
        "Health monitoring through conversation analysis",
        "Proactive family and staff notifications"
      ]
    },
    {
      icon: <Shield className="text-purple-600" size={32} />,
      title: "Enterprise Security",
      description: "Enterprise-grade security ensures all resident data and conversations remain private and protected.",
      metrics: "Bank-level encryption",
      details: [
        "Enterprise-grade data encryption",
        "Secure conversation storage",
        "Audit trails for reporting",
        "Regular security assessments and updates"
      ]
    },
    {
      icon: <Building2 className="text-orange-600" size={32} />,
      title: "Easy Integration",
      description: "Simple setup that works with existing systems and requires minimal staff training or technology changes.",
      metrics: "24-hour implementation",
      details: [
        "No new hardware or software installation",
        "Works with existing phone systems",
        "Minimal staff training required",
        "Seamless integration with care plans"
      ]
    }
  ];

  const facilityTypes = [
    {
      type: "Nursing Homes",
      icon: <Heart className="text-red-500" size={24} />,
      description: "Comprehensive care for residents with varying levels of medical needs",
      features: [
        "Medical monitoring and alerts",
        "Family communication support",
        "Cognitive stimulation programs",
        "24/7 emergency detection"
      ],
      pricing: "Starting at $12/resident/month"
    },
    {
      type: "Assisted Living",
      icon: <Users className="text-blue-500" size={24} />,
      description: "Independent living support with companionship and wellness monitoring",
      features: [
        "Daily wellness check-ins",
        "Social engagement activities",
        "Medication compliance support",
        "Family update reports"
      ],
      pricing: "Starting at $8/resident/month"
    },
    {
      type: "Memory Care",
      icon: <Shield className="text-purple-500" size={24} />,
      description: "Specialized support for residents with dementia and Alzheimer's",
      features: [
        "Memory stimulation exercises",
        "Behavior pattern monitoring",
        "Caregiver stress detection",
        "Personalized reminiscence therapy"
      ],
      pricing: "Starting at $15/resident/month"
    },
    {
      type: "Home Care Agencies",
      icon: <Building2 className="text-green-500" size={24} />,
      description: "Support for clients receiving care in their own homes",
      features: [
        "Remote wellness monitoring",
        "Caregiver coordination",
        "Family communication hub",
        "Emergency response system"
      ],
      pricing: "Starting at $6/client/month"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Margaret Chen",
      role: "Director of Care, Sunset Manor",
      facility: "120-bed nursing home",
      content: "AI Companion has transformed our approach to resident care. We've seen remarkable improvements in mood and engagement, especially among residents who don't receive regular family visits. The early health alerts have helped us prevent several emergency situations.",
      rating: 5
    },
    {
      name: "James Rodriguez",
      role: "Administrator, Golden Years Assisted Living",
      facility: "85-unit assisted living facility",
      content: "The implementation was incredibly smooth. Within a week, residents were looking forward to their daily calls. Families love the weekly reports, and our staff has more time to focus on hands-on care instead of constant check-ins.",
      rating: 5
    },
    {
      name: "Sarah Mitchell",
      role: "Memory Care Coordinator, Peaceful Gardens",
      facility: "40-bed memory care unit",
      content: "Working with dementia patients, we need tools that can adapt to changing cognitive abilities. AI Companion's personalized approach and gentle conversation style has been remarkable. Even residents in later stages respond positively to the familiar voice.",
      rating: 5
    }
  ];

  const complianceFeatures = [
    {
      title: "Data Security",
      description: "All conversations and data are handled with enterprise-grade security standards.",
      icon: <Shield className="text-blue-600" size={20} />
    },
    {
      title: "Audit Trails",
      description: "Complete logging of all interactions for compliance reporting and quality assurance.",
      icon: <FileText className="text-blue-600" size={20} />
    },
    {
      title: "Staff Training",
      description: "Comprehensive training materials and ongoing support for seamless implementation.",
      icon: <UserCheck className="text-blue-600" size={20} />
    },
    {
      title: "24/7 Support",
      description: "Dedicated support team available around the clock for any technical issues or questions.",
      icon: <Clock className="text-blue-600" size={20} />
    }
  ];

  const roiMetrics = [
    { metric: "43%", description: "Increase in resident satisfaction scores" },
    { metric: "31%", description: "Reduction in emergency interventions" },
    { metric: "28%", description: "Decrease in family complaint calls" },
    { metric: "52%", description: "Improvement in medication compliance" },
    { metric: "24 hrs", description: "Average implementation time" },
    { metric: "15%", description: "Reduction in staff call workload" }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              🏥 For Healthcare Facilities
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Enhance Resident Care
              <br />
              <span className="text-blue-600">with AI Companions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Improve resident satisfaction, health outcomes, and family communication 
              while reducing staff workload with our AI companion service designed 
              specifically for healthcare facilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <FacilityContactForm
                trigger={
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
                    data-testid="button-request-information"
                  >
                    Request More Information
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                }
              />
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 h-auto"
              >
                <Phone className="mr-2" size={20} />
                Call (555) 123-4567
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              ✓ 24-hour pilot program • ✓ Secure & private • ✓ No upfront costs
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Proven Results for Healthcare Facilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI companion service delivers measurable improvements in resident care, 
              satisfaction, and operational efficiency across all types of healthcare facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {facilityBenefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                        {benefit.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{benefit.title}</CardTitle>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {benefit.metrics}
                    </Badge>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {benefit.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start space-x-3">
                        <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Measurable Impact</h2>
            <p className="text-xl text-gray-600">
              Real results from healthcare facilities using AI Companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roiMetrics.map((item, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{item.metric}</div>
                  <p className="text-gray-700 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Facility Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Solutions for Every Care Setting</h2>
            <p className="text-xl text-gray-600">
              Tailored features and pricing for different types of healthcare facilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilityTypes.map((facility, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                      {facility.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{facility.type}</CardTitle>
                      <p className="text-blue-600 font-semibold text-sm">{facility.pricing}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{facility.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {facility.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance & Security */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Built for Healthcare Compliance
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform meets the strict security and compliance requirements 
                of healthcare facilities, with enterprise-grade protection for all resident data.
              </p>
              <div className="space-y-6">
                {complianceFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    {feature.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Implementation Process</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-gray-700">Initial consultation and needs assessment</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-gray-700">24-hour pilot program with select residents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-gray-700">Staff training and system integration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span className="text-gray-700">Full deployment and ongoing support</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Average implementation time:</strong> 24 hours from pilot to full deployment
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">What Healthcare Leaders Say</h2>
            <p className="text-xl text-gray-600">
              Real feedback from administrators and care coordinators
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-current" size={16} />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-blue-600">{testimonial.facility}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Resident Care?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join hundreds of healthcare facilities already using AI Companion to improve 
            resident satisfaction, health outcomes, and operational efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <FacilityContactForm 
              trigger={
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
                  data-testid="button-facility-cta-primary"
                >
                  Request More Information
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              }
            />
            <FacilityContactForm 
              trigger={
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 h-auto"
                  data-testid="button-facility-cta-secondary"
                >
                  <Phone className="mr-2" size={20} />
                  Contact Our Team
                </Button>
              }
            />
          </div>
          <p className="text-blue-200 text-sm mt-6">
            ✓ 24-hour pilot program • ✓ Custom pricing available • ✓ Dedicated support team
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}