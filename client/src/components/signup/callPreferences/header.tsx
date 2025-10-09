import { Heart, User } from "lucide-react";

type CallPreferencesHeaderProps = {
  isLovedOneFlow: boolean;
  firstName: string;
};

export function CallPreferencesHeader({
  isLovedOneFlow,
  firstName,
}: CallPreferencesHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          {isLovedOneFlow ? (
            <Heart className="h-6 w-6 text-rose-600" />
          ) : (
            <User className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isLovedOneFlow
              ? "When should we call them?"
              : "When should we call you?"}
          </h1>
        </div>
      </div>
      <p className="text-base sm:text-lg text-gray-600 ml-16">
        {isLovedOneFlow
          ? `Choose the best days and times for ${firstName} to receive companion calls`
          : "Choose the best days and times for your companion calls"}
      </p>
    </div>
  );
}
