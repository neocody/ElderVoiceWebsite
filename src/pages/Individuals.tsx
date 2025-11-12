import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketingLayout from "@/components/MarketingLayout";
// import { Link } from "wouter";
import { APP_DOMAIN } from "@/config/domains";
import { 
  Heart, 
  Clock, 
  Shield, 
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Star,
  Calendar,
  Smile,
  BarChart3
} from "lucide-react";
// import elderlyPhoneImage from "@assets/stock_images/happy_elderly_person_71ecd06f.jpg";
import familyTimeImage from "@assets/stock_images/family_spending_qual_8d460831.jpg";
// import caringChildImage from "@assets/stock_images/caring_adult_child_w_37c0a1f7.jpg";

export default function Individuals() {
  const familyBenefits = [
    {
      icon: <Heart className="text-red-500" size={32} />,
      title: "Peace of Mind",
      description: "Know your loved one has regular, caring companionship even when you can't be there.",
      details: [
        "Daily or weekly check-ins ensure they're never alone",
        "Immediate alerts if concerning patterns are detected",
        "Regular updates keep you informed about their wellbeing",
        "24/7 monitoring provides constant reassurance"
      ]
    },
    {
      icon: <Clock className="text-blue-500" size={32} />,
      title: "Time for Your Life",
      description: "Reduce guilt and worry while maintaining your own work-life balance and personal commitments.",
      details: [
        "No need to make daily check-in calls yourself",
        "Focus on quality time during your visits",
        "Maintain your career and personal relationships",
        "Vacation without constant worry"
      ]
    },
    {
      icon: <MessageCircle className="text-green-500" size={32} />,
      title: "Better Conversations",
      description: "When you do call, conversations are richer because basic check-ins are already handled.",
      details: [
        "Talk about meaningful topics instead of just health",
        "Share stories and memories without rushing",
        "Discuss plans and activities they're excited about",
        "Enjoy deeper emotional connections"
      ]
    },
    {
      icon: <Shield className="text-purple-500" size={32} />,
      title: "Early Problem Detection",
      description: "Catch health or mood changes early before they become serious issues.",
      details: [
        "AI detects subtle changes in speech patterns",
        "Identifies medication compliance issues",
        "Recognizes signs of depression or confusion",
        "Alerts you to schedule medical appointments"
      ]
    }
  ];

  const scenarios = [
    {
      title: "Busy Professional Parent",
      scenario: "Sarah works long hours as a nurse and has two teenagers at home. Her 78-year-old mother lives alone 3 hours away.",
      challenge: "Sarah feels guilty she can't call mom daily, and when she does call after work, she's often tired and conversations feel rushed.",
      solution: "AI Companion calls mom every morning at 9 AM. Sarah gets weekly summaries and can focus their weekend calls on quality time, planning visits, and sharing family news.",
      outcome: "Mom feels less lonely, Sarah feels less guilty, and their relationship has actually improved with better conversations."
    },
    {
      title: "Adult Child with Own Health Issues",
      scenario: "Mark is 55 and manages his own chronic illness while caring for his 82-year-old father with mild dementia.",
      challenge: "Mark worries constantly about his dad's safety and mental state, but his own health makes daily visits impossible.",
      solution: "AI Companion provides twice-daily calls with gentle cognitive exercises and medication reminders. Mark receives alerts for any concerning responses.",
      outcome: "Dad's routine is more consistent, Mark has peace of mind, and the family caught early signs of a UTI through conversation changes."
    },
    {
      title: "Long-Distance Family",
      scenario: "The Johnson siblings live in different states from their 85-year-old mother. Coordinating care and staying informed is challenging.",
      challenge: "Mom tells each sibling different things about her health, creating confusion and family tension about her actual condition.",
      solution: "All siblings receive the same weekly AI Companion reports. The system provides consistent, objective information about mom's daily wellbeing.",
      outcome: "Family communication improved dramatically with shared, reliable information. Care decisions are now made together with real data."
    }
  ];

  const testimonials = [
    {
      name: "Jennifer M.",
      role: "Daughter & Working Mom",
      content: "I used to call dad every day during my lunch break, often while dealing with work stress. Now our evening calls are so much better - we talk about his garden, my kids' activities, and plan our visits. The AI companion handles the daily check-ins, and I focus on being his daughter, not his caregiver.",
      rating: 5
    },
    {
      name: "David L.",
      role: "Son",
      content: "Living 2,000 miles away from mom was heartbreaking. The weekly reports from AI Companion help me understand her mood patterns and health changes. Last month, they caught early signs of depression after dad's anniversary passed, and I was able to arrange extra family calls and a visit.",
      rating: 5
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Tell Us About Your Loved One",
      description: "Share their interests, daily routine, health considerations, and family details in our 5-minute setup.",
      time: "5 minutes"
    },
    {
      step: "2",
      title: "Choose Call Schedule",
      description: "Select daily, weekly, or custom timing that works best for their routine and preferences.",
      time: "2 minutes"
    },
    {
      step: "3",
      title: "First Call Happens",
      description: "AI Companion introduces itself and begins building a caring relationship with your loved one.",
      time: "Within 24 hours"
    },
    {
      step: "4",
      title: "Receive Your First Report",
      description: "Get insights about the conversation, their mood, and any important information shared.",
      time: "Same day"
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              💝 For Caring Families
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Finally, Peace of Mind
              <br />
              <span className="text-blue-600">For Your Family</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop feeling guilty about not calling enough. Give your elderly loved ones the daily 
              companionship they deserve while freeing yourself to be a child, not a caregiver, 
              during your precious time together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a href={`${APP_DOMAIN}/getstarted`}>
                <Button 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
                  data-testid="button-start-caring"
                >
                  Start Caring Today
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </a>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 h-auto"
              >
                See How It Works
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              ✓ Setup takes 5 minutes • ✓ First call within 24 hours • ✓ 7-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Benefits for Families */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Transform Your Family's Care Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI Companion doesn't replace your relationship with your loved one - it enhances it by 
              handling routine check-ins so your time together can focus on what really matters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {familyBenefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </div>
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

      {/* Real Family Scenarios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Real Families, Real Solutions</h2>
            <p className="text-xl text-gray-600">
              See how AI Companion has transformed care for families in situations just like yours
            </p>
          </div>

          <div className="space-y-12">
            {scenarios.map((story, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{story.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{story.scenario}</p>
                      <div className="text-red-600 text-sm">
                        <strong>Challenge:</strong> {story.challenge}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-blue-600 mb-3">AI Companion Solution</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{story.solution}</p>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-green-600 mb-3">Outcome</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{story.outcome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Getting Started is Simple</h2>
            <p className="text-xl text-gray-600">
              From setup to first call in less than 24 hours
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <Card className="text-center p-6 h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {item.time}
                    </Badge>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="text-gray-300" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">What Families Are Saying</h2>
            <p className="text-xl text-gray-600">
              Real experiences from families who've found peace of mind
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-current" size={16} />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Limited Time Offer</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with ElderVoice today and give your loved ones the companionship they deserve
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-blue-500 shadow-2xl hover:shadow-3xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-1.5 text-sm font-bold">
                  🎉 Special Promotional Offer
                </Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-blue-600" size={40} />
                </div>
                <CardTitle className="text-3xl mb-4">ElderVoice Care</CardTitle>
                <div className="mb-2">
                  <span className="text-2xl text-gray-400 line-through mr-3">$49</span>
                  <span className="text-5xl font-bold text-blue-600">$25</span>
                  <span className="text-xl font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mt-2">Limited time promotional pricing</p>
              </CardHeader>
              <CardContent className="space-y-4 px-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm font-medium">Up to 20 minutes daily calls</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Daily family updates & insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Medication reminders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Mood & health monitoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Emergency contact alerts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Appointment reminders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <span className="text-sm">Priority support & customization</span>
                </div>
                <div className="pt-6">
                  <a href={`${APP_DOMAIN}/getstarted`} className="block">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-lg py-6" 
                      data-testid="button-start-trial"
                    >
                      Start 7-Day Free Trial
                      <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </a>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    No credit card required • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing FAQ */}
          <div className="mt-16 text-center">
            <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I change plans anytime?</h4>
                  <p className="text-sm text-gray-600">Yes, upgrade or downgrade your plan anytime. Changes take effect on your next billing cycle.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">What if my loved one doesn't answer?</h4>
                  <p className="text-sm text-gray-600">We'll try 3 times over 2 hours, then alert you. No charges for missed calls.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Is there a setup fee?</h4>
                  <p className="text-sm text-gray-600">No setup fees, activation costs, or hidden charges. Just the monthly plan price.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I cancel anytime?</h4>
                  <p className="text-sm text-gray-600">Yes, cancel anytime with no penalties. Your service continues until the end of your billing period.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Families Choose AI Companion
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Flexible Scheduling</h3>
                    <p className="text-gray-600 text-sm">Calls happen when it works for them - morning coffee, afternoon rest, or evening routine.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <BarChart3 className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Family Insights</h3>
                    <p className="text-gray-600 text-sm">Weekly summaries help you understand their mood, health, and social needs better than ever.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Smile className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Improved Relationships</h3>
                    <p className="text-gray-600 text-sm">When you call, focus on love and connection instead of just checking if they're okay.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={familyTimeImage} 
                alt="Family spending quality time with elderly loved one" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Your Peace of Mind Starts Today
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of families who have discovered the joy of worry-free caregiving. 
            Give your loved one daily companionship and give yourself the gift of peace of mind.
          </p>
          
          <a href={`${APP_DOMAIN}/getstarted`} data-testid="link-begin-trial">
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
              data-testid="button-begin-trial-cta"
            >
              Begin Your Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </a>

          <p className="text-blue-200 text-sm mt-6">
            Setup in 5 minutes • First call tomorrow • Cancel anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}