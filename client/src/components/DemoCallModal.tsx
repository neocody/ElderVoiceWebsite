import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Calendar, Clock, User } from "lucide-react";

interface DemoCallModalProps {
  open: boolean;
  onClose: () => void;
}

interface DemoCallFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  preferredTime: string;
  timeZone: string;
  numberOfPatients: string;
  currentSolution: string;
  specificNeeds: string;
  urgency: string;
}

export function DemoCallModal({ open, onClose }: DemoCallModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<DemoCallFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    preferredTime: "",
    timeZone: "",
    numberOfPatients: "",
    currentSolution: "",
    specificNeeds: "",
    urgency: "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: DemoCallFormData) => {
      return apiRequest("POST", "/api/demo-call-request", data);
    },
    onSuccess: () => {
      toast({
        title: "Demo Call Requested",
        description: "Thank you! We'll contact you within 24 hours to schedule your demo call.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        preferredTime: "",
        timeZone: "",
        numberOfPatients: "",
        currentSolution: "",
        specificNeeds: "",
        urgency: "",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
      console.error("Demo call request error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, email, and phone).",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof DemoCallFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="text-blue-600" size={24} />
            Schedule Your Demo Call
          </DialogTitle>
          <DialogDescription className="text-base">
            Let's discuss how our AI companion service can benefit your elderly loved ones or facility. 
            Fill out this form and we'll contact you within 24 hours to schedule a personalized demo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User size={18} />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company/Facility</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Golden Years Healthcare"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Your Role</Label>
              <Select onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family_member">Family Member</SelectItem>
                  <SelectItem value="caregiver">Professional Caregiver</SelectItem>
                  <SelectItem value="facility_manager">Facility Manager</SelectItem>
                  <SelectItem value="administrator">Healthcare Administrator</SelectItem>
                  <SelectItem value="director">Care Director</SelectItem>
                  <SelectItem value="social_worker">Social Worker</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduling Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={18} />
              Scheduling Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Select onValueChange={(value) => handleInputChange("preferredTime", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select onValueChange={(value) => handleInputChange("timeZone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ET">Eastern Time (ET)</SelectItem>
                    <SelectItem value="CT">Central Time (CT)</SelectItem>
                    <SelectItem value="MT">Mountain Time (MT)</SelectItem>
                    <SelectItem value="PT">Pacific Time (PT)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="urgency">Timeline</Label>
              <Select onValueChange={(value) => handleInputChange("urgency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="When do you need to implement this?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediately (within 1 week)</SelectItem>
                  <SelectItem value="soon">Soon (within 1 month)</SelectItem>
                  <SelectItem value="planning">Planning phase (1-3 months)</SelectItem>
                  <SelectItem value="exploring">Just exploring options</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Needs Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone size={18} />
              Your Needs
            </h3>
            
            <div>
              <Label htmlFor="numberOfPatients">Number of Elderly Individuals</Label>
              <Select onValueChange={(value) => handleInputChange("numberOfPatients", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How many people need this service?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-20">6-20 people</SelectItem>
                  <SelectItem value="21-100">21-100 people</SelectItem>
                  <SelectItem value="100+">100+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currentSolution">Current Solution</Label>
              <Textarea
                id="currentSolution"
                value={formData.currentSolution}
                onChange={(e) => handleInputChange("currentSolution", e.target.value)}
                placeholder="What solution are you currently using for elderly care communication? (if any)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="specificNeeds">Specific Needs & Questions</Label>
              <Textarea
                id="specificNeeds"
                value={formData.specificNeeds}
                onChange={(e) => handleInputChange("specificNeeds", e.target.value)}
                placeholder="Tell us about your specific needs, challenges, or questions about our AI companion service..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-w-[120px]"
            >
              {submitMutation.isPending ? "Submitting..." : "Schedule Demo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}