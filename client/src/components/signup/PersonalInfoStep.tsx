import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, MapPin, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PersonalInfoStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: data.personalInfo.firstName || "",
    lastName: data.personalInfo.lastName || "",
    zipCode: data.personalInfo.zipCode || "",
    dateOfBirth: data.personalInfo.dateOfBirth || "",
    nickname: data.personalInfo.nickname || "",
    relationship: data.personalInfo.relationship || "",
    phone: data.personalInfo.phone || "",
    acceptTerms: data.personalInfo.acceptTerms || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [zipCodeValid, setZipCodeValid] = useState(true);

  const isLovedOneFlow = data.userType === "loved-one";
  const needsPhoneField =
    !isLovedOneFlow && data.verificationMethod === "email";

  useEffect(() => {
    // Validate ZIP code when it changes
    if (formData.zipCode.length >= 5) {
      validateZipCode(formData.zipCode);
    } else {
      setZipCodeValid(true); // Reset validation for partial input
    }
  }, [formData.zipCode]);

  useEffect(() => {
    if (data.personalInfo.phone) {
      setFormData((prev) => {
        if (prev.phone) return prev;
        const digits = (data.personalInfo.phone ?? "").replace(/\D/g, "");
        return {
          ...prev,
          phone: digits
            ? formatPhoneInput(digits)
            : data.personalInfo.phone || "",
        };
      });
    }
  }, [data.personalInfo.phone]);

  const validateZipCode = (zip: string) => {
    // US ZIP code validation: 5 digits, optionally followed by dash and 4 more digits
    const zipRegex = /^\d{5}(-\d{4})?$/;
    setZipCodeValid(zipRegex.test(zip));
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatPhoneInput = (value: string) => {
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
  };

  const normalizePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return `+${digits}`;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "phone" && typeof value === "string") {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) {
        setFormData((prev) => ({ ...prev, phone: formatPhoneInput(digits) }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) {
      errors.push(
        isLovedOneFlow
          ? "Please enter their first name"
          : "Please enter your first name",
      );
    }

    if (!formData.lastName.trim()) {
      errors.push(
        isLovedOneFlow
          ? "Please enter their last name"
          : "Please enter your last name",
      );
    }

    if (isLovedOneFlow && !formData.relationship.trim()) {
      errors.push("Please specify your relationship");
    }

    if (!isLovedOneFlow && !formData.dateOfBirth) {
      errors.push("Please enter your date of birth");
    }

    if (!isLovedOneFlow && formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        errors.push("You must be 18 or older to use this service");
      }
    }

    if (!formData.zipCode || formData.zipCode.length < 5) {
      errors.push("Please enter a valid ZIP code");
    }

    if (!zipCodeValid) {
      errors.push("Please enter a valid US ZIP code");
    }

    const phoneSource = formData.phone || data.personalInfo.phone || "";
    const phoneDigits = phoneSource.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      errors.push(
        isLovedOneFlow
          ? "Please enter a valid phone number for your loved one"
          : "Please enter a valid phone number",
      );
    }

    if (!formData.acceptTerms) {
      errors.push("Please accept the Terms of Service and Privacy Policy");
    }

    if (errors.length > 0) {
      toast({
        title: "Please complete all fields",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    if (!data.userId) {
      toast({
        title: "Verification required",
        description:
          "We could not find your account details. Please complete verification first.",
        variant: "destructive",
      });
      return;
    }

    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedZip = formData.zipCode.trim();
    const preferredName =
      (formData.nickname || formData.firstName).trim() || undefined;
    const normalizedPhone = normalizePhoneNumber(phoneSource);
    const formattedPhoneForContext = phoneDigits
      ? formatPhoneInput(phoneDigits)
      : "";

    const endpoint = isLovedOneFlow
      ? "/api/onboard/loved-one/profile"
      : "/api/onboard/myself/profile";

    const payload: Record<string, any> = {
      userId: data.userId,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phone: normalizedPhone,
      zipCode: trimmedZip,
      preferredName,
    };

    if (isLovedOneFlow) {
      payload.relationship = formData.relationship.trim();
    } else {
      payload.dateOfBirth = formData.dateOfBirth;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", endpoint, payload);

      const body = await response.json();

      updateData({
        elderlyUserId: body.elderlyUserId,
        personalInfo: {
          ...data.personalInfo,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          zipCode: formData.zipCode,
          dateOfBirth: formData.dateOfBirth,
          nickname: formData.nickname,
          relationship: isLovedOneFlow ? formData.relationship : undefined,
          phone: formattedPhoneForContext,
          acceptTerms: formData.acceptTerms,
        },
      });

      nextStep();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatZipCode = (value: string) => {
    // Allow digits and dash for ZIP+4 format, limit to 10 characters (12345-6789)
    const cleaned = value.replace(/[^\d-]/g, "");
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 10 && cleaned.includes("-")) {
      return cleaned;
    } else if (cleaned.length === 6 && !cleaned.includes("-")) {
      // Auto-format to ZIP+4 when 6th digit is entered
      return cleaned.slice(0, 5) + "-" + cleaned.slice(5);
    } else if (cleaned.length > 5 && !cleaned.includes("-")) {
      // Auto-format to ZIP+4 when more than 5 digits
      return cleaned.slice(0, 5) + "-" + cleaned.slice(5, 9);
    }
    return cleaned.slice(0, 10);
  };

  const relationshipOptions = [
    "Spouse/Partner",
    "Adult Child",
    "Parent",
    "Sibling",
    "Other Family Member",
    "Friend",
    "Caregiver",
    "Healthcare Professional",
    "Other",
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
          {isLovedOneFlow ? (
            <Heart className="h-7 w-7 text-rose-600" />
          ) : (
            <User className="h-7 w-7 text-blue-600" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {isLovedOneFlow
            ? "Tell us about your loved one"
            : "Tell us about yourself"}
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          {isLovedOneFlow
            ? "We need some basic information to personalize their experience"
            : "We need some basic information to get started"}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-green-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="firstName">
                {isLovedOneFlow ? "Their First Name" : "Your First Name"} *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder={isLovedOneFlow ? "e.g., Mary" : "e.g., John"}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                {isLovedOneFlow ? "Their Last Name" : "Your Last Name"} *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder={isLovedOneFlow ? "e.g., Smith" : "e.g., Doe"}
                data-testid="input-last-name"
              />
            </div>
          </div>

          {(isLovedOneFlow || needsPhoneField) && (
            <div>
              <Label htmlFor="phone">
                {isLovedOneFlow ? "Their Phone Number" : "Your Phone Number"} *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={14}
                data-testid="input-phone"
              />
              {isLovedOneFlow ? (
                <p className="text-sm text-gray-500 mt-1">
                  We call this number to reach your loved one.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this number for your ElderVoice companion calls.
                </p>
              )}
            </div>
          )}

          {/* Relationship (Loved One flow only) */}
          {isLovedOneFlow && (
            <div>
              <Label htmlFor="relationship">Your relationship to them *</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) =>
                  handleInputChange("relationship", value)
                }
              >
                <SelectTrigger data-testid="select-relationship">
                  <SelectValue placeholder="Select your relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date of Birth (Myself flow only) */}
          {!isLovedOneFlow && (
            <div>
              <Label htmlFor="dateOfBirth">Your Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                max={new Date().toISOString().split("T")[0]}
                data-testid="input-date-of-birth"
              />
              <p className="text-sm text-gray-500 mt-1">
                You must be 18 or older to use this service
              </p>
            </div>
          )}

          {/* ZIP Code */}
          <div>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) =>
                handleInputChange("zipCode", formatZipCode(e.target.value))
              }
              placeholder="12345"
              maxLength={10}
              className={
                !zipCodeValid && formData.zipCode.length >= 5
                  ? "border-red-500"
                  : ""
              }
              data-testid="input-zip-code"
            />
            {!zipCodeValid && formData.zipCode.length >= 5 && (
              <p className="text-sm text-red-600 mt-1">
                Please enter a valid US ZIP code
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              This helps us provide location-appropriate services and emergency
              contacts
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  handleInputChange("acceptTerms", !!checked)
                }
                data-testid="checkbox-accept-terms"
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-5">
                I agree to the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                {isLovedOneFlow && (
                  <span className="block mt-1 text-gray-600">
                    I confirm I have permission to set up this service for my
                    loved one
                  </span>
                )}
              </Label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Previous
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-continue"
            >
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>All information is encrypted and stored securely</span>
        </div>
      </div>
    </div>
  );
}
