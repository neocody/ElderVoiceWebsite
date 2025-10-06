import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Phone, Heart, User } from "lucide-react";

export default function CallPreferencesStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [selectedDays, setSelectedDays] = useState<string[]>(
    data.callPreferences.days || [],
  );
  const [defaultTime, setDefaultTime] = useState(
    data.callPreferences.defaultTime || "14:00",
  );
  const [customTimes, setCustomTimes] = useState<Record<string, string>>(
    data.callPreferences.customTimes || {},
  );
  const [showCustomization, setShowCustomization] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  const days = [
    { id: "monday", label: "Monday", short: "Mon" },
    { id: "tuesday", label: "Tuesday", short: "Tue" },
    { id: "wednesday", label: "Wednesday", short: "Wed" },
    { id: "thursday", label: "Thursday", short: "Thu" },
    { id: "friday", label: "Friday", short: "Fri" },
    { id: "saturday", label: "Saturday", short: "Sat" },
    { id: "sunday", label: "Sunday", short: "Sun" },
  ];

  // Generate 30-minute time increments from 8:00 AM to 8:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        const time12 = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
        slots.push({ value: time24, label: time12 });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDayToggle = (dayId: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedDays.length === 0) {
      toast({
        title: "Please select at least one day",
        description: isLovedOneFlow
          ? "Choose when they would like to receive calls"
          : "Choose when you would like to receive calls",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length > 7) {
      toast({
        title: "Too many days selected",
        description: "Please select up to 7 days for your call schedule",
        variant: "destructive",
      });
      return;
    }

    if (!data.userId) {
      toast({
        title: "Missing account details",
        description: "Please complete the earlier steps before continuing.",
        variant: "destructive",
      });
      return;
    }

    const targetElderlyId = data.elderlyUserId;

    if (!targetElderlyId) {
      toast({
        title: "Add personal details first",
        description:
          "Finish the personal information step to create a loved one profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const filteredCustomTimes = Object.fromEntries(
        Object.entries(customTimes).filter(([day]) =>
          selectedDays.includes(day),
        ),
      );

      const response = await apiRequest(
        "POST",
        "/api/onboard/call-preferences",
        {
          userId: data.userId,
          elderlyUserId: targetElderlyId,
          days: selectedDays,
          defaultTime,
          customTimes: filteredCustomTimes,
        },
      );

      const responseBody = await response.json();

      updateData({
        elderlyUserId: responseBody?.elderlyUserId ?? targetElderlyId,
        callPreferences: {
          days: selectedDays,
          defaultTime,
          customTimes: filteredCustomTimes,
          timeOfDay: getTimeOfDayFromTime(defaultTime),
        },
      });

      nextStep();
    } catch (error) {
      console.error("Failed to save call preferences", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCallFrequency = () => {
    const count = selectedDays.length;
    if (count === 1) return "1 call per week";
    if (count === 7) return "Daily calls";
    return `${count} calls per week`;
  };

  const getTimeOfDayFromTime = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const formatTime = (time: string) => {
    const slot = timeSlots.find((t) => t.value === time);
    return slot ? slot.label : time;
  };

  const getTimeForDay = (dayId: string) => {
    return customTimes[dayId] || defaultTime;
  };

  const setTimeForDay = (dayId: string, time: string) => {
    setCustomTimes((prev) => ({ ...prev, [dayId]: time }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            {isLovedOneFlow ? (
              <Heart className="h-6 w-6 text-rose-600" />
            ) : (
              <User className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isLovedOneFlow
                ? "When should we call them?"
                : "When should we call you?"}
            </h1>
          </div>
        </div>
        <p className="text-base sm:text-lg text-gray-600 ml-16">
          {isLovedOneFlow
            ? `Choose the best days and times for ${firstName} to receive companion calls`
            : "Choose the best days and times for your companion calls"}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Day Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-green-600" />
              {isLovedOneFlow
                ? "Which days work best for them?"
                : "Which days work best for you?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
              {days.map((day) => (
                <div key={day.id} className="relative">
                  <Checkbox
                    id={day.id}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => handleDayToggle(day.id)}
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
                  <span className="font-medium">{getCallFrequency()}</span>
                </div>
              </div>
            )}

            {selectedDays.length > 5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-yellow-800 text-sm">
                  💡 <strong>Tip:</strong> 3-4 calls per week often works best
                  for meaningful conversations without being overwhelming.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Selection */}
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
            {/* Default Time Selector */}
            <div>
              <Label className="text-base font-medium text-gray-900 mb-3 block">
                {selectedDays.length <= 1
                  ? "Preferred call time:"
                  : "Default call time for all selected days:"}
              </Label>
              <Select value={defaultTime} onValueChange={setDefaultTime}>
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

            {/* Custom Times Option */}
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
                    onClick={() => setShowCustomization(!showCustomization)}
                  >
                    {showCustomization
                      ? "Use same time for all"
                      : "Customize times"}
                  </Button>
                </div>

                {showCustomization && (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-3">
                      Set custom times for specific days. Days not customized
                      will use the default time above.
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
                  Each call typically lasts 10-20 minutes, giving plenty of time
                  for meaningful conversation without being overwhelming.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedDays.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {isLovedOneFlow
                    ? "Their call schedule"
                    : "Your call schedule"}
                </h3>

                {/* Schedule Details */}
                <div className="space-y-3">
                  <div className="text-lg text-gray-700">
                    <strong>{getCallFrequency()}</strong>
                  </div>

                  {/* Time Details */}
                  <div className="text-base text-gray-600">
                    {showCustomization &&
                    Object.keys(customTimes).length > 0 ? (
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
                  You can always adjust this schedule later in your account
                  settings
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={prevStep} disabled={isLoading}>
            Previous
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedDays.length === 0}
            className="flex-1"
            data-testid="button-continue"
          >
            {isLoading ? "Saving..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
