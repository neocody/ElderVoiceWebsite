import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  TicketPercent,
  Gift,
  Trash2,
  Pencil,
  RefreshCw,
  Percent,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouponModal } from "@/components/coupon/CouponModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Coupon } from "../../../shared/schema";

function formatAmount(amount?: number | null, currency?: string | null) {
  if (!amount) return "-";
  const code = (currency || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount / 100);
  } catch (error) {
    console.warn("Failed to format amount", error);
    return `${amount / 100} ${code}`;
  }
}

function formatRedeemBy(value?: Date | string | null) {
  if (!value) return "No expiration";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiration";
  return date.toLocaleString();
}

function formatDuration(coupon: Coupon) {
  switch (coupon.duration) {
    case "forever":
      return "Forever";
    case "once":
      return "One-time";
    case "repeating":
      return `${coupon.durationInMonths ?? 0} month repeat`;
    default:
      return coupon.duration;
  }
}

export default function CouponPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const {
    data: coupons = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (couponId: number) => {
      const res = await apiRequest("DELETE", `/api/coupons/${couponId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({
        title: "Coupon deleted",
        description: "The coupon has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete coupon",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((coupon) => coupon.isActive).length;
    const inactive = total - active;
    const totalRedemptions = coupons.reduce(
      (sum, coupon) => sum + (coupon.timesRedeemed ?? 0),
      0,
    );
    const expiringSoon = coupons.filter((coupon) => {
      if (!coupon.redeemBy) return false;
      const date = new Date(coupon.redeemBy);
      if (Number.isNaN(date.getTime())) return false;
      const diffDays = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 14;
    }).length;
    return { total, active, inactive, totalRedemptions, expiringSoon };
  }, [coupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingCoupon(null);
    setIsModalOpen(false);
  };

  const handleDelete = (coupon: Coupon) => {
    const confirmed = window.confirm(
      `Delete coupon ${coupon.code}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    deleteMutation.mutate(coupon.id);
  };

  const loadingState = isLoading || isFetching;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              Coupon Codes
            </h1>
            <p className="text-textSecondary">
              Manage promotional coupons that sync directly with Stripe.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={loadingState}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  loadingState ? "animate-spin" : "",
                )}
              />
              Refresh
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Coupons
              </CardTitle>
              <TicketPercent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active, {stats.inactive} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coupons
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Includes active and archived coupons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Redemptions
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRedemptions}</div>
              <p className="text-xs text-muted-foreground">
                Across all coupon codes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">
                Within the next 14 days
              </p>
            </CardContent>
          </Card>
        </div>

        {loadingState ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-muted-foreground">Loading coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <TicketPercent className="h-10 w-10 text-muted-foreground" />
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">No coupons yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first coupon to offer promotions to your
                  customers.
                </p>
              </div>
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {coupons.map((coupon) => {
              const discountLabel =
                coupon.couponType === "percent"
                  ? `${coupon.percentOff ?? 0}% off`
                  : `${formatAmount(coupon.amountOff, coupon.currency)} off`;

              return (
                <Card key={coupon.id} className="border">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold">
                        {coupon.code}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {coupon.name || "No internal name"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={cn(
                          "px-3 py-1 text-xs font-medium",
                          coupon.isActive
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-gray-400/20 text-gray-600",
                        )}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className="bg-blue-500/10 text-blue-600">
                        {coupon.couponType === "percent"
                          ? "Percent"
                          : "Fixed Amount"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground uppercase text-xs">
                          Discount
                        </p>
                        <p className="font-medium text-textPrimary">
                          {discountLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs">
                          Duration
                        </p>
                        <p className="font-medium text-textPrimary">
                          {formatDuration(coupon)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs">
                          Times Redeemed
                        </p>
                        <p className="font-medium text-textPrimary">
                          {coupon.timesRedeemed ?? 0}
                          {coupon.maxRedemptions
                            ? ` / ${coupon.maxRedemptions}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs">
                          Redeem By
                        </p>
                        <p className="font-medium text-textPrimary">
                          {formatRedeemBy(coupon.redeemBy as Date | string)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(coupon)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(coupon)}
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === coupon.id
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CouponModal
        isOpen={isModalOpen}
        onClose={closeModal}
        coupon={editingCoupon}
      />
    </Layout>
  );
}
