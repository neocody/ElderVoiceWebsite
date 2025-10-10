import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone } from "lucide-react";
import { Link } from "wouter";

type VerificationContactFormProps = {
  selectedMethod: "phone" | "email";
  contactInfo: string;
  onContactChange: (value: string) => void;
  onBack: () => void;
  onSend: () => void;
  isLoading: boolean;
  isMethodValid: boolean;
};

export function VerificationContactForm({
  selectedMethod,
  contactInfo,
  onContactChange,
  onBack,
  onSend,
  isLoading,
  isMethodValid,
}: VerificationContactFormProps) {
  const isPhone = selectedMethod === "phone";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {isPhone ? (
            <Phone className="h-6 w-6 text-blue-600" />
          ) : (
            <Mail className="h-6 w-6 text-green-600" />
          )}
          {isPhone ? "Enter Your Phone Number" : "Enter Your Email Address"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="contact">
            {isPhone ? "Phone Number" : "Email Address"}
          </Label>
          <Input
            id="contact"
            type={isPhone ? "tel" : "email"}
            placeholder={isPhone ? "(555) 123-4567" : "you@example.com"}
            value={contactInfo}
            onChange={(event) => onContactChange(event.target.value)}
            className="text-lg"
            maxLength={isPhone ? 14 : 254}
            data-testid={`input-${selectedMethod}`}
          />
          {isPhone && (
            <p className="text-sm text-gray-500 mt-1">
              Standard messaging rates may apply. Sender, Inverse Collective LLC.
            </p>
          )}
        </div>

        {isPhone && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              By clicking Send Code, you agree to receive a one time SMS from
              Inverse Collective LLC to verify your identity. One message per
              request. Msg and data rates may apply. Reply STOP to cancel, HELP
              for help. By continuing you agree to our{" "}
              <Link href="/terms-of-service">
                <span className="text-blue-600 hover:text-blue-700 underline cursor-pointer">
                  Terms
                </span>
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy">
                <span className="text-blue-600 hover:text-blue-700 underline cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              .
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={onSend}
            disabled={!isMethodValid || isLoading}
            className="flex-1"
            data-testid="button-send-verification"
          >
            {isLoading ? "Sending..." : isPhone ? "Send Code" : "Send Email"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
