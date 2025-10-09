import { Card, CardContent } from "@/components/ui/card";
import { Heart, User } from "lucide-react";

type TrialInfoCardProps = {
  isLovedOneFlow: boolean;
  callScheduleSummary: string;
};

export function TrialInfoCard({
  isLovedOneFlow,
  callScheduleSummary,
}: TrialInfoCardProps) {
  return (
    <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {isLovedOneFlow ? (
              <Heart className="h-6 w-6 text-rose-600" />
            ) : (
              <User className="h-6 w-6 text-blue-600" />
            )}
            <h3 className="text-xl font-semibold text-gray-900">
              {isLovedOneFlow ? "Their Call Schedule" : "Your Call Schedule"}
            </h3>
          </div>
          <div className="text-lg text-gray-700 mb-2">
            <strong>{callScheduleSummary}</strong>
          </div>
          <div className="text-sm text-gray-600">
            <strong>Free for 7 days</strong> • Then $19.95/month • Cancel
            anytime
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
