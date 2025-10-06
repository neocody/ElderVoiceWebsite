import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SelectService } from "../../../../shared/schema";

const servicePlanFormSchema = z.object({
  name: z.string().min(1, "Service plan name is required"),
  description: z.string().min(1, "Description is required"),
  basePrice: z.number().min(0, "Price must be positive"),
  annualDiscount: z
    .number()
    .min(1, "Percentage must be positive")
    .max(100, "Percentage cannot exceed 100"),
  planType: z.enum(["individual", "facility"]),
  callsPerMonth: z.number().min(1, "Calls per month must be at least 1"),
  callDurationMinutes: z
    .number()
    .min(1, "Call duration must be at least 1 minute"),
  features: z.array(z.string()).default([]),
  serviceIds: z.array(z.number()).default([]),
  isActive: z.boolean().default(true),
});

type ServicePlanForm = z.infer<typeof servicePlanFormSchema>;

interface ServicePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicePlan?: any;
  services: SelectService[];
}

export default function ServicePlanModal({
  isOpen,
  onClose,
  servicePlan,
  services,
}: ServicePlanModalProps) {
  const { toast } = useToast();
  const isEditing = !!servicePlan;

  const form = useForm<ServicePlanForm>({
    resolver: zodResolver(servicePlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      annualDiscount: 0,
      planType: "individual",
      callsPerMonth: 30,
      callDurationMinutes: 20,
      features: [],
      serviceIds: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (servicePlan) {
        form.reset({
          name: servicePlan.name || "",
          description: servicePlan.description || "",
          basePrice: servicePlan.basePrice ? servicePlan.basePrice / 100 : 0,
          annualDiscount: servicePlan.annualDiscount || 0,
          planType: servicePlan.planType || "individual",
          callsPerMonth: servicePlan.callsPerMonth || 30,
          callDurationMinutes: servicePlan.callDurationMinutes || 20,
          features: servicePlan.features || [],
          serviceIds: servicePlan.serviceIds || [],
          isActive: servicePlan.isActive ?? true,
        });
      } else {
        // Reset to default values for new plan
        form.reset({
          name: "",
          description: "",
          basePrice: 0,
          annualDiscount: 0,
          planType: "individual",
          callsPerMonth: 30,
          callDurationMinutes: 20,
          features: [],
          serviceIds: [],
          isActive: true,
        });
      }
    }
  }, [isOpen, servicePlan, form]);

  const mutation = useMutation({
    mutationFn: async (data: ServicePlanForm) => {
      const planData = {
        ...data,
        basePrice: Math.round(data.basePrice * 100),
      };

      if (isEditing) {
        return await apiRequest(
          "PUT",
          `/api/service-plans/${servicePlan.id}`,
          planData,
        );
      } else {
        return await apiRequest("POST", "/api/service-plans", planData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-plans"] });
      handleClose();
      toast({
        title: "Success",
        description: `Service plan ${isEditing ? "updated" : "added"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          `Failed to ${isEditing ? "update" : "add"} service plan`,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: ServicePlanForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit Service Plan: ${servicePlan.name}`
              : "Add New Service Plan"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Plan Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Premium AI Companion" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="facility">Facility</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Daily AI companion calls with personalized conversations"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="99.99"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="1"
                        placeholder="99.99"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="callsPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calls Per Month</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="30"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Duration (Minutes)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="20"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Services Selection */}
            {services.length > 0 && (
              <FormField
                control={form.control}
                name="serviceIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Included Services
                      </FormLabel>
                      <div className="text-sm text-gray-600">
                        Select which services are included in this plan
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                      {services.map((service: any) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="serviceIds"
                          render={({ field }) => (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), service.id]
                                      : (field.value || []).filter(
                                          (value: number) =>
                                            value !== service.id,
                                        );
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  {service.name}
                                </FormLabel>
                                {service.description && (
                                  <p className="text-xs text-gray-600">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Plan</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this plan for new service subscriptions
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {isEditing ? "Update" : "Add"} Service Plan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
