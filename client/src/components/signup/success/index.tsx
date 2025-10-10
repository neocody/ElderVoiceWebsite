import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Mail, MessageCircle, Phone } from "lucide-react";
import { ConsentNotice } from "./consentNotice";
import { NextStepsCard, type NextStep } from "./nextStepsCard";
import { SuccessActions } from "./actions";
import { SuccessFooter } from "./footer";
import { SuccessHeader } from "./header";
import { SupportInfoCard } from "./supportInfoCard";
import { TrialInfoCard } from "./trialInfoCard";
import { useCheckoutSessionStatus } from "./useCheckoutSessionStatus";

export default function SuccessStep() {
  const { data, updateData } = useSignup();
  const { toast } = useToast();
  useCheckoutSessionStatus({ updateData, toast });

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  const getCallScheduleSummary = () => {
    const dayCount = data.callPreferences.days?.length || 0;
    const timeOfDay = data.callPreferences.timeOfDay || "afternoon";

    if (dayCount === 1) return `1 call per week in the ${timeOfDay}`;
    if (dayCount === 7) return `Daily calls in the ${timeOfDay}`;
    return `${dayCount} calls per week in the ${timeOfDay}`;
  };

  const nextSteps: NextStep[] = isLovedOneFlow
    ? [
        {
          icon: <Phone className="h-5 w-5 text-blue-600" />,
          title: "First Call Within 24 Hours",
          description: `${firstName} will receive their first companion call within 24 hours to introduce the service and confirm preferences.`,
        },
        {
          icon: <MessageCircle className="h-5 w-5 text-green-600" />,
          title: "Consent Verification",
          description: `During the first call, we'll ensure ${firstName} is comfortable with the service and wants to continue receiving calls.`,
        },
        {
          icon: <Mail className="h-5 w-5 text-purple-600" />,
          title: "Family Updates",
          description:
            "You'll receive weekly email summaries about the calls, including conversation highlights and any concerns.",
        },
        {
          icon: <Calendar className="h-5 w-5 text-orange-600" />,
          title: "Adjust Schedule Anytime",
          description:
            "Use your account dashboard to modify call times, frequency, or conversation topics as needed.",
        },
      ]
    : [
        {
          icon: <Phone className="h-5 w-5 text-blue-600" />,
          title: "First Call Within 24 Hours",
          description:
            "You'll receive your first companion call within 24 hours to introduce the service and confirm your preferences.",
        },
        {
          icon: <MessageCircle className="h-5 w-5 text-green-600" />,
          title: "Personalized Conversations",
          description:
            "Each call will be tailored to your interests and preferences, creating meaningful and engaging conversations.",
        },
        {
          icon: <Mail className="h-5 w-5 text-purple-600" />,
          title: "Your Account Dashboard",
          description:
            "Access your account anytime to view call history, update preferences, or adjust your schedule.",
        },
        {
          icon: <Calendar className="h-5 w-5 text-orange-600" />,
          title: "Adjust Anytime",
          description:
            "Change your call schedule, conversation topics, or service preferences whenever you need to.",
        },
      ];

  const supportInfo = {
    phone: "(555) 123-4567",
    email: "hello@eldervoice.com",
    hours: "24/7 support available",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SuccessHeader isLovedOneFlow={isLovedOneFlow} firstName={firstName} />
      <TrialInfoCard
        isLovedOneFlow={isLovedOneFlow}
        callScheduleSummary={getCallScheduleSummary()}
      />
      <NextStepsCard steps={nextSteps} />
      {isLovedOneFlow && <ConsentNotice firstName={firstName} />}
      <SupportInfoCard info={supportInfo} />
      <SuccessActions />
      <SuccessFooter isLovedOneFlow={isLovedOneFlow} firstName={firstName} />
    </div>
  );
}
