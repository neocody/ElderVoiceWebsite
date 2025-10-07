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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Coupon } from "../../../../shared/schema";

const couponFormSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters"),
    name: z.string().trim().min(1, "Coupon name is required"),
    couponType: z.enum(["percent", "amount"]),
    percentOff: z
      .number()
      .min(1, "Percent off must be at least 1")
      .max(100, "Percent off cannot exceed 100")
      .optional(),
    amountOff: z.number().min(0.01, "Amount off must be positive").optional(),
    currency: z
      .string()
      .trim()
      .length(3, "Currency must be a 3-letter code")
      .default("USD"),
    duration: z.enum(["forever", "once", "repeating"]),
    durationInMonths: z
      .number()
      .int()
      .min(1, "Duration must be at least 1 month")
      .max(36, "Duration cannot exceed 36 months")
      .optional(),
    maxRedemptions: z
      .number()
      .int()
      .min(1, "Max redemptions must be at least 1")
      .optional(),
    redeemBy: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.couponType === "percent" && data.percentOff === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["percentOff"],
        message: "Percent off is required",
      });
    }

    if (data.couponType === "amount") {
      if (data.amountOff === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amountOff"],
          message: "Amount off is required",
        });
      }
      if (!data.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currency"],
          message: "Currency is required",
        });
      }
    }

    if (data.duration === "repeating" && data.durationInMonths === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationInMonths"],
        message: "Duration in months is required",
      });
    }
  });

type CouponFormValues = z.infer<typeof couponFormSchema>;

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
}

function formatDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMinutes = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offsetMinutes * 60_000);
  return adjustedDate.toISOString().slice(0, 16);
}

export function CouponModal({ isOpen, onClose, coupon }: CouponModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(coupon);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      name: "",
      couponType: "percent",
      percentOff: 10,
      amountOff: undefined,
      currency: "USD",
      duration: "forever",
      durationInMonths: undefined,
      maxRedemptions: undefined,
      redeemBy: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        form.reset({
          code: coupon.code,
          name: coupon.name ?? "",
          couponType: coupon.couponType,
          percentOff:
            coupon.couponType === "percent"
              ? (coupon.percentOff ?? undefined)
              : undefined,
          amountOff:
            coupon.couponType === "amount"
              ? coupon.amountOff
                ? coupon.amountOff / 100
                : undefined
              : undefined,
          currency:
            coupon.couponType === "amount"
              ? (coupon.currency ?? "usd").toUpperCase()
              : "USD",
          duration: coupon.duration,
          durationInMonths:
            coupon.duration === "repeating"
              ? (coupon.durationInMonths ?? undefined)
              : undefined,
          maxRedemptions: coupon.maxRedemptions ?? undefined,
          redeemBy: coupon.redeemBy
            ? formatDateTimeLocal(String(coupon.redeemBy))
            : "",
          isActive: coupon.isActive ?? true,
        });
      } else {
        form.reset({
          code: "",
          name: "",
          couponType: "percent",
          percentOff: 10,
          amountOff: undefined,
          currency: "USD",
          duration: "forever",
          durationInMonths: undefined,
          maxRedemptions: undefined,
          redeemBy: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, coupon, form]);

  const couponMutation = useMutation({
    mutationFn: async (values: CouponFormValues) => {
      if (isEditing && coupon) {
        const payload: Record<string, unknown> = {};

        if (values.name.trim() !== (coupon.name ?? "")) {
          payload.name = values.name.trim();
        }

        if (values.isActive !== coupon.isActive) {
          payload.isActive = values.isActive;
        }

        if (Object.keys(payload).length === 0) {
          return coupon;
        }

        const res = await apiRequest(
          "PUT",
          `/api/coupons/${coupon.id}`,
          payload,
        );
        return (await res.json()) as Coupon;
      }

      const payload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        couponType: values.couponType,
        percentOff:
          values.couponType === "percent" ? values.percentOff : undefined,
        amountOff:
          values.couponType === "amount"
            ? Number(values.amountOff?.toFixed(2))
            : undefined,
        currency:
          values.couponType === "amount"
            ? values.currency.trim().toUpperCase()
            : undefined,
        duration: values.duration,
        durationInMonths:
          values.duration === "repeating" ? values.durationInMonths : undefined,
        maxRedemptions: values.maxRedemptions,
        redeemBy: values.redeemBy
          ? new Date(values.redeemBy).toISOString()
          : undefined,
        isActive: values.isActive,
      };

      const res = await apiRequest("POST", "/api/coupons", payload);
      return (await res.json()) as Coupon;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({
        title: "Success",
        description: isEditing
          ? "Coupon updated successfully"
          : "Coupon created successfully",
      });
      form.reset(variables);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.message ??
          (isEditing ? "Failed to update coupon" : "Failed to create coupon"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CouponFormValues) => {
    couponMutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const couponType = form.watch("couponType");
  const duration = form.watch("duration");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Coupon: ${coupon?.code}` : "Create Coupon"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                        placeholder="SPRING25"
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Spring Promotion" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="couponType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percent">Percent Off</SelectItem>
                        <SelectItem value="amount">Amount Off</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {couponType === "percent" ? (
                <FormField
                  control={form.control}
                  name="percentOff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percent Off (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          min={1}
                          max={100}
                          step={1}
                          disabled={isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="amountOff"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Off</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                            min={0.01}
                            step={0.01}
                            disabled={isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.value.toUpperCase())
                            }
                            maxLength={3}
                            disabled={isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="forever">Forever</SelectItem>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="repeating">Repeating</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {duration === "repeating" && (
                <FormField
                  control={form.control}
                  name="durationInMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          min={1}
                          max={36}
                          disabled={isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="maxRedemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Redemptions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                          )
                        }
                        min={1}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="redeemBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redeem By</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value
                            ? "Coupon is active"
                            : "Coupon is inactive"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={couponMutation.isPending}>
                {couponMutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Coupon"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
