import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

type InterestsSectionProps = {
  interests: string;
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
  suggestedTopics: string[];
};

export function InterestsSection({
  interests,
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
  suggestedTopics,
}: InterestsSectionProps) {
  return (
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
            value={interests}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            className="text-base border-2 border-gray-400 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-500"
            data-testid="textarea-interests"
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
