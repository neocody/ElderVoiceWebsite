import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Shield } from "lucide-react";
import { relationshipOptions } from "./utils";

type FormData = {
  firstName: string;
  lastName: string;
  zipCode: string;
  dateOfBirth: string;
  nickname: string;
  relationship: string;
  phone: string;
  acceptTerms: boolean;
};

type PersonalInfoFormProps = {
  formData: FormData;
  isLovedOneFlow: boolean;
  needsPhoneField: boolean;
  zipCodeValid: boolean;
  isLoading: boolean;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
  onSubmit: () => void;
  onPrev: () => void;
};

export function PersonalInfoForm({
  formData,
  isLovedOneFlow,
  needsPhoneField,
  zipCodeValid,
  isLoading,
  onInputChange,
  onSubmit,
  onPrev,
}: PersonalInfoFormProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-green-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="firstName">
                {isLovedOneFlow ? "Their First Name" : "Your First Name"} *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(event) =>
                  onInputChange("firstName", event.target.value)
                }
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
                onChange={(event) =>
                  onInputChange("lastName", event.target.value)
                }
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
                onChange={(event) =>
                  onInputChange("phone", event.target.value)
                }
                placeholder="(555) 123-4567"
                maxLength={14}
                data-testid="input-phone"
              />
              <p className="text-sm text-gray-500 mt-1">
                {isLovedOneFlow
                  ? "We call this number to reach your loved one."
                  : "We'll use this number for your ElderVoice companion calls."}
              </p>
            </div>
          )}

          {isLovedOneFlow && (
            <div>
              <Label htmlFor="relationship">Your relationship to them *</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => onInputChange("relationship", value)}
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

          {!isLovedOneFlow && (
            <div>
              <Label htmlFor="dateOfBirth">Your Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(event) =>
                  onInputChange("dateOfBirth", event.target.value)
                }
                max={new Date().toISOString().split("T")[0]}
                data-testid="input-date-of-birth"
              />
              <p className="text-sm text-gray-500 mt-1">
                You must be 18 or older to use this service
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(event) => onInputChange("zipCode", event.target.value)}
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

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  onInputChange("acceptTerms", !!checked)
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

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Previous
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-continue"
            >
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>All information is encrypted and stored securely</span>
        </div>
      </div>
    </>
  );
}
