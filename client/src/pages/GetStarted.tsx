import { SignupProvider, useSignup } from "@/contexts/SignupContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

// Import step components
import UserTypeSelection from "@/components/signup/UserTypeSelection";
import VerificationStep from "@/components/signup/VerificationStep";
import PersonalInfoStep from "@/components/signup/PersonalInfoStep";
import PersonalizationStep from "@/components/signup/PersonalizationStep";
import CallPreferencesStep from "@/components/signup/CallPreferencesStep";
import CheckoutStep from "@/components/signup/CheckoutStep";
import SuccessStep from "@/components/signup/SuccessStep";
import CaregiverInfoStep from "@/components/signup/CaregiverInfoStep";

function GetStartedContent() {
  const { data, prevStep, resetFlow, updateData } = useSignup();

  // Check for Stripe session_id and advance to success step
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const successStep = data.userType === "loved-one" ? 8 : 7;

    if (sessionId && data.currentStep !== successStep) {
      updateData({ currentStep: successStep });
    }
  }, [data.currentStep, data.userType, updateData]);

  const renderStep = () => {
    if (data.userType === "loved-one") {
      switch (data.currentStep) {
        case 1:
          return <UserTypeSelection />;
        case 2:
          return <VerificationStep />;
        case 3:
          return <CaregiverInfoStep />;
        case 4:
          return <PersonalInfoStep />;
        case 5:
          return <PersonalizationStep />;
        case 6:
          return <CallPreferencesStep />;
        case 7:
          return <CheckoutStep />;
        case 8:
          return <SuccessStep />;
        default:
          return <UserTypeSelection />;
      }
    }

    switch (data.currentStep) {
      case 1:
        return <UserTypeSelection />;
      case 2:
        return <VerificationStep />;
      case 3:
        return <PersonalInfoStep />;
      case 4:
        return <PersonalizationStep />;
      case 5:
        return <CallPreferencesStep />;
      case 6:
        return <CheckoutStep />;
      case 7:
        return <SuccessStep />;
      default:
        return <UserTypeSelection />;
    }
  };

  // Progress indicator
  const totalSteps = data.userType === "loved-one" ? 8 : 7;
  const currentStep = Math.min(data.currentStep, totalSteps);
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rose-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <Link href="/" className="text-xl font-bold text-blue-600">
                ElderVoice
              </Link>
            </div>

            {/* Progress indicator */}
            {data.currentStep > 1 && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Reset button for testing */}
            {process.env.NODE_ENV === "development" && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFlow}
                className="text-gray-500"
              >
                Reset Flow
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Flex grow to push footer to bottom */}
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Content */}
          <div className="min-h-[500px]">{renderStep()}</div>
        </div>
      </div>

      {/* Sticky Footer with matching gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-rose-50 border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Have questions?{" "}
              <a
                href="mailto:hello@eldervoice.com"
                className="text-blue-600 hover:underline"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GetStarted() {
  return (
    <SignupProvider>
      <GetStartedContent />
    </SignupProvider>
  );
}
