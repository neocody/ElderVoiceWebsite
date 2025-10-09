import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Mail, Phone } from "lucide-react";

type VerificationMethodSelectionProps = {
  onSelect: (method: "phone" | "email") => void;
  onPrevious: () => void;
};

export function VerificationMethodSelection({
  onSelect,
  onPrevious,
}: VerificationMethodSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card
          className="cursor-pointer border-2 hover:border-blue-300 hover:bg-blue-50 transition-all"
          onClick={() => onSelect("phone")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Phone className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Phone Verification
                  </h3>
                  <p className="text-gray-600">
                    We'll send you a text message with a verification code
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 hover:border-green-300 hover:bg-green-50 transition-all"
          onClick={() => onSelect("email")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Mail className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Email Verification
                  </h3>
                  <p className="text-gray-600">
                    We'll send you an email with a verification link
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
      </div>
    </div>
  );
}
