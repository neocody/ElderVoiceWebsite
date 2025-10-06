import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, User, Settings, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const scheduleFormSchema = z.object({
  elderlyUserId: z.number(),
  frequency: z.enum(['daily', 'weekly', 'custom']),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  ampm: z.enum(['AM', 'PM']),
  dayOfWeek: z.number().nullable(),
  daysOfWeek: z.array(z.number()).optional(),
  isActive: z.boolean(),
});

type ScheduleForm = z.infer<typeof scheduleFormSchema>;

export default function Schedules() {
  const { toast } = useToast();
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const { data: elderlyUsers = [] } = useQuery({
    queryKey: ["/api/elderly-users"],
  });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      elderlyUserId: 0,
      frequency: 'daily',
      hour: '12',
      minute: '00',
      ampm: 'PM',
      dayOfWeek: null,
      daysOfWeek: [],
      isActive: true,
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<ScheduleForm> }) => {
      return await apiRequest("PUT", `/api/schedules/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Schedule Updated",
        description: "The call schedule has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingSchedule(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    
    // Convert 24-hour time to 12-hour format
    const timeField = schedule.timeOfDay || schedule.time || '12:00';
    const [hourStr, minuteStr] = timeField.split(':');
    const hour24 = parseInt(hourStr);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    
    // Handle custom days of week
    const daysOfWeek = schedule.daysOfWeek || [];
    
    form.reset({
      elderlyUserId: schedule.elderlyUserId,
      frequency: schedule.frequency,
      hour: hour12.toString(),
      minute: minuteStr || '00',
      ampm: ampm,
      dayOfWeek: schedule.dayOfWeek,
      daysOfWeek: daysOfWeek,
      isActive: schedule.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: ScheduleForm) => {
    if (editingSchedule) {
      // Convert 12-hour format to 24-hour format for API
      let hour24 = parseInt(data.hour);
      if (data.ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
      } else if (data.ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
      }
      
      const timeOfDay = `${hour24.toString().padStart(2, '0')}:${data.minute}`;
      
      const updates = {
        elderlyUserId: data.elderlyUserId,
        frequency: data.frequency,
        timeOfDay: timeOfDay,
        dayOfWeek: data.dayOfWeek,
        daysOfWeek: data.daysOfWeek || [],
        isActive: data.isActive,
      };
      
      updateScheduleMutation.mutate({
        id: editingSchedule.id,
        updates,
      });
    }
  };

  // Create a map for quick user lookup
  const userMap = elderlyUsers.reduce((acc: any, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return <Badge className="bg-primary/10 text-primary">Daily</Badge>;
      case 'weekly':
        return <Badge className="bg-secondary/10 text-secondary">Weekly</Badge>;
      case 'biweekly':
        return <Badge className="bg-accent/10 text-accent">Bi-weekly</Badge>;
      default:
        return <Badge variant="outline">{frequency}</Badge>;
    }
  };

  const getDayOfWeekName = (dayOfWeek: number | null) => {
    if (dayOfWeek === null) return 'Any day';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">Call Schedules</h2>
              <p className="text-textSecondary">Manage automated call schedules for all users</p>
            </div>
            <Button className="bg-primary hover:bg-blue-700">
              <Settings className="mr-2" size={16} />
              Schedule Settings
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-textPrimary">Active Schedules</h3>
                <div className="text-sm text-textSecondary">
                  {schedules.filter((s: any) => s.isActive).length} of {schedules.length} schedules active
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      <div className="flex items-center">
                        <User className="mr-2" size={14} />
                        User
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="mr-2" size={14} />
                        Call Time
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="mr-2" size={14} />
                        Frequency
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Day of Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Created
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-textSecondary">
                        No schedules found. Add elderly users to automatically create call schedules.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((schedule: any) => {
                      const user = userMap[schedule.elderlyUserId];
                      return (
                        <tr 
                          key={schedule.id} 
                          className="hover:bg-gray-50 cursor-pointer" 
                          onClick={() => openEditDialog(schedule)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user ? (
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-textPrimary">
                                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-textPrimary">{user.name}</div>
                                  <div className="text-sm text-textSecondary">{user.phone}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-textSecondary">Unknown User (ID: {schedule.elderlyUserId})</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-textPrimary">
                              {formatTime(schedule.timeOfDay)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getFrequencyBadge(schedule.frequency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                            {getDayOfWeekName(schedule.dayOfWeek)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              className={schedule.isActive 
                                ? "bg-secondary/10 text-secondary" 
                                : "bg-gray-100 text-gray-600"
                              }
                            >
                              {schedule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                            {schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString() : 'Unknown'}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-surface rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-textPrimary">
                    {schedules.filter((s: any) => s.frequency === 'daily').length}
                  </h3>
                  <p className="text-textSecondary text-sm">Daily Schedules</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-textPrimary">
                    {schedules.filter((s: any) => s.frequency === 'weekly').length}
                  </h3>
                  <p className="text-textSecondary text-sm">Weekly Schedules</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <User className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-textPrimary">
                    {schedules.filter((s: any) => s.isActive).length}
                  </h3>
                  <p className="text-textSecondary text-sm">Active Schedules</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Edit Schedule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Call Schedule</DialogTitle>
              <DialogDescription>
                Modify the call schedule settings for {editingSchedule && userMap[editingSchedule.elderlyUserId]?.name}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hour</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minute</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['00', '15', '30', '45'].map(minute => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ampm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AM/PM</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('frequency') === 'custom' && (
                  <FormField
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Days</FormLabel>
                        <div className="grid grid-cols-7 gap-2">
                          {[
                            { value: 0, label: 'Sun' },
                            { value: 1, label: 'Mon' },
                            { value: 2, label: 'Tue' },
                            { value: 3, label: 'Wed' },
                            { value: 4, label: 'Thu' },
                            { value: 5, label: 'Fri' },
                            { value: 6, label: 'Sat' }
                          ].map(day => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={field.value?.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentDays = field.value || [];
                                const updatedDays = currentDays.includes(day.value)
                                  ? currentDays.filter(d => d !== day.value)
                                  : [...currentDays, day.value];
                                field.onChange(updatedDays);
                              }}
                              className="h-10 text-xs"
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('frequency') === 'weekly' && (
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Schedule</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this call schedule
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateScheduleMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {updateScheduleMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
