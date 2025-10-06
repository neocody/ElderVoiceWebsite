import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MarketingLayout from "@/components/MarketingLayout";
import { 
  HelpCircle, 
  Phone, 
  Shield, 
  CreditCard,
  Settings,
  ArrowRight,
  MessageSquare,
  Clock
} from "lucide-react";

export default function FAQs() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <Settings className="text-blue-600" size={20} />,
      faqs: [
        {
          question: "How quickly can we get started?",
          answer: "You can set up AI Companion in about 5 minutes. After creating your account and providing details about your loved one, the first call typically happens within 24 hours. Our system is designed for immediate implementation with no complex setup required."
        },
        {
          question: "Do we need any special equipment or apps?",
          answer: "No special equipment is needed. AI Companion works with any standard telephone - landline or mobile phone. Your loved one doesn't need to download apps, learn new technology, or change their routine. We call them on their existing phone number."
        },
        {
          question: "What information do you need to get started?",
          answer: "We need basic contact information, preferred call times, and details about your loved one's interests, health considerations, and family members. This helps our AI companion personalize conversations from the very first call."
        },
        {
          question: "Can we try it before committing?",
          answer: "Yes! We offer a 7-day free trial with full access to all features. No credit card is required to start the trial, and you can cancel anytime during the trial period with no charges."
        }
      ]
    },
    {
      title: "How It Works",
      icon: <Phone className="text-green-600" size={20} />,
      faqs: [
        {
          question: "How does the AI companion know what to talk about?",
          answer: "Our AI learns from the initial profile you create, including interests, hobbies, family members, health concerns, and conversation preferences. It remembers details from previous calls and asks relevant follow-up questions, creating natural, flowing conversations."
        },
        {
          question: "What if my loved one doesn't want to answer the phone?",
          answer: "We introduce the AI companion gradually and respectfully. The first call explains who we are and asks permission to continue. If they prefer not to receive calls, we can adjust the schedule, change the approach, or pause the service until they're ready."
        },
        {
          question: "How long are the calls?",
          answer: "Typical calls last 10-20 minutes, but the length varies based on your loved one's preference and engagement level. The AI companion follows their lead - some enjoy brief check-ins while others prefer longer conversations."
        },
        {
          question: "What happens if there's an emergency during a call?",
          answer: "Our AI is trained to recognize emergency situations and distress signals. If concerns are detected, we immediately contact designated emergency contacts and, if necessary, emergency services. We also provide clear instructions for your loved one to get immediate help."
        }
      ]
    },
    {
      title: "Privacy & Security",
      icon: <Shield className="text-purple-600" size={20} />,
      faqs: [
        {
          question: "Is my loved one's information secure?",
          answer: "Yes. We use enterprise-grade security to protect all personal information and conversations. Data is encrypted both in transit and at rest, and we never share or sell personal information to third parties."
        },
        {
          question: "Are the conversations recorded?",
          answer: "Conversations are processed in real-time for AI response generation, but full recordings are not stored long-term unless specifically requested for quality assurance. We maintain conversation summaries and key insights for family reports while protecting privacy."
        },
        {
          question: "Who has access to the conversation information?",
          answer: "Only you (the account holder) and authorized family members you designate can access conversation summaries and reports. Our support team may access limited information for technical assistance, but all staff undergo strict privacy training."
        },
        {
          question: "Can we delete information if we want to stop the service?",
          answer: "Absolutely. You can request deletion of all stored information at any time. Upon cancellation, we can permanently delete the account and all associated data within 30 days, in compliance with data protection regulations."
        }
      ]
    },
    {
      title: "Pricing & Plans",
      icon: <CreditCard className="text-orange-600" size={20} />,
      faqs: [
        {
          question: "How much does AI Companion cost?",
          answer: "Individual plans start at $29/month for daily calls or $19/month for weekly calls. We also offer family plans and facility pricing. All plans include conversation summaries, emergency monitoring, and 24/7 support. No setup fees or long-term contracts required."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees. The monthly subscription includes all features: calls, family reports, emergency monitoring, and customer support. The only additional charges might be for premium features like more frequent reporting or additional family member access."
        },
        {
          question: "Can we change or cancel our plan?",
          answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes take effect on your next billing cycle. If you cancel, you'll continue to receive service through the end of your paid period."
        },
        {
          question: "Do you offer discounts for multiple family members?",
          answer: "Yes! We offer family discounts when multiple siblings share the cost of care for a parent. We also have special pricing for healthcare facilities and financial assistance programs for qualifying families."
        }
      ]
    },
    {
      title: "Family Communication",
      icon: <MessageSquare className="text-red-600" size={20} />,
      faqs: [
        {
          question: "How do we receive updates about the calls?",
          answer: "You'll receive weekly email summaries with conversation highlights, mood observations, and any important information shared. For urgent matters, we send immediate alerts via email and text message to all authorized family members."
        },
        {
          question: "Can multiple family members receive updates?",
          answer: "Yes! You can add multiple family members to receive reports and alerts. This helps keep everyone informed and coordinated about your loved one's wellbeing, reducing miscommunication between siblings and caregivers."
        },
        {
          question: "What if we disagree with something in the report?",
          answer: "We welcome feedback and take any concerns seriously. You can contact our support team to discuss report contents, request clarification, or provide additional context that might help us better understand your loved one's situation."
        },
        {
          question: "Can we request more or less frequent updates?",
          answer: "Absolutely. You can customize the frequency and detail level of reports to match your family's preferences. Some families prefer brief daily summaries, while others want comprehensive weekly reports."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <Clock className="text-indigo-600" size={20} />,
      faqs: [
        {
          question: "What if there are technical issues with calls?",
          answer: "Our system monitors call quality and connection issues in real-time. If technical problems occur, we automatically retry the call and notify you. Our support team is available 24/7 to resolve any issues quickly."
        },
        {
          question: "What if my loved one's phone number changes?",
          answer: "Simply log into your account and update the phone number, or contact our support team. We can usually make the change immediately, and the next scheduled call will go to the new number."
        },
        {
          question: "How do you handle busy signals or voicemail?",
          answer: "If the line is busy, we'll retry the call a few minutes later. If the call goes to voicemail, the AI companion leaves a brief, friendly message and notes this in your family report. We can adjust retry settings based on your preferences."
        },
        {
          question: "Is customer support really available 24/7?",
          answer: "Yes! Our support team is available around the clock because we know that concerns about elderly loved ones don't follow business hours. You can reach us by phone, email, or chat at any time."
        }
      ]
    }
  ];

  const quickAnswers = [
    {
      question: "Is there a free trial?",
      answer: "Yes, 7 days free with no credit card required"
    },
    {
      question: "Works with any phone?",
      answer: "Yes, landline or mobile - no apps needed"
    },
    {
      question: "How quickly can we start?",
      answer: "First call within 24 hours of setup"
    },
    {
      question: "Can we cancel anytime?",
      answer: "Yes, no long-term contracts or cancellation fees"
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            ❓ Frequently Asked Questions
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Everything You Need to Know
            <br />
            <span className="text-blue-600">About AI Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get answers to common questions about our AI companion service, from getting started 
            to privacy and security. Can't find what you're looking for? Our support team is here to help 24/7.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/contact'}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
          >
            Still Have Questions?
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </section>

      {/* Quick Answers */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Answers</h2>
            <p className="text-gray-600">Common questions answered at a glance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAnswers.map((item, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="p-6">
                  <HelpCircle className="text-blue-600 mx-auto mb-3" size={32} />
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Detailed Questions & Answers</h2>
            <p className="text-xl text-gray-600">
              Comprehensive answers organized by topic to help you understand everything about our service
            </p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    {category.icon}
                    <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, faqIndex) => (
                      <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`}>
                        <AccordionTrigger className="text-left text-gray-900 hover:text-blue-600">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is available 24/7 to answer any questions and help you get started
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <Phone className="text-blue-600 mx-auto mb-4" size={32} />
                <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600 text-sm mb-3">Speak with a care specialist</p>
                <p className="text-blue-600 font-medium">(555) 123-4567</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <MessageSquare className="text-blue-600 mx-auto mb-4" size={32} />
                <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-3">Get instant answers online</p>
                <Button size="sm" variant="outline">Start Chat</Button>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <HelpCircle className="text-blue-600 mx-auto mb-4" size={32} />
                <h3 className="font-semibold text-gray-900 mb-2">Contact Form</h3>
                <p className="text-gray-600 text-sm mb-3">Send us your questions</p>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/contact'}>
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-6">
              Start your free 7-day trial today and see how AI Companion can bring peace of mind to your family
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}