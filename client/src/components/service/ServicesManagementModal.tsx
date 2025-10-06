import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Package, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SelectService } from "../../../../shared/schema";
import ServiceModal from "./ServiceModal";

interface ServicesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: SelectService[];
}

export default function ServicesManagementModal({
  isOpen,
  onClose,
  services,
}: ServicesManagementModalProps) {
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const { toast } = useToast();

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const handleEditService = (service: any) => {
    setEditingService(service);
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = (service: any) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const handleServiceModalClose = () => {
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Manage Services</DialogTitle>
              <Button onClick={handleAddService}>
                <Plus className="mr-2" size={16} />
                Add Service
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-textPrimary mb-2">
                  No services yet
                </h3>
                <p className="text-textSecondary mb-4">
                  Create your first service to get started
                </p>
                <Button onClick={handleAddService}>
                  <Plus className="mr-2" size={16} />
                  Add Service
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service: any) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-textPrimary">
                          {service.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {service.key}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-textSecondary mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Modal for Add/Edit */}
      <ServiceModal
        isOpen={isServiceModalOpen || !!editingService}
        onClose={handleServiceModalClose}
        service={editingService}
      />
    </>
  );
}
