import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Mail,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerificationStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<
    "phone" | "email" | null
  >(data.verificationMethod);
  const [contactInfo, setContactInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const normalizePhoneForRequest = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return digits.startsWith("+") ? digits : `+${digits}`;
  };

  const handleMethodSelect = (method: "phone" | "email") => {
    setSelectedMethod(method);
    updateData({ verificationMethod: method });
  };

  const sendVerificationCode = async () => {
    if (!contactInfo.trim()) {
      toast({
        title: "Required field",
        description:
          selectedMethod === "phone"
            ? "Please enter your phone number"
            : "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [selectedMethod === "phone" ? "phone" : "email"]: contactInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send verification");
      }

      setCodeSent(true);
      updateData({
        personalInfo: {
          ...data.personalInfo,
          [selectedMethod === "phone" ? "phone" : "email"]: contactInfo,
        },
      });

      toast({
        title: "Verification sent!",
        description:
          selectedMethod === "phone"
            ? "We've sent a 6-digit code to your phone number"
            : "We've sent a 6-digit code to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [selectedMethod === "phone" ? "phone" : "email"]: contactInfo,
          otp: verificationCode,
        }),
      });
      if (!response.ok) {
        throw new Error("Invalid code");
      }
      const dataJson = await response.json();
      setCreatedUserId(dataJson.userId);
      updateData({
        isVerified: true,
        userId: dataJson.userId,
      });
      toast({
        title: "Verified!",
        description: "Code verified. Please set your password.",
      });
    } catch (e) {
      toast({
        title: "Invalid code",
        description: "Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const submitPassword = async () => {
    if (!createdUserId) return;
    if (password.length < 8) {
      toast({
        title: "Weak password",
        description: "Minimum 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const loginIdentity: { phone?: string; email?: string } =
        selectedMethod === "phone"
          ? { phone: normalizePhoneForRequest(contactInfo) }
          : { email: contactInfo.trim().toLowerCase() };

      if (
        ("phone" in loginIdentity && !loginIdentity.phone) ||
        ("email" in loginIdentity && !loginIdentity.email)
      ) {
        toast({
          title: "Missing contact",
          description: "We need your verified contact to sign you in.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/auth/register/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createdUserId,
          password,
          ...loginIdentity,
        }),
      });
      if (!res.ok) throw new Error("Failed to set password");
      const body = await res.json();
      const session = body?.session;
      toast({
        title: "Password set",
        description: "Proceed to the next step.",
      });
      if (session?.access_token) {
        try {
          localStorage.setItem("supabase-session", JSON.stringify(session));
        } catch (error) {
          console.error("Failed to persist session", error);
        }
      }
      updateData({
        userId: createdUserId ?? data.userId,
      });
      nextStep();
    } catch (e) {
      toast({
        title: "Failed",
        description: "Could not set password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const skipVerificationForTesting = () => {
    const fallbackContact =
      contactInfo ||
      (selectedMethod === "phone" ? "(555) 123-4567" : "test@example.com");

    updateData({
      isVerified: true,
      verificationToken: "dev-skip-" + Date.now(),
      userId: data.userId || `dev-user-${Date.now()}`,
      personalInfo: {
        ...data.personalInfo,
        [selectedMethod === "phone" ? "phone" : "email"]: fallbackContact,
      },
    });

    toast({
      title: "Verification Skipped",
      description: "Development mode - proceeding without verification",
    });

    nextStep();
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handleContactInfoChange = (value: string) => {
    if (selectedMethod === "phone") {
      // Limit to 10 digits for US phone numbers
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 10) {
        const formatted = formatPhoneNumber(value);
        setContactInfo(formatted);
      }
    } else {
      // Limit email to 254 characters (RFC 5321 standard)
      if (value.length <= 254) {
        setContactInfo(value);
      }
    }
  };

  const isMethodValid = () => {
    if (selectedMethod === "phone") {
      const cleaned = contactInfo.replace(/\D/g, "");
      return cleaned.length === 10;
    } else if (selectedMethod === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);
    }
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Verify Your Identity
        </h1>
        <p className="text-lg text-gray-600">
          We need to verify your identity to ensure account security
        </p>
      </div>

      {!selectedMethod ? (
        // Method Selection
        <div className="space-y-6">
          <div className="space-y-4">
            <Card
              className="cursor-pointer border-2 hover:border-blue-300 hover:bg-blue-50 transition-all"
              onClick={() => handleMethodSelect("phone")}
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
              onClick={() => handleMethodSelect("email")}
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

          {/* Navigation */}
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
          </div>
        </div>
      ) : !codeSent ? (
        // Contact Info Collection
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {selectedMethod === "phone" ? (
                <Phone className="h-6 w-6 text-blue-600" />
              ) : (
                <Mail className="h-6 w-6 text-green-600" />
              )}
              {selectedMethod === "phone"
                ? "Enter Your Phone Number"
                : "Enter Your Email Address"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="contact">
                {selectedMethod === "phone" ? "Phone Number" : "Email Address"}
              </Label>
              <Input
                id="contact"
                type={selectedMethod === "phone" ? "tel" : "email"}
                placeholder={
                  selectedMethod === "phone"
                    ? "(555) 123-4567"
                    : "you@example.com"
                }
                value={contactInfo}
                onChange={(e) => handleContactInfoChange(e.target.value)}
                className="text-lg"
                maxLength={selectedMethod === "phone" ? 14 : 254}
                data-testid={`input-${selectedMethod}`}
              />
              {selectedMethod === "phone" && (
                <p className="text-sm text-gray-500 mt-1">
                  Standard messaging rates may apply
                </p>
              )}
            </div>

            {selectedMethod === "phone" && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  By clicking Send Code, you agree to receive a one-time SMS from Inverse Collective LLC (Elder Voice) to verify your identity. Msg & data rates may apply. Reply STOP to cancel, HELP for help.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMethod(null);
                  setContactInfo("");
                }}
              >
                Back
              </Button>
              <Button
                onClick={sendVerificationCode}
                disabled={!isMethodValid() || isLoading}
                className="flex-1"
                data-testid="button-send-verification"
              >
                {isLoading
                  ? "Sending..."
                  : selectedMethod === "phone"
                    ? "Send Code"
                    : "Send Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Code Verification or Set Password
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Check className="h-6 w-6 text-green-600" />
              {createdUserId ? "Set Your Password" : "Enter Verification Code"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!createdUserId ? (
              <>
                <div className="text-center text-gray-600">
                  We sent a 6-digit code to
                  <br />
                  <span className="font-medium text-gray-900">
                    {contactInfo}
                  </span>
                </div>

                <div>
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <div className="mt-2 flex justify-center">
                    <InputOTP
                      id="verificationCode"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) =>
                        setVerificationCode(
                          value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
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
                  <Button variant="outline" onClick={() => setCodeSent(false)}>
                    Change {selectedMethod === "phone" ? "Number" : "Email"}
                  </Button>
                  <Button
                    onClick={verifyCode}
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
                    onClick={() => sendVerificationCode()}
                    disabled={isLoading}
                    className="text-sm block"
                  >
                    Didn't receive a code? Resend
                  </Button>

                  {process.env.NODE_ENV === "development" && (
                    <Button
                      variant="link"
                      onClick={skipVerificationForTesting}
                      className="text-xs text-gray-500 block"
                      data-testid="button-skip-verification"
                    >
                      [DEV] Skip Verification
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCreatedUserId(null)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={submitPassword}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Saving..." : "Save Password"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Note */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          🔒 Your information is secure and will never be shared with third
          parties
        </p>
      </div>
    </div>
  );
}
