import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart,
  User,
  Lightbulb,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  const getCurrentFieldValue = () => {
    return currentSection === 0 ? formData.interests : formData.aboutText;
  };

  const isCurrentFieldEmpty = () => {
    return !getCurrentFieldValue().trim();
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

  const renderInterestsSection = () => (
    <Card className="transition-all duration-300 ease-in-out">
      <CardContent className="space-y-4 pt-6">
        <div>
          <Label
            htmlFor="interests"
            className="text-base font-medium text-gray-900 mb-2 block"
          >
            {isLovedOneFlow
              ? `What does ${firstName} enjoy doing? What are their passions?`
              : "What do you enjoy doing? What are your passions?"}
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            You can always update or add more information later in your account
            settings
          </p>
          <Textarea
            id="interests"
            placeholder={
              isLovedOneFlow
                ? "e.g., They love gardening, especially growing tomatoes. They enjoy reading mystery novels and used to paint watercolors..."
                : "e.g., I love gardening, especially growing tomatoes. I enjoy reading mystery novels and painting watercolors..."
            }
            value={formData.interests}
            onChange={(e) => handleInputChange("interests", e.target.value)}
            rows={4}
            className="text-base border-2 border-gray-400 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-500"
            data-testid="textarea-interests"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              if (currentSection === 0) {
                prevStep(); // Go to actual previous step
              } else {
                setCurrentSection(0); // Slide to previous form on same page
              }
            }}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Previous
          </Button>

          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={handleSkipSection}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-skip"
            >
              Skip
            </Button>

            <Button
              onClick={handleContinueSection}
              disabled={isLoading || isCurrentFieldEmpty()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              data-testid="button-continue"
            >
              {isLoading
                ? "Saving..."
                : currentSection === 0
                  ? "Continue"
                  : "Continue to Call Preferences"}
            </Button>
          </div>
        </div>

        {/* Suggested Topics */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">
              Great conversation starters:
            </h4>
          </div>
          <div className="space-y-2 text-base text-blue-800">
            {suggestedTopics.map((topic, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-blue-400 flex-shrink-0 leading-6">•</span>
                <span className="leading-6">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSection(0)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentSection === 0
                  ? "bg-purple-600 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label="Go to interests section"
              data-testid="dot-interests"
            />
            <div
              className={`w-8 h-0.5 transition-colors duration-200 ${
                currentSection === 1 ? "bg-purple-600" : "bg-gray-300"
              }`}
            />
            <button
              onClick={() => setCurrentSection(1)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentSection === 1
                  ? "bg-purple-600 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label="Go to life story section"
              data-testid="dot-life-story"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLifeStorySection = () => (
    <Card className="transition-all duration-300 ease-in-out">
      <CardContent className="space-y-4 pt-6">
        <div>
          <Label
            htmlFor="aboutText"
            className="text-base font-medium text-gray-900 mb-2 block"
          >
            {isLovedOneFlow
              ? `Tell us about ${firstName}'s life, family, and important experiences`
              : "Tell us about your life, family, and important experiences"}
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            You can always update or add more information later in your account
            settings
          </p>
          <Textarea
            id="aboutText"
            placeholder={
              isLovedOneFlow
                ? "e.g., They grew up in Ohio, worked as a teacher for 30 years, and have 3 children and 5 grandchildren. They lost their spouse 2 years ago but stay close with family. They have a cat named Whiskers and love talking about their grandchildren's activities..."
                : "e.g., I grew up in Ohio, worked as a teacher for 30 years, and have 3 children and 5 grandchildren. I lost my spouse 2 years ago but stay close with family. I have a cat named Whiskers and love talking about my grandchildren's activities..."
            }
            value={formData.aboutText}
            onChange={(e) => handleInputChange("aboutText", e.target.value)}
            rows={5}
            className="text-base border-2 border-gray-400 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-500"
            data-testid="textarea-about"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              if (currentSection === 0) {
                prevStep(); // Go to actual previous step
              } else {
                setCurrentSection(0); // Slide to previous form on same page
              }
            }}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Previous
          </Button>

          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={handleSkipSection}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-skip"
            >
              Skip
            </Button>

            <Button
              onClick={handleContinueSection}
              disabled={isLoading || isCurrentFieldEmpty()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              data-testid="button-continue"
            >
              {isLoading
                ? "Saving..."
                : currentSection === 0
                  ? "Continue"
                  : "Continue to Call Preferences"}
            </Button>
          </div>
        </div>

        {/* Gentle Guidance */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">
              Making conversations comfortable
            </h4>
          </div>
          <div className="text-base text-green-800">
            {isLovedOneFlow
              ? "Feel free to mention in the life story above if there are any sensitive topics they prefer to keep private. Our AI companion will naturally avoid these areas and focus on the positive topics they enjoy."
              : "Feel free to mention in the life story above if there are any sensitive topics you prefer to keep private. Our AI companion will naturally avoid these areas and focus on the positive topics you enjoy."}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSection(0)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentSection === 0
                  ? "bg-purple-600 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label="Go to interests section"
              data-testid="dot-interests"
            />
            <div
              className={`w-8 h-0.5 transition-colors duration-200 ${
                currentSection === 1 ? "bg-purple-600" : "bg-gray-300"
              }`}
            />
            <button
              onClick={() => setCurrentSection(1)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentSection === 1
                  ? "bg-purple-600 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label="Go to life story section"
              data-testid="dot-life-story"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            {isLovedOneFlow ? (
              <Heart className="h-6 w-6 text-rose-600" />
            ) : (
              <User className="h-6 w-6 text-purple-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isLovedOneFlow
                ? `Tell us more about ${firstName}`
                : "Tell us more about yourself"}
            </h1>
          </div>
        </div>
        <p className="text-base sm:text-lg text-gray-600 ml-16">
          This information helps our AI companion have meaningful, personal
          conversations that feel natural and engaging
        </p>
      </div>

      {/* Carousel Content with Smooth Sliding */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSection * 100}%)` }}
        >
          {/* Section 1: Interests */}
          <div className="w-full flex-shrink-0">{renderInterestsSection()}</div>

          {/* Section 2: Life Story */}
          <div className="w-full flex-shrink-0">{renderLifeStorySection()}</div>
        </div>
      </div>
    </div>
  );
}
