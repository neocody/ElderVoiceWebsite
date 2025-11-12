import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type UserType = "individual" | "loved-one" | "myself";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  zipCode: string;
  dateOfBirth: string;
  nickname: string;
  relationship: string;
  phone: string;
  acceptTerms: boolean;
  email?: string;
}

export interface CaregiverInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface Personalization {
  interests: string;
  aboutText: string;
}

export interface CallPreferences {
  preferredDays: string[];
  preferredTime: string;
  frequency: string;
  days?: string[];
  defaultTime?: string;
  customTimes?: Record<string, string>;
  timeOfDay?: string;
}

export interface SignupData {
  userType: UserType | null;
  currentStep: number;
  verificationMethod: "phone" | "email" | null;
  personalInfo: PersonalInfo;
  caregiverInfo: CaregiverInfo;
  personalization: Personalization;
  callPreferences: CallPreferences;
  userId?: string;
  elderlyUserId?: string;
  isVerified?: boolean;
  verificationToken?: string;
}

const initialData: SignupData = {
  userType: null,
  currentStep: 1,
  verificationMethod: null,
  personalInfo: {
    firstName: "",
    lastName: "",
    zipCode: "",
    dateOfBirth: "",
    nickname: "",
    relationship: "",
    phone: "",
    acceptTerms: false,
  },
  caregiverInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationship: "",
  },
  personalization: {
    interests: "",
    aboutText: "",
  },
  callPreferences: {
    preferredDays: [],
    preferredTime: "",
    frequency: "",
  },
};

interface SignupContextType {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetFlow: () => void;
}

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SignupData>(initialData);

  const updateData = useCallback((updates: Partial<SignupData>) => {
    setData((prev) => ({
      ...prev,
      ...updates,
      personalInfo: { ...prev.personalInfo, ...(updates.personalInfo || {}) },
      caregiverInfo: { ...prev.caregiverInfo, ...(updates.caregiverInfo || {}) },
      personalization: { ...prev.personalization, ...(updates.personalization || {}) },
      callPreferences: { ...prev.callPreferences, ...(updates.callPreferences || {}) },
    }));
  }, []);

  const nextStep = useCallback(() => {
    setData((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setData(initialData);
  }, []);

  return (
    <SignupContext.Provider value={{ data, updateData, nextStep, prevStep, resetFlow }}>
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error("useSignup must be used within a SignupProvider");
  }
  return context;
}

