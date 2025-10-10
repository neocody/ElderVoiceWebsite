import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CallPreferencesHeader } from "./header";
import { DaySelectionCard } from "./daySelectionCard";
import { ScheduleSummaryCard } from "./scheduleSummaryCard";
import { TimeSelectionCard } from "./timeSelectionCard";

export default function CallPreferencesStep() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { toast } = useToast();

  const [selectedDays, setSelectedDays] = useState<string[]>(
    data.callPreferences.days || []
  );
  const [defaultTime, setDefaultTime] = useState(
    data.callPreferences.defaultTime || "14:00"
  );
  const [customTimes, setCustomTimes] = useState<Record<string, string>>(
    data.callPreferences.customTimes || {}
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
        const time24 = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        const time12 = `${hour12}:${minute
          .toString()
          .padStart(2, "0")} ${ampm}`;
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
          selectedDays.includes(day)
        )
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
        }
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

  const callFrequency = getCallFrequency();
  const daySelectionTitle = isLovedOneFlow
    ? "Which days work best for them?"
    : "Which days work best for you?";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <CallPreferencesHeader
        isLovedOneFlow={isLovedOneFlow}
        firstName={firstName}
      />

      {/* Form */}
      <div className="space-y-6">
        <DaySelectionCard
          days={days}
          selectedDays={selectedDays}
          onToggleDay={handleDayToggle}
          callFrequency={callFrequency}
          title={daySelectionTitle}
        />

        <TimeSelectionCard
          selectedDays={selectedDays}
          defaultTime={defaultTime}
          onDefaultTimeChange={setDefaultTime}
          showCustomization={showCustomization}
          onToggleCustomization={() => setShowCustomization(!showCustomization)}
          days={days}
          timeSlots={timeSlots}
          getTimeForDay={getTimeForDay}
          setTimeForDay={setTimeForDay}
          isLovedOneFlow={isLovedOneFlow}
        />

        <ScheduleSummaryCard
          selectedDays={selectedDays}
          showCustomization={showCustomization}
          customTimes={customTimes}
          days={days}
          getTimeForDay={getTimeForDay}
          defaultTime={defaultTime}
          formatTime={formatTime}
          isLovedOneFlow={isLovedOneFlow}
          callFrequency={callFrequency}
        />

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
