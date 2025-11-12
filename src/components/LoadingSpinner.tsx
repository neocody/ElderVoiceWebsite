import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 20, className = "", text }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-blue-600" />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
}

export default LoadingSpinner;