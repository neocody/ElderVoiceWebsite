import { CheckCircle } from "lucide-react";

type SuccessHeaderProps = {
  isLovedOneFlow: boolean;
  firstName: string;
};

export function SuccessHeader({
  isLovedOneFlow,
  firstName,
}: SuccessHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to ElderVoice! 🎉
      </h1>
      <p className="text-xl text-gray-600">
        {isLovedOneFlow
          ? `Your 7-day free trial has started for ${firstName}`
          : "Your 7-day free trial has started"}
      </p>
    </div>
  );
}
