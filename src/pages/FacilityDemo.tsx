import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { ArrowLeft, Building2, Calendar, CheckCircle } from 'lucide-react';

export default function FacilityDemo() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    facilityName: '',
    facilityType: '',
    phone: '',
    email: '',
    facilitySize: '',
    currentSolution: '',
    timeline: '',
    specificNeeds: '',
    preferredContactMethod: 'email',
    contactTime: 'business-hours',
    acceptUpdates: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIsSubmitted(true);
      toast({
        title: "Demo request submitted!",
        description: "We'll contact you within 24 hours to schedule your personalized demo.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank you for your interest!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We've received your demo request for <strong>{formData.facilityName}</strong>. 
              Our team will contact you within 24 hours to schedule your personalized demonstration.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Review of your facility's specific needs</li>
                <li>• Customized demo showcasing relevant features</li>
                <li>• Discussion of implementation timeline</li>
                <li>• Pricing and pilot program options</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">
                  Return to Homepage
                </Button>
              </Link>
              <Link href="/facilities">
                <Button>
                  Learn More About Our Solutions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/getstarted">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign Up
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <Link href="/" className="text-xl font-bold text-blue-600">
                ElderVoice
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Request a Facility Demo
            </h1>
            <p className="text-lg text-gray-600">
              See how ElderVoice can enhance resident care and engagement at your facility
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Your Personalized Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Administrator, Director of Nursing"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    data-testid="input-title"
                  />
                </div>

                {/* Facility Information */}
                <div>
                  <Label htmlFor="facilityName">Facility Name *</Label>
                  <Input
                    id="facilityName"
                    value={formData.facilityName}
                    onChange={(e) => handleInputChange('facilityName', e.target.value)}
                    required
                    data-testid="input-facility-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facilityType">Facility Type *</Label>
                    <Select value={formData.facilityType} onValueChange={(value) => handleInputChange('facilityType', value)}>
                      <SelectTrigger data-testid="select-facility-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assisted-living">Assisted Living</SelectItem>
                        <SelectItem value="nursing-home">Nursing Home</SelectItem>
                        <SelectItem value="memory-care">Memory Care</SelectItem>
                        <SelectItem value="senior-center">Senior Center</SelectItem>
                        <SelectItem value="home-health">Home Health Agency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="facilitySize">Number of Residents *</Label>
                    <Select value={formData.facilitySize} onValueChange={(value) => handleInputChange('facilitySize', value)}>
                      <SelectTrigger data-testid="select-facility-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-25">1-25 residents</SelectItem>
                        <SelectItem value="26-50">26-50 residents</SelectItem>
                        <SelectItem value="51-100">51-100 residents</SelectItem>
                        <SelectItem value="101-200">101-200 residents</SelectItem>
                        <SelectItem value="200+">200+ residents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      maxLength={14}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <Label htmlFor="currentSolution">Current Engagement Solutions</Label>
                  <Input
                    id="currentSolution"
                    placeholder="What do you currently use for resident engagement?"
                    value={formData.currentSolution}
                    onChange={(e) => handleInputChange('currentSolution', e.target.value)}
                    data-testid="input-current-solution"
                  />
                </div>

                <div>
                  <Label htmlFor="specificNeeds">Specific Needs or Challenges</Label>
                  <Textarea
                    id="specificNeeds"
                    placeholder="Tell us about your facility's specific needs or challenges we should address in the demo"
                    value={formData.specificNeeds}
                    onChange={(e) => handleInputChange('specificNeeds', e.target.value)}
                    rows={3}
                    data-testid="textarea-specific-needs"
                  />
                </div>

                {/* Contact Preferences */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                    <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)}>
                      <SelectTrigger data-testid="select-contact-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="either">Either</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeline">Implementation Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                      <SelectTrigger data-testid="select-timeline">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Within 30 days</SelectItem>
                        <SelectItem value="short">1-3 months</SelectItem>
                        <SelectItem value="medium">3-6 months</SelectItem>
                        <SelectItem value="long">6+ months</SelectItem>
                        <SelectItem value="exploring">Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptUpdates"
                    checked={formData.acceptUpdates}
                    onCheckedChange={(checked) => handleInputChange('acceptUpdates', !!checked)}
                    data-testid="checkbox-accept-updates"
                  />
                  <Label htmlFor="acceptUpdates" className="text-sm leading-5">
                    I would like to receive updates about ElderVoice features and healthcare technology insights
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  data-testid="button-submit-demo"
                >
                  {isSubmitting ? 'Submitting...' : 'Request Demo'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Questions? Email <a href="mailto:hello@eldervoice.com" className="text-blue-600 hover:underline">hello@eldervoice.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}