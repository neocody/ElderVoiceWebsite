import { Heart, User } from "lucide-react";

type PersonalizationHeaderProps = {
  isLovedOneFlow: boolean;
  firstName: string;
};

export function PersonalizationHeader({
  isLovedOneFlow,
  firstName,
}: PersonalizationHeaderProps) {
  return (
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
  );
}
