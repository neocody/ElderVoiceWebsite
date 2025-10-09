import { useEffect, useState } from "react";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PersonalInfoForm } from "./form";
import { PersonalInfoHeader } from "./header";
import {
  calculateAge,
  formatPhoneInput,
  normalizePhoneNumber,
  formatZipCode,
  isZipCodeValid,
} from "./utils";

type PersonalInfoFormState = {
  firstName: string;
  lastName: string;
  zipCode: string;
  dateOfBirth: string;
  nickname: string;
  relationship: string;
  phone: string;
  acceptTerms: boolean;
};

export default function PersonalInfoStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PersonalInfoFormState>({
    firstName: data.personalInfo.firstName || "",
    lastName: data.personalInfo.lastName || "",
    zipCode: data.personalInfo.zipCode || "",
    dateOfBirth: data.personalInfo.dateOfBirth || "",
    nickname: data.personalInfo.nickname || "",
    relationship: data.personalInfo.relationship || "",
    phone: "", // Initialize as empty, don't load from previous data
    acceptTerms: data.personalInfo.acceptTerms || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [zipCodeValid, setZipCodeValid] = useState(true);

  const isLovedOneFlow = data.userType === "loved-one";
  const needsPhoneField =
    !isLovedOneFlow && data.verificationMethod === "email";

  useEffect(() => {
    if (formData.zipCode.length >= 5) {
      setZipCodeValid(isZipCodeValid(formData.zipCode));
    } else {
      setZipCodeValid(true);
    }
  }, [formData.zipCode]);

  const handleInputChange = (
    field: keyof PersonalInfoFormState,
    value: string | boolean
  ) => {
    if (field === "phone" && typeof value === "string") {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) {
        setFormData((prev) => ({ ...prev, phone: formatPhoneInput(digits) }));
      }
      return;
    }
    if (field === "zipCode" && typeof value === "string") {
      setFormData((prev) => ({ ...prev, zipCode: formatZipCode(value) }));
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
          : "Please enter your first name"
      );
    }

    if (!formData.lastName.trim()) {
      errors.push(
        isLovedOneFlow
          ? "Please enter their last name"
          : "Please enter your last name"
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

    const phoneSource = formData.phone || "";
    const phoneDigits = phoneSource.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      errors.push(
        isLovedOneFlow
          ? "Please enter a valid phone number for your loved one"
          : "Please enter a valid phone number"
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
    const normalizedPhone = normalizePhoneNumber(formData.phone);
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <PersonalInfoHeader isLovedOneFlow={isLovedOneFlow} />
      <PersonalInfoForm
        formData={formData}
        isLovedOneFlow={isLovedOneFlow}
        needsPhoneField={needsPhoneField}
        zipCodeValid={zipCodeValid}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onPrev={prevStep}
      />
    </div>
  );
}
