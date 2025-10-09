import { useState } from "react";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { VerificationContactForm } from "./contactDetailsForm";
import { VerificationCodeForm } from "./form";
import { VerificationFooter } from "./footer";
import { VerificationHeader } from "./header";
import { VerificationMethodSelection } from "./methodSelection";
import { VerificationPasswordForm } from "./passwordForm";
import {
  formatPhoneNumber,
  getPhoneDigits,
  isValidEmail,
  normalizePhoneForRequest,
} from "./utils";

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

  const handleContactInfoChange = (value: string) => {
    if (selectedMethod === "phone") {
      const digits = getPhoneDigits(value);
      if (digits.length <= 10) {
        setContactInfo(formatPhoneNumber(value));
      }
    } else {
      if (value.length <= 254) {
        setContactInfo(value);
      }
    }
  };

  const isMethodValid = () => {
    if (selectedMethod === "phone") {
      return getPhoneDigits(contactInfo).length === 10;
    }
    if (selectedMethod === "email") {
      return isValidEmail(contactInfo);
    }
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <VerificationHeader />
      {!selectedMethod ? (
        <VerificationMethodSelection
          onSelect={handleMethodSelect}
          onPrevious={prevStep}
        />
      ) : !codeSent ? (
        <VerificationContactForm
          selectedMethod={selectedMethod}
          contactInfo={contactInfo}
          onContactChange={handleContactInfoChange}
          onBack={() => {
            setSelectedMethod(null);
            setContactInfo("");
          }}
          onSend={sendVerificationCode}
          isLoading={isLoading}
          isMethodValid={isMethodValid()}
        />
      ) : createdUserId ? (
        <VerificationPasswordForm
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onBack={() => setCreatedUserId(null)}
          onSubmit={submitPassword}
          isLoading={isLoading}
        />
      ) : (
        <VerificationCodeForm
          contactInfo={contactInfo}
          verificationCode={verificationCode}
          onCodeChange={setVerificationCode}
          onChangeContact={() => setCodeSent(false)}
          onVerify={verifyCode}
          onResend={sendVerificationCode}
          isVerifying={isVerifying}
          isLoading={isLoading}
          selectedMethod={selectedMethod}
          onSkip={skipVerificationForTesting}
          showSkip={process.env.NODE_ENV === "development"}
        />
      )}
      <VerificationFooter />
    </div>
  );
}
