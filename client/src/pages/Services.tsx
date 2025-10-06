import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Package,
  Pencil,
  Settings,
  Filter,
  SortAsc,
  SortDesc,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/Layout";
import { SelectService } from "../../../shared/schema";
import ServicePlanModal from "@/components/service/ServicePlanModal";
import ServicesManagementModal from "@/components/service/ServicesManagementModal";
import ServicePlanDetailsModal from "@/components/service/ServicePlanDetailsModal";

type SortField = "name" | "price" | "status" | "type" | "clients";
type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | "individual" | "facility";

export default function Services() {
  // Modal states
  const [isServicePlanModalOpen, setIsServicePlanModalOpen] = useState(false);
  const [isServicesManagementOpen, setIsServicesManagementOpen] =
    useState(false);
  const [editingServicePlan, setEditingServicePlan] = useState<any>(null);
  const [viewingServicePlan, setViewingServicePlan] = useState<any>(null);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Data fetching
  const { data: rawServicePlans = [], isLoading: servicePlansLoading } =
    useQuery({
      queryKey: ["/api/service-plans"],
    });

  const { data: services = [], isLoading: servicesLoading } = useQuery<
    SelectService[]
  >({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json() as Promise<SelectService[]>;
    },
  });

  // Apply sorting and filtering
  const servicePlans = useMemo(() => {
    const plans = Array.isArray(rawServicePlans) ? rawServicePlans : [];
    let filtered = plans.filter((plan: any) => {
      if (statusFilter === "active" && !plan.isActive) return false;
      if (statusFilter === "inactive" && plan.isActive) return false;
      if (typeFilter !== "all" && plan.planType !== typeFilter) return false;
      return true;
    });

    filtered.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = (a.basePrice || 0) - (b.basePrice || 0);
          break;
        case "status":
          comparison = (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
          break;
        case "type":
          comparison = (a.planType || "").localeCompare(b.planType || "");
          break;
        case "clients":
          comparison = (a.clientCount || 0) - (b.clientCount || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [rawServicePlans, sortBy, sortOrder, statusFilter, typeFilter]);

  // Helper functions
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const openEditServicePlan = (servicePlan: any) => {
    setViewingServicePlan(null); // Close details modal first
    setEditingServicePlan(servicePlan);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  const isFiltered =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    sortBy !== "name" ||
    sortOrder !== "asc";

  // Statistics calculations
  const stats = useMemo(() => {
    const activePlans = servicePlans.filter((p: any) => p.isActive);
    const facilityPlans = servicePlans.filter(
      (p: any) => p.planType === "facility",
    );
    const inactivePlans = servicePlans.filter((p: any) => !p.isActive);
    const minPrice =
      servicePlans.length > 0
        ? Math.min(...servicePlans.map((p: any) => p.basePrice || 0))
        : 0;

    return {
      active: activePlans.length,
      facility: facilityPlans.length,
      inactive: inactivePlans.length,
      startingPrice: formatPrice(minPrice),
    };
  }, [servicePlans]);

  if (servicePlansLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-48">Loading...</div>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-textPrimary">
                Service Plans
              </h1>
              <p className="text-textSecondary">
                Manage service plan templates and pricing. To add services to
                clients, use the Clients page.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => setIsServicesManagementOpen(true)}>
                <Pencil className="mr-2" size={16} />
                Manage Services
              </Button>
              <Button onClick={() => setIsServicePlanModalOpen(true)}>
                <Plus className="mr-2" size={16} />
                Add Service Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-3 items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: StatusFilter) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value: TypeFilter) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
            </SelectContent>
          </Select>

          <div className="border-l border-gray-300 h-6 mx-2"></div>

          <div className="flex items-center space-x-2">
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4 text-gray-500" />
            ) : (
              <SortDesc className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
          </div>

          <Select
            value={sortBy}
            onValueChange={(value: SortField) => setSortBy(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3"
          >
            {sortOrder === "asc" ? "A→Z" : "Z→A"}
          </Button>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 px-3"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Statistics Cards - Desktop */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-textPrimary">
                  {stats.active}
                </h3>
                <p className="text-textSecondary text-xs">Active Plans</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-textPrimary">
                  {stats.startingPrice}
                </h3>
                <p className="text-textSecondary text-xs">Starting From</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-textPrimary">
                  {stats.facility}
                </h3>
                <p className="text-textSecondary text-xs">Facility Plans</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-textPrimary">
                  {stats.inactive}
                </h3>
                <p className="text-textSecondary text-xs">Inactive Plans</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards - Mobile */}
        <div className="md:hidden">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            <Card className="flex-shrink-0 min-w-[120px]">
              <CardContent className="flex items-center p-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-semibold text-textPrimary">
                    {stats.active}
                  </h3>
                  <p className="text-textSecondary text-xs">Active</p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-shrink-0 min-w-[140px]">
              <CardContent className="flex items-center p-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-semibold text-textPrimary">
                    {stats.startingPrice}
                  </h3>
                  <p className="text-textSecondary text-xs">From</p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-shrink-0 min-w-[120px]">
              <CardContent className="flex items-center p-3">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Package className="h-4 w-4 text-gray-600" />
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-semibold text-textPrimary">
                    {stats.inactive}
                  </h3>
                  <p className="text-textSecondary text-xs">Inactive</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Service Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {servicePlans.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-textPrimary mb-2">
                  No service plans yet
                </h3>
                <p className="text-textSecondary mb-4">
                  Create your first service plan to get started
                </p>
                <Button onClick={() => setIsServicePlanModalOpen(true)}>
                  <Plus className="mr-2" size={16} />
                  Add Service Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {servicePlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      plan.isActive
                        ? "hover:bg-gray-50 border-gray-200"
                        : "bg-gray-50 border-gray-300 opacity-75 hover:bg-gray-100"
                    }`}
                    onClick={() => setViewingServicePlan(plan)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-textPrimary truncate">
                          {plan.name}
                        </h3>
                        <div className="flex flex-col space-y-1 text-sm text-textSecondary">
                          <p className="text-sm">{plan.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="capitalize">{plan.planType}</span>
                            <span>•</span>
                            <span>
                              {plan.callsPerMonth || "N/A"} calls/month
                            </span>
                            <span>•</span>
                            <span>
                              {plan.callDurationMinutes || "N/A"} min/call
                            </span>
                            <span>•</span>
                            <span className="font-medium text-blue-600">
                              {plan.clientCount || 0} clients
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <div className="font-semibold text-textPrimary text-sm">
                          {formatPrice(plan.basePrice)}
                          <span className="text-xs text-textSecondary ml-1">
                            /month
                          </span>
                        </div>
                        {plan.annualDiscount > 0 && (
                          <div className="text-xs text-green-600">
                            {plan.annualDiscount}% annual discount
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={plan.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditServicePlan(plan);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <ServicePlanModal
          isOpen={isServicePlanModalOpen || !!editingServicePlan}
          onClose={() => {
            setIsServicePlanModalOpen(false);
            setEditingServicePlan(null);
          }}
          servicePlan={editingServicePlan}
          services={services}
        />

        <ServicesManagementModal
          isOpen={isServicesManagementOpen}
          onClose={() => setIsServicesManagementOpen(false)}
          services={services}
        />

        <ServicePlanDetailsModal
          isOpen={!!viewingServicePlan}
          onClose={() => setViewingServicePlan(null)}
          servicePlan={viewingServicePlan}
          services={services}
          onEdit={openEditServicePlan}
        />
      </div>
    </Layout>
  );
}
