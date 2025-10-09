import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

type ConsentNoticeProps = {
  firstName: string;
};

export function ConsentNotice({ firstName }: ConsentNoticeProps) {
  return (
    <Card className="mb-8 border-yellow-200 bg-yellow-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Heart className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">
              Important: Consent Verification
            </h4>
            <p className="text-yellow-800 text-sm leading-relaxed">
              During the first call, we'll verify that {firstName} wants to
              receive these calls and is comfortable with the service. If they
              prefer not to continue, we'll immediately cancel the service at no
              charge. This ensures their comfort and consent throughout the
              process.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
