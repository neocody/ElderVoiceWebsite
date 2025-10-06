import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSignup } from "@/contexts/SignupContext";
import { Heart, User, Building2, ArrowRight } from "lucide-react";
import FacilityContactForm from "@/components/FacilityContactForm";

export default function UserTypeSelection() {
  const { updateData, nextStep } = useSignup();
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);

  const handleUserTypeSelect = (userType: 'myself' | 'loved-one' | 'care-facility') => {
    if (userType === 'care-facility') {
      // Open facility contact form modal
      setFacilityModalOpen(true);
      return;
    }

    updateData({ userType });
    nextStep();
  };

  const userTypes = [
    {
      id: 'myself',
      title: 'Myself',
      description: 'I want regular AI companion calls for myself',
      icon: <User className="h-8 w-8 text-blue-600" />,
      color: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
      popular: false,
      showTrial: true
    },
    {
      id: 'loved-one',
      title: 'A loved one',
      description: 'I want to set up calls for a family member or friend',
      icon: <Heart className="h-8 w-8 text-rose-600" />,
      color: 'border-rose-200 hover:border-rose-300 hover:bg-rose-50',
      popular: true,
      showTrial: true
    },
    {
      id: 'care-facility',
      title: 'Care Facility',
      description: 'I represent a healthcare facility or assisted living',
      icon: <Building2 className="h-8 w-8 text-purple-600" />,
      color: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
      popular: false,
      showTrial: false
    }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Who is ElderVoice for?
        </h1>
        <p className="text-lg text-gray-600">
          Choose the option that best describes your situation
        </p>
      </div>

      {/* User Type Cards */}
      <div className="space-y-4">
        {userTypes.map((type) => (
          <Card 
            key={type.id}
            className={`relative cursor-pointer transition-all duration-200 ${type.color}`}
            onClick={() => handleUserTypeSelect(type.id as any)}
            data-testid={`card-user-type-${type.id}`}
          >
            {type.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-rose-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            {type.showTrial && (
              <div className="absolute top-0 right-4 -translate-y-1/2 z-10 pointer-events-none" data-testid={`badge-trial-${type.id}`}>
                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium ring-2 ring-white shadow-md flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  7-day free trial
                </div>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {type.title}
                    </h3>
                    <p className="text-gray-600">
                      {type.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Facility Contact Form Modal */}
      <FacilityContactForm 
        open={facilityModalOpen}
        onOpenChange={setFacilityModalOpen}
      />
    </div>
  );
}