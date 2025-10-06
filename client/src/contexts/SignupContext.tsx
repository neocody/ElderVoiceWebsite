import { createContext, useContext, useState, ReactNode } from "react";

// Types for the signup flow
export type UserType = "myself" | "loved-one" | "care-facility";
export type VerificationMethod = "phone" | "email";

export interface PersonalInfo {
  // For "myself" flow
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  dateOfBirth?: string;

  // For "loved one" flow
  nickname?: string;
  relationship?: string;

  // Common
  phone?: string;
  email?: string;
  acceptTerms?: boolean;
}

export interface CaregiverInfo {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface Personalization {
  interests?: string;
  aboutText?: string;
}

export interface CallPreferences {
  days: string[]; // ['monday', 'tuesday', etc.]
  timeOfDay: "morning" | "afternoon" | "evening"; // For backward compatibility
  defaultTime?: string; // 24-hour format like '14:00'
  customTimes?: Record<string, string>; // day -> time mapping
}

export interface SignupData {
  userType: UserType | null;
  verificationMethod: VerificationMethod | null;
  userId: string | null;
  elderlyUserId: number | null;
  personalInfo: PersonalInfo;
  caregiverInfo: CaregiverInfo;
  personalization: Personalization;
  callPreferences: CallPreferences;
  currentStep: number;
  isVerified: boolean;
  verificationToken?: string;
  subscriptionId?: string;
  customerId?: string;
}

interface SignupContextType {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetFlow: () => void;
}

const initialData: SignupData = {
  userType: null,
  verificationMethod: null,
  userId: null,
  elderlyUserId: null,
  personalInfo: {},
  caregiverInfo: {},
  personalization: {},
  callPreferences: {
    days: [],
    timeOfDay: "afternoon",
    defaultTime: "14:00",
    customTimes: {},
  },
  currentStep: 1,
  isVerified: false,
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SignupData>(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eldervoice_signup_data");
      if (saved) {
        try {
          return { ...initialData, ...JSON.parse(saved) };
        } catch {
          // Invalid data, use initial
        }
      }
    }
    return initialData;
  });

  const updateData = (updates: Partial<SignupData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates };
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("eldervoice_signup_data", JSON.stringify(newData));
      }
      return newData;
    });
  };

  const nextStep = () => {
    updateData({ currentStep: data.currentStep + 1 });
  };

  const prevStep = () => {
    updateData({ currentStep: Math.max(1, data.currentStep - 1) });
  };

  const goToStep = (step: number) => {
    updateData({ currentStep: step });
  };

  const resetFlow = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eldervoice_signup_data");
    }
    setData(initialData);
  };

  return (
    <SignupContext.Provider
      value={{
        data,
        updateData,
        nextStep,
        prevStep,
        goToStep,
        resetFlow,
      }}
    >
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
