import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";

type LifeStorySectionProps = {
  aboutText: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
  isLoading: boolean;
  currentSection: number;
  onSelectSection: (index: number) => void;
  isContinueDisabled: boolean;
  isLovedOneFlow: boolean;
  firstName: string;
};

export function LifeStorySection({
  aboutText,
  onChange,
  onBack,
  onSkip,
  onContinue,
  isLoading,
  currentSection,
  onSelectSection,
  isContinueDisabled,
  isLovedOneFlow,
  firstName,
}: LifeStorySectionProps) {
  return (
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
            value={aboutText}
            onChange={(event) => onChange(event.target.value)}
            rows={5}
            className="text-base border-2 border-gray-400 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-500"
            data-testid="textarea-about"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Previous
          </Button>

          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-skip"
            >
              Skip
            </Button>

            <Button
              onClick={onContinue}
              disabled={isLoading || isContinueDisabled}
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

        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSelectSection(0)}
              className={`h-3 w-3 rounded-full p-0 transition-all duration-200 ${
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSelectSection(1)}
              className={`h-3 w-3 rounded-full p-0 transition-all duration-200 ${
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
}
