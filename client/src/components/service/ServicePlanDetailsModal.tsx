import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectService } from "../../../../shared/schema";

interface ServicePlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicePlan: any;
  services: SelectService[];
  onEdit: (servicePlan: any) => void;
}

export default function ServicePlanDetailsModal({
  isOpen,
  onClose,
  servicePlan,
  services,
  onEdit,
}: ServicePlanDetailsModalProps) {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (!servicePlan) return null;

  const includedServices = services.filter((service: any) =>
    servicePlan.serviceIds?.includes(service.id),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{servicePlan.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Plan Type</h4>
              <p className="text-textPrimary capitalize">
                {servicePlan.planType}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Status</h4>
              <Badge variant={servicePlan.isActive ? "default" : "secondary"}>
                {servicePlan.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              Description
            </h4>
            <p className="text-textPrimary">{servicePlan.description}</p>
          </div>

          {/* Call Limitations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">
                Calls Per Month
              </h4>
              <p className="text-textPrimary">
                {servicePlan.callsPerMonth || "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">
                Call Duration
              </h4>
              <p className="text-textPrimary">
                {servicePlan.callDurationMinutes || "N/A"} minutes
              </p>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-3">
              Pricing
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-textPrimary">
                  Base Price:
                </span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(servicePlan.basePrice)}/month
                </span>
              </div>
              {servicePlan.annualDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-textPrimary">
                    Annual Discount:
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    {servicePlan.annualDiscount}% off
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Included Services */}
          {includedServices.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm text-gray-600 mb-3">
                Included Services
              </h4>
              <div className="space-y-2">
                {includedServices.map((service: any) => (
                  <div
                    key={service.id}
                    className="flex items-start space-x-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-600">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit(servicePlan)}>
              Edit Service Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
