import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

type TimeSelectionCardProps = {
  selectedDays: string[];
  defaultTime: string;
  onDefaultTimeChange: (time: string) => void;
  showCustomization: boolean;
  onToggleCustomization: () => void;
  days: { id: string; label: string }[];
  timeSlots: { value: string; label: string }[];
  getTimeForDay: (dayId: string) => string;
  setTimeForDay: (dayId: string, time: string) => void;
  isLovedOneFlow: boolean;
};

export function TimeSelectionCard({
  selectedDays,
  defaultTime,
  onDefaultTimeChange,
  showCustomization,
  onToggleCustomization,
  days,
  timeSlots,
  getTimeForDay,
  setTimeForDay,
  isLovedOneFlow,
}: TimeSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-orange-600" />
          {isLovedOneFlow
            ? "What time do they prefer?"
            : "What time do you prefer?"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium text-gray-900 mb-3 block">
            {selectedDays.length <= 1
              ? "Preferred call time:"
              : "Default call time for all selected days:"}
          </Label>
          <Select value={defaultTime} onValueChange={onDefaultTimeChange}>
            <SelectTrigger className="w-full text-base">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDays.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium text-gray-900">
                Different times for specific days?
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleCustomization}
              >
                {showCustomization
                  ? "Use same time for all"
                  : "Customize times"}
              </Button>
            </div>

            {showCustomization && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Set custom times for specific days. Days not customized will
                  use the default time above.
                </p>
                {selectedDays.map((dayId) => {
                  const day = days.find((d) => d.id === dayId);
                  return (
                    <div
                      key={dayId}
                      className="flex items-center justify-between"
                    >
                      <Label className="font-medium text-gray-900 min-w-[80px]">
                        {day?.label}:
                      </Label>
                      <Select
                        value={getTimeForDay(dayId)}
                        onValueChange={(time) => setTimeForDay(dayId, time)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 text-sm">
            <div className="font-medium mb-1">📞 Call Duration</div>
            <p>
              Each call typically lasts 10-20 minutes, giving plenty of time for
              meaningful conversation without being overwhelming.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
