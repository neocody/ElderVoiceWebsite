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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const serviceFormSchema = z.object({
  key: z.string().min(1, "Service key is required"),
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceFormSchema>;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: any;
}

export default function ServiceModal({
  isOpen,
  onClose,
  service,
}: ServiceModalProps) {
  const { toast } = useToast();
  const isEditing = !!service;

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      key: service?.key || "",
      name: service?.name || "",
      description: service?.description || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      if (isEditing) {
        return await apiRequest("PUT", `/api/services/${service.id}`, data);
      } else {
        return await apiRequest("POST", "/api/services", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      handleClose();
      toast({
        title: "Success",
        description: `Service ${isEditing ? "updated" : "added"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || `Failed to ${isEditing ? "update" : "add"} service`,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: ServiceForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Key</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="medication_reminders" />
                  </FormControl>
                  <div className="text-xs text-gray-600">
                    Machine-readable identifier (lowercase, underscores only)
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Medication Reminders" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Daily medication reminders and tracking"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {isEditing ? "Update" : "Add"} Service
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
