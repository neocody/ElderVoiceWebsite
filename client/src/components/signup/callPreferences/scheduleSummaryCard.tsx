import { Card, CardContent } from "@/components/ui/card";

type ScheduleSummaryCardProps = {
  selectedDays: string[];
  showCustomization: boolean;
  customTimes: Record<string, string>;
  days: { id: string; label: string }[];
  getTimeForDay: (dayId: string) => string;
  defaultTime: string;
  formatTime: (time: string) => string;
  isLovedOneFlow: boolean;
  callFrequency: string;
};

export function ScheduleSummaryCard({
  selectedDays,
  showCustomization,
  customTimes,
  days,
  getTimeForDay,
  defaultTime,
  formatTime,
  isLovedOneFlow,
  callFrequency,
}: ScheduleSummaryCardProps) {
  if (selectedDays.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-3">
            {isLovedOneFlow ? "Their call schedule" : "Your call schedule"}
          </h3>

          <div className="space-y-3">
            <div className="text-lg text-gray-700">
              <strong>{callFrequency}</strong>
            </div>

            <div className="text-base text-gray-600">
              {showCustomization && Object.keys(customTimes).length > 0 ? (
                <div className="space-y-1">
                  {selectedDays.map((dayId) => {
                    const day = days.find((d) => d.id === dayId);
                    const time = getTimeForDay(dayId);
                    return (
                      <div key={dayId}>
                        <strong>{day?.label}:</strong> {formatTime(time)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  All calls at <strong>{formatTime(defaultTime)}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-4">
            You can always adjust this schedule later in your account settings
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
