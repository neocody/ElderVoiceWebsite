import { Shield } from "lucide-react";

export function VerificationHeader() {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Shield className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Verify Your Identity
      </h1>
      <p className="text-lg text-gray-600">
        We need to verify your identity to ensure account security
      </p>
    </div>
  );
}
