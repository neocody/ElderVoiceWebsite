import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Phone,
  Shield,
} from "lucide-react";

export type PlanDetails = {
  name: string;
  trialDays: number;
  monthlyPrice: number;
  features: string[];
};

type PlanSummaryProps = {
  isLovedOneFlow: boolean;
  firstName: string;
  planDetails: PlanDetails;
  callScheduleSummary: string;
  onPrev: () => void;
};

export function PlanSummary({
  isLovedOneFlow,
  firstName,
  planDetails,
  callScheduleSummary,
  onPrev,
}: PlanSummaryProps) {
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6">
          <CreditCard className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Complete Your
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            {" "}
            Subscription
          </span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Start your free trial and begin companion calls for{" "}
          <span className="font-semibold text-gray-800">{firstName}</span>
        </p>
      </div>

      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <Phone className="h-6 w-6" />
            {planDetails.name}
          </CardTitle>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900 text-lg">
                {isLovedOneFlow
                  ? "Their call schedule"
                  : "Your call schedule"}
              </span>
            </div>
            <div className="text-gray-700 text-base leading-relaxed ml-13">
              {callScheduleSummary}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {planDetails.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
              >
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800 text-sm font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-2">
                Bank-Level Security
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your payment information is encrypted and secure. We use Stripe
                — trusted by millions of businesses worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onPrev}
          className="px-8 py-3 text-base font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
        >
          ← Previous
        </Button>
      </div>
    </div>
  );
}
