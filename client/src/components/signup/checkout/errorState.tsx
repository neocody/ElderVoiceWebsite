import { Button } from "@/components/ui/button";

type CheckoutErrorStateProps = {
  message: string;
  onRetry: () => void;
  onGoBack: () => void;
};

export function CheckoutErrorState({
  message,
  onRetry,
  onGoBack,
}: CheckoutErrorStateProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="text-red-500 mb-4">⚠️ {message}</div>
      <div className="space-y-2">
        <Button onClick={onRetry}>Refresh Page</Button>
        <Button variant="outline" onClick={onGoBack} className="ml-2">
          Go Back
        </Button>
      </div>
    </div>
  );
}
