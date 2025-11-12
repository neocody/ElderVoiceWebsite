import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Send,
  CheckCircle,
  Loader2
} from "lucide-react";

const facilityInquirySchema = z.object({
  facilityName: z.string().min(1, "Facility name is required"),
  facilityType: z.string().min(1, "Please select facility type"),
  numberOfResidents: z.string().min(1, "Number of residents required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s()+-]+$/, "Please enter a valid phone number"),
  timeline: z.string().min(1, "Please select timeline"),
  message: z.string().min(10, "Please tell us about your needs"),
  agreeToContact: z.boolean().refine(val => val, "You must agree to be contacted"),
});

type FacilityInquiryForm = z.infer<typeof facilityInquirySchema>;

interface FacilityContactFormProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FacilityContactForm({ trigger, open, onOpenChange }: FacilityContactFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FacilityInquiryForm>({
    resolver: zodResolver(facilityInquirySchema),
    defaultValues: {
      facilityName: "",
      facilityType: "",
      numberOfResidents: "",
      contactName: "",
      email: "",
      phone: "",
      timeline: "",
      message: "",
      agreeToContact: false,
    },
  });

  const handleSubmit = async (data: FacilityInquiryForm) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/facility-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Request Received!",
          description: "Thank you! We'll follow up within 24 business hours.",
        });
        form.reset();
        
        // Close modal after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      toast({
        title: "Unable to Submit",
        description: "Please contact us at hello@eldervoice.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setIsOpen(false);
    }
    setIsSuccess(false);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
    if (!newOpen) {
      setIsSuccess(false);
      form.reset();
    }
  };

  const currentOpen = open !== undefined ? open : isOpen;
  const isControlled = open !== undefined;

  const defaultTrigger = (
    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-facility-contact">
      Request More Information
    </Button>
  );

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Thank You!
            </DialogTitle>
            <p className="text-gray-600 text-lg">
              We've received your message and will follow up within 24 business hours.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Request Facility Information
              </DialogTitle>
              <p className="text-center text-gray-600 mt-2">
                Tell us about your facility and we'll create a customized solution
              </p>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Two column grid for basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facilityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Facility Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Sunrise Senior Living" 
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-facility-name" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facilityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Facility Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500" data-testid="select-facility-type">
                              <SelectValue placeholder="Select facility type" className="text-gray-500" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nursing_home">Nursing Home</SelectItem>
                            <SelectItem value="assisted_living">Assisted Living</SelectItem>
                            <SelectItem value="memory_care">Memory Care</SelectItem>
                            <SelectItem value="independent_living">Independent Living</SelectItem>
                            <SelectItem value="continuing_care">Continuing Care Community</SelectItem>
                            <SelectItem value="adult_day_care">Adult Day Care</SelectItem>
                            <SelectItem value="home_care_agency">Home Care Agency</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfResidents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Number of Residents *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500" data-testid="select-number-residents">
                              <SelectValue placeholder="Select range" className="text-gray-500" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-25">1-25 residents</SelectItem>
                            <SelectItem value="26-50">26-50 residents</SelectItem>
                            <SelectItem value="51-100">51-100 residents</SelectItem>
                            <SelectItem value="101-200">101-200 residents</SelectItem>
                            <SelectItem value="200+">200+ residents</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Timeline *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500" data-testid="select-timeline">
                              <SelectValue placeholder="When are you looking to implement?" className="text-gray-500" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate (Within 1 month)</SelectItem>
                            <SelectItem value="quarter">This Quarter (1-3 months)</SelectItem>
                            <SelectItem value="half_year">Next 6 months</SelectItem>
                            <SelectItem value="year">Within the year</SelectItem>
                            <SelectItem value="exploring">Just exploring</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Your Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Jane Smith" 
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-contact-name" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-semibold text-base">Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="jane@facility.com" 
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-email" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-gray-900 font-semibold text-base">Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 20);
                              field.onChange(value);
                            }}
                            type="tel"
                            placeholder="(555) 123-4567" 
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-phone" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Message */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-semibold text-base">What would you like to know? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us about your facility's needs or questions..."
                          rows={4}
                          className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 resize-none"
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terms Agreement */}
                <FormField
                  control={form.control}
                  name="agreeToContact"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="checkbox-agree"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-900 font-medium text-sm">
                          I agree to be contacted by ElderVoice regarding facility solutions. *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                    data-testid="button-submit-facility-form"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={18} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2" size={18} />
                        Request Information
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
