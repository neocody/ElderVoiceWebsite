type SuccessFooterProps = {
  isLovedOneFlow: boolean;
  firstName: string;
};

export function SuccessFooter({
  isLovedOneFlow,
  firstName,
}: SuccessFooterProps) {
  return (
    <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
      <p className="text-gray-700 mb-2">Thank you for choosing ElderVoice!</p>
      <p className="text-sm text-gray-600">
        We're committed to providing meaningful companionship and support.
        {isLovedOneFlow
          ? ` ${firstName} is in good hands.`
          : " You're in good hands."}
      </p>
    </div>
  );
}
