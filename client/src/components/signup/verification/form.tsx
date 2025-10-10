import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

type VerificationCodeFormProps = {
  contactInfo: string;
  verificationCode: string;
  onCodeChange: (value: string) => void;
  onChangeContact: () => void;
  onVerify: () => void;
  onResend: () => void;
  isVerifying: boolean;
  isLoading: boolean;
  selectedMethod: "phone" | "email";
  onSkip?: () => void;
  showSkip?: boolean;
};

export function VerificationCodeForm({
  contactInfo,
  verificationCode,
  onCodeChange,
  onChangeContact,
  onVerify,
  onResend,
  isVerifying,
  isLoading,
  selectedMethod,
  onSkip,
  showSkip,
}: VerificationCodeFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Check className="h-6 w-6 text-green-600" />
          Enter Verification Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center text-gray-600">
          We sent a 6-digit code to
          <br />
          <span className="font-medium text-gray-900">{contactInfo}</span>
        </div>

        <div>
          <Label htmlFor="verificationCode">Verification Code</Label>
          <div className="mt-2 flex justify-center">
            <InputOTP
              id="verificationCode"
              maxLength={6}
              value={verificationCode}
              onChange={(value) => onCodeChange(value.replace(/\D/g, "").slice(0, 6))}
              data-testid="input-verification-code"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onChangeContact}>
            Change {selectedMethod === "phone" ? "Number" : "Email"}
          </Button>
          <Button
            onClick={onVerify}
            disabled={verificationCode.length !== 6 || isVerifying}
            className="flex-1"
            data-testid="button-verify-code"
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={onResend}
            disabled={isLoading}
            className="text-sm block"
          >
            Didn't receive a code? Resend
          </Button>

          {showSkip && onSkip && (
            <Button
              variant="link"
              onClick={onSkip}
              className="text-xs text-gray-500 block"
              data-testid="button-skip-verification"
            >
              [DEV] Skip Verification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
