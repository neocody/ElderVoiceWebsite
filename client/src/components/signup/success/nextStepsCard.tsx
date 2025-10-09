import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export type NextStep = {
  icon: JSX.Element;
  title: string;
  description: string;
};

type NextStepsCardProps = {
  steps: NextStep[];
};

export function NextStepsCard({ steps }: NextStepsCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          What Happens Next
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {step.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {step.title}
                </h4>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
