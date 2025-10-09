import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, Phone } from "lucide-react";

type DaySelectionCardProps = {
  days: { id: string; label: string; short: string }[];
  selectedDays: string[];
  onToggleDay: (dayId: string) => void;
  callFrequency: string;
  title: string;
};

export function DaySelectionCard({
  days,
  selectedDays,
  onToggleDay,
  callFrequency,
  title,
}: DaySelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
          {days.map((day) => (
            <div key={day.id} className="relative">
              <Checkbox
                id={day.id}
                checked={selectedDays.includes(day.id)}
                onCheckedChange={() => onToggleDay(day.id)}
                className="sr-only"
                data-testid={`checkbox-${day.id}`}
              />
              <Label
                htmlFor={day.id}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selectedDays.includes(day.id)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <span className="font-medium text-sm">{day.short}</span>
                <span className="text-xs mt-1 hidden sm:block">
                  {day.label}
                </span>
              </Label>
            </div>
          ))}
        </div>

        {selectedDays.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Phone className="h-4 w-4" />
              <span className="font-medium">{callFrequency}</span>
            </div>
          </div>
        )}

        {selectedDays.length > 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-800 text-sm">
              💡 <strong>Tip:</strong> 3-4 calls per week often works best for
              meaningful conversations without being overwhelming.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
