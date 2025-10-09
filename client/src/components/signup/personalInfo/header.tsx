import { Heart, User } from "lucide-react";

type PersonalInfoHeaderProps = {
  isLovedOneFlow: boolean;
};

export function PersonalInfoHeader({ isLovedOneFlow }: PersonalInfoHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
        {isLovedOneFlow ? (
          <Heart className="h-7 w-7 text-rose-600" />
        ) : (
          <User className="h-7 w-7 text-blue-600" />
        )}
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {isLovedOneFlow
          ? "Tell us about your loved one"
          : "Tell us about yourself"}
      </h1>
      <p className="text-base sm:text-lg text-gray-600">
        {isLovedOneFlow
          ? "We need some basic information to personalize their experience"
          : "We need some basic information to get started"}
      </p>
    </div>
  );
}
