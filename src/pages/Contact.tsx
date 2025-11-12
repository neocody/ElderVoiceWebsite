import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_DOMAIN } from "@/config/domains";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MarketingLayout from "@/components/MarketingLayout";
import { 
  Mail, 
  ArrowRight,
  CheckCircle,
  Users
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    organizationType: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://formspree.io/f/mldpgepo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          inquiryType: formData.inquiryType,
          organizationType: formData.organizationType,
          message: formData.message,
          _subject: `Elder Voice Contact Form - ${formData.inquiryType || 'General Inquiry'}`
        }),
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "Thank you for contacting us. We'll get back to you within 2 hours.",
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          inquiryType: '',
          organizationType: '',
          message: ''
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again or contact us directly at hello@eldervoice.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email obfuscation helper - constructs mailto link to avoid spam bots
  const createMailtoLink = (user: string, domain: string) => {
    return `mailto:${user}@${domain}`;
  };

  const supportTeams = [
    {
      team: "Individual Families",
      description: "Personal care coordination and family support",
      emailUser: "hello",
      emailDomain: "eldervoice.com",
      hours: "24/7 Support"
    },
    {
      team: "Healthcare Facilities",
      description: "Implementation and facility management",
      emailUser: "healthcare",
      emailDomain: "eldervoice.com",
      hours: "Business Hours + Emergency"
    },
    {
      team: "Technical Support",
      description: "System issues and technical assistance",
      emailUser: "support",
      emailDomain: "eldervoice.com",
      hours: "24/7 Support"
    },
    {
      team: "Billing & Accounts",
      description: "Billing questions and account management",
      emailUser: "billing",
      emailDomain: "eldervoice.com",
      hours: "Monday-Friday, 8 AM - 8 PM ET"
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            📞 Get In Touch
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            We're Here to Help
            <br />
            <span className="text-blue-600">Every Step of the Way</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Whether you're ready to get started, have questions about our service, or need support 
            for your loved one, our team is available to provide the assistance you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = `${APP_DOMAIN}/getstarted`}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
              data-testid="button-start-trial"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = createMailtoLink('hello', 'eldervoice.com')}
              className="text-lg px-8 py-4 h-auto"
              data-testid="button-send-email"
            >
              <Mail className="mr-2" size={20} />
              Send Email
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-xl text-gray-600">
              Fill out the form below and we'll get back to you within 2 hours
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your full name"
                      required
                      className="mt-2"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your.email@example.com"
                      required
                      className="mt-2"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Your phone number"
                      className="mt-2"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inquiryType">Type of Inquiry *</Label>
                    <Select value={formData.inquiryType} onValueChange={(value) => setFormData({...formData, inquiryType: value})}>
                      <SelectTrigger className="mt-2" data-testid="select-inquiry-type">
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual/Family Service</SelectItem>
                        <SelectItem value="facility">Healthcare Facility</SelectItem>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                        <SelectItem value="media">Media/Press</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.inquiryType === 'facility' && (
                  <div>
                    <Label htmlFor="organizationType">Organization Type</Label>
                    <Select value={formData.organizationType} onValueChange={(value) => setFormData({...formData, organizationType: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nursing-home">Nursing Home</SelectItem>
                        <SelectItem value="assisted-living">Assisted Living</SelectItem>
                        <SelectItem value="memory-care">Memory Care</SelectItem>
                        <SelectItem value="home-care">Home Care Agency</SelectItem>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="other">Other Healthcare Facility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us about your needs, questions, or how we can help..."
                    required
                    className="mt-2 min-h-[120px]"
                    data-testid="textarea-message"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="space-y-1 text-xs">
                        <li>• We'll review your message and respond within 2 hours</li>
                        <li>• Demo requests will be scheduled within 24 hours</li>
                        <li>• You can also reach us directly via email below</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-4 h-auto"
                  data-testid="button-send-message"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  {!isSubmitting && <ArrowRight className="ml-2" size={20} />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Specialized Support Teams */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Specialized Support Teams</h2>
            <p className="text-xl text-gray-600">
              Direct access to experts who understand your specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportTeams.map((team, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Users className="text-blue-600" size={24} />
                    <span>{team.team}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{team.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{team.emailUser}@{team.emailDomain}</p>
                      <p className="text-sm text-gray-500">{team.hours}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = createMailtoLink(team.emailUser, team.emailDomain)}
                      data-testid={`button-contact-${team.team.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      Contact Team
                    </Button>
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
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Don't wait to bring peace of mind to your family. Start your free trial today 
            and experience the difference Elder Voice can make.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = `${APP_DOMAIN}/getstarted`}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
            data-testid="button-cta-start-trial"
          >
            Start Free Trial Now
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <p className="text-blue-200 text-sm mt-6">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
