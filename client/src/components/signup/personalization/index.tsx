import { useState } from "react";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InterestsSection } from "./interestsSection";
import { LifeStorySection } from "./lifeStorySection";
import { PersonalizationHeader } from "./header";

export default function PersonalizationStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    interests: data.personalization.interests || "",
    aboutText: data.personalization.aboutText || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0); // 0 = interests, 1 = life story

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveCurrentData = () => {
    // Always save current form data to context
    updateData({
      personalization: {
        interests: formData.interests,
        aboutText: formData.aboutText,
      },
    });
  };

  const handleContinueSection = () => {
    saveCurrentData();

    if (currentSection === 0) {
      // Move to next section
      setCurrentSection(1);
    } else {
      // Final submission
      handleFinalSubmit();
    }
  };

  const handleSkipSection = () => {
    saveCurrentData();

    if (currentSection === 0) {
      // Skip to call preferences (skip section 1 entirely)
      handleFinalSubmit();
    } else {
      // Skip current section and proceed to call preferences
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (!data.userId || !data.elderlyUserId) {
      toast({
        title: "Missing account details",
        description: "Please complete the earlier steps before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/onboard/personalization", {
        userId: data.userId,
        elderlyUserId: data.elderlyUserId,
        interests: formData.interests.trim() || undefined,
        aboutText: formData.aboutText.trim() || undefined,
      });

      nextStep();
    } catch (error) {
      console.error("Failed to save personalization", error);
      toast({
        title: "Error",
        description: "Failed to save information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedTopics = isLovedOneFlow
    ? [
        "Family members and their relationships, favorite memories or stories, and important people in their life including pets (current or past)",
        "Hobbies and interests like gardening, reading, cooking, crafts, sports, or other activities that bring them joy and fulfillment",
        "Career background, accomplishments, places they've lived or traveled, and entertainment preferences like favorite music, movies, or TV shows",
      ]
    : [
        "Family members you'd like to discuss, your relationships with them, and important people in your life including pets you have or have had",
        "Your hobbies, interests, and daily activities that bring you joy - whether that's gardening, reading, crafts, sports, or other pursuits",
        "Your career background, places you've lived or traveled, favorite memories, and entertainment preferences like music, movies, or books",
      ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <PersonalizationHeader
        isLovedOneFlow={isLovedOneFlow}
        firstName={firstName}
      />

      {/* Carousel Content with Smooth Sliding */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSection * 100}%)` }}
        >
          {/* Section 1: Interests */}
          <div className="w-full flex-shrink-0">
            <InterestsSection
              interests={formData.interests}
              onChange={(value) => handleInputChange("interests", value)}
              onBack={() => {
                if (currentSection === 0) {
                  prevStep();
                } else {
                  setCurrentSection(0);
                }
              }}
              onSkip={handleSkipSection}
              onContinue={handleContinueSection}
              isLoading={isLoading}
              currentSection={currentSection}
              onSelectSection={setCurrentSection}
              isContinueDisabled={!formData.interests.trim()}
              isLovedOneFlow={isLovedOneFlow}
              firstName={firstName}
              suggestedTopics={suggestedTopics}
            />
          </div>

          {/* Section 2: Life Story */}
          <div className="w-full flex-shrink-0">
            <LifeStorySection
              aboutText={formData.aboutText}
              onChange={(value) => handleInputChange("aboutText", value)}
              onBack={() => {
                if (currentSection === 0) {
                  prevStep();
                } else {
                  setCurrentSection(0);
                }
              }}
              onSkip={handleSkipSection}
              onContinue={handleContinueSection}
              isLoading={isLoading}
              currentSection={currentSection}
              onSelectSection={setCurrentSection}
              isContinueDisabled={!formData.aboutText.trim()}
              isLovedOneFlow={isLovedOneFlow}
              firstName={firstName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
