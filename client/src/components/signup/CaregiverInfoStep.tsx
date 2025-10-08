import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, UserPlus } from "lucide-react";

function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10) {
    if (digits.length === 11 && digits.startsWith("1")) {
      digits = digits.slice(1);
    } else {
      digits = digits.slice(-10);
    }
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export default function CaregiverInfoStep() {
  const { data, updateData, prevStep, nextStep } = useSignup();
  const { toast } = useToast();

  const needsPhone = data.verificationMethod === "email";
  const needsEmail = data.verificationMethod === "phone";
  const showPhoneInput = needsPhone || (!needsPhone && !needsEmail);
  const showEmailInput = needsEmail || (!needsPhone && !needsEmail);

  const [formData, setFormData] = useState({
    firstName:
      data.caregiverInfo.firstName || data.personalInfo.firstName || "",
    lastName: data.caregiverInfo.lastName || data.personalInfo.lastName || "",
    phone: data.caregiverInfo.phone || "",
    email: data.caregiverInfo.email || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (needsPhone && !formData.phone && data.personalInfo.phone) {
      setFormData((prev) => ({
        ...prev,
        phone: prev.phone || data.personalInfo.phone!,
      }));
    }
    if (needsEmail && !formData.email && data.personalInfo.email) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || data.personalInfo.email!,
      }));
    }
  }, [
    needsPhone,
    needsEmail,
    data.personalInfo.phone,
    data.personalInfo.email,
  ]);

  const handleInputChange = (
    field: "firstName" | "lastName" | "phone" | "email",
    value: string,
  ) => {
    if (field === "phone") {
      const formatted = formatPhone(value);
      if (formatted.length <= 14) {
        setFormData((prev) => ({ ...prev, phone: formatted }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!data.userId) {
      toast({
        title: "Please verify your account",
        description:
          "We could not find your user details. Go back and complete verification first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your first and last name.",
        variant: "destructive",
      });
      return;
    }

    const phoneForPayload =
      formData.phone || data.personalInfo.phone || undefined;
    const emailForPayload =
      formData.email || data.personalInfo.email || undefined;

    if (!phoneForPayload && !emailForPayload) {
      toast({
        title: "Contact required",
        description: "Provide at least a phone number or email address.",
        variant: "destructive",
      });
      return;
    }

    if (needsPhone && !formData.phone) {
      toast({
        title: "Phone required",
        description: "Please add your phone number so we can reach you.",
        variant: "destructive",
      });
      return;
    }

    if (needsEmail && !formData.email) {
      toast({
        title: "Email required",
        description: "Please add your email address so we can reach you.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/onboard/caregiver/profile", {
        userId: data.userId,
        caregiverFirstName: formData.firstName.trim(),
        caregiverLastName: formData.lastName.trim(),
        caregiverPhone: phoneForPayload
          ? normalizePhone(phoneForPayload)
          : undefined,
        caregiverEmail: emailForPayload?.trim() || undefined,
      });

      updateData({
        caregiverInfo: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: phoneForPayload,
          email: emailForPayload,
        },
        personalInfo: {
          ...data.personalInfo,
          phone: phoneForPayload,
          email: emailForPayload,
        },
      });

      nextStep();
    } catch (error) {
      console.error("Failed to save caregiver info", error);
      toast({
        title: "Unable to save",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <UserPlus className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tell us about yourself
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          We use these details to keep you informed about your loved one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caregiver-first-name">First name *</Label>
              <Input
                id="caregiver-first-name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="e.g., Sarah"
                data-testid="input-caregiver-first-name"
              />
            </div>
            <div>
              <Label htmlFor="caregiver-last-name">Last name *</Label>
              <Input
                id="caregiver-last-name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="e.g., Johnson"
                data-testid="input-caregiver-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showPhoneInput && (
              <div>
                <Label htmlFor="caregiver-phone">
                  {needsPhone ? "Phone number *" : "Phone number"}
                </Label>
                <Input
                  id="caregiver-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  data-testid="input-caregiver-phone"
                />
              </div>
            )}

            {showEmailInput && (
              <div>
                <Label htmlFor="caregiver-email">
                  {needsEmail ? "Email address *" : "Email address"}
                </Label>
                <Input
                  id="caregiver-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="you@example.com"
                  data-testid="input-caregiver-email"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={prevStep} disabled={isLoading}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-caregiver-continue"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
