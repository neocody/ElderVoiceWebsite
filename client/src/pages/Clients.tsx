import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, User, Phone, Mail, CreditCard, Edit3, Search, MoreHorizontal, Trash2, Download, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["individual", "facility"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  billingName: z.string().optional(),
  billingEmail: z.string().email("Valid email required"),
  billingPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().default("US"),
  facilityLicense: z.string().optional(),
  facilityCapacity: z.number().optional(),
  facilityType: z.enum(["nursing_home", "assisted_living", "memory_care", "home_care"]).optional(),
  notes: z.string().optional(),
});

const serviceFormSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  planId: z.number().min(1, "Service plan is required"),
  customPrice: z.number().optional(),
  discountPercent: z.number().min(0).max(100).default(0),
  contractNotes: z.string().optional(),
});

const patientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  preferredName: z.string().optional(),
  primaryPhone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  age: z.number().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  healthStatus: z.string().optional(),
  favoriteTopics: z.string().optional(),
  personalityTraits: z.string().optional(),
  conversationStyle: z.enum(["friendly", "formal", "casual", "professional"]).default("friendly"),
  specialNotes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientFormSchema>;
type ServiceForm = z.infer<typeof serviceFormSchema>;
type PatientForm = z.infer<typeof patientFormSchema>;

export default function Clients() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClientProfile, setViewingClientProfile] = useState<any>(null);
  const [editingClientService, setEditingClientService] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [filterGroup, setFilterGroup] = useState("any");
  const [filterStatus, setFilterStatus] = useState("any");
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [selectedClientForService, setSelectedClientForService] = useState<any>(null);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [selectedClientForPatient, setSelectedClientForPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<any>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: servicePlans = [] } = useQuery({
    queryKey: ['/api/service-plans'],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      type: "individual",
      email: "",
      phone: "",
      billingEmail: "",
      billingCountry: "US",
    },
  });

  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceName: "",
      planId: 0,
      customPrice: undefined,
      discountPercent: 0,
      contractNotes: "",
    },
  });

  const patientForm = useForm<PatientForm>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      preferredName: "",
      primaryPhone: "",
      alternatePhone: "",
      address: "",
      age: undefined,
      gender: undefined,
      healthStatus: "",
      favoriteTopics: "",
      personalityTraits: "",
      conversationStyle: "friendly",
      specialNotes: "",
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      return await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<ClientForm> }) => {
      return await apiRequest("PUT", `/api/clients/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setEditingClient(null);
      form.reset();
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (data: ServiceForm & { clientId: number }) => {
      return await apiRequest("POST", "/api/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsAddServiceDialogOpen(false);
      setSelectedClientForService(null);
      serviceForm.reset();
      toast({
        title: "Success",
        description: "Service added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add service",
        variant: "destructive",
      });
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientForm & { clientId: number }) => {
      return await apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setIsAddPatientDialogOpen(false);
      setSelectedClientForPatient(null);
      patientForm.reset();
      toast({
        title: "Success",
        description: "Patient added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add patient",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setDeleteConfirmClient(null);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (clientIds: number[]) => {
      return await apiRequest("POST", "/api/clients/bulk-delete", { clientIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClients([]);
      setBulkDeleteConfirm(false);
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete clients",
        variant: "destructive",
      });
    },
  });

  const bulkStatusChangeMutation = useMutation({
    mutationFn: async ({ clientIds, status }: { clientIds: number[], status: string }) => {
      return await apiRequest("POST", "/api/clients/bulk-status-change", { clientIds, status });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClients([]);
      setBulkAction(null);
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status",
        variant: "destructive",
      });
    },
  });

  const bulkExportMutation = useMutation({
    mutationFn: async (clientIds: number[]) => {
      return await apiRequest("POST", "/api/clients/bulk-export", { clientIds });
    },
    onSuccess: (data) => {
      // Create and download CSV file
      const csvContent = [
        ["ID", "Name", "Type", "Email", "Phone", "Address", "City", "State", "Status", "Created"].join(","),
        ...data.data.map((client: any) => [
          client.id,
          `"${client.name}"`,
          client.type,
          client.email || "",
          client.phone || "",
          `"${client.billingAddress || ""}"`,
          client.billingCity || "",
          client.billingState || "",
          client.status,
          new Date(client.createdAt).toLocaleDateString()
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSelectedClients([]);
      toast({
        title: "Success",
        description: `${data.data.length} clients exported successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export clients",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientForm) => {
    if (editingClient) {
      updateClientMutation.mutate({
        id: editingClient.id,
        updates: data,
      });
    } else {
      addClientMutation.mutate(data);
    }
  };

  const onServiceSubmit = (data: ServiceForm) => {
    if (selectedClientForService) {
      addServiceMutation.mutate({
        ...data,
        clientId: selectedClientForService.id,
      });
    }
  };

  const openAddServiceDialog = (client: any) => {
    setSelectedClientForService(client);
    setIsAddServiceDialogOpen(true);
    serviceForm.reset({
      serviceName: `${client.name} Service`,
      planId: 0,
      customPrice: undefined,
      discountPercent: 0,
      contractNotes: "",
    });
  };

  const onPatientSubmit = (data: PatientForm) => {
    if (selectedClientForPatient) {
      addPatientMutation.mutate({
        ...data,
        clientId: selectedClientForPatient.id,
      });
    }
  };

  const openAddPatientDialog = (client: any) => {
    setSelectedClientForPatient(client);
    setIsAddPatientDialogOpen(true);
    patientForm.reset();
  };

  const openEditDialog = (client: any) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      type: client.type,
      email: client.email || "",
      phone: client.phone || "",
      billingName: client.billingName || "",
      billingEmail: client.billingEmail,
      billingPhone: client.billingPhone || "",
      billingAddress: client.billingAddress || "",
      billingCity: client.billingCity || "",
      billingState: client.billingState || "",
      billingZip: client.billingZip || "",
      billingCountry: client.billingCountry || "US",
      facilityLicense: client.facilityLicense || "",
      facilityCapacity: client.facilityCapacity || undefined,
      facilityType: client.facilityType || undefined,
      notes: client.notes || "",
    });
  };

  const formatClientType = (type: string) => {
    return type === "individual" ? "Individual" : "Facility";
  };

  const formatFacilityType = (type: string) => {
    switch (type) {
      case "nursing_home": return "Nursing Home";
      case "assisted_living": return "Assisted Living";
      case "memory_care": return "Memory Care";
      case "home_care": return "Home Care";
      default: return type;
    }
  };

  const getClientServices = (clientId: number) => {
    return (services as any[]).filter((service: any) => service.clientId === clientId);
  };

  const getClientPatients = (clientId: number) => {
    return (patients as any[]).filter((patient: any) => patient.clientId === clientId);
  };

  const getPlanName = (planId: number) => {
    const plan = servicePlans.find((p: any) => p.id === planId);
    return plan?.name || "Unknown Plan";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredClients.map((client: any) => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedClients.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select clients first",
        variant: "destructive",
      });
      return;
    }

    switch (action) {
      case "delete":
        setBulkDeleteConfirm(true);
        break;
      case "activate":
        bulkStatusChangeMutation.mutate({ clientIds: selectedClients, status: "active" });
        break;
      case "deactivate":
        bulkStatusChangeMutation.mutate({ clientIds: selectedClients, status: "inactive" });
        break;
      case "export":
        bulkExportMutation.mutate(selectedClients);
        break;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const filteredClients = clients.filter((client: any) => {
    const matchesName = searchName === "" || (client.name && client.name.toLowerCase().includes(searchName.toLowerCase()));
    const matchesEmail = searchEmail === "" || 
      (client.email && client.email.toLowerCase().includes(searchEmail.toLowerCase())) ||
      (client.billingEmail && client.billingEmail.toLowerCase().includes(searchEmail.toLowerCase()));
    const matchesGroup = filterGroup === "any" || client.type === filterGroup;
    const matchesStatus = filterStatus === "any" || (client.status || "inactive") === filterStatus;
    
    return matchesName && matchesEmail && matchesGroup && matchesStatus;
  });



  if (isLoading) {
    return <div className="flex items-center justify-center h-48">Loading clients...</div>;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">View/Search Clients</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" size={16} />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe / Sunset Manor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="client@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Billing Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billingName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Name for billing" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="billing@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Street address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="billingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingZip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ZIP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {form.watch("type") === "facility" && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Facility Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facilityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facility Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select facility type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="nursing_home">Nursing Home</SelectItem>
                                <SelectItem value="assisted_living">Assisted Living</SelectItem>
                                <SelectItem value="memory_care">Memory Care</SelectItem>
                                <SelectItem value="home_care">Home Care</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="facilityCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="Number of residents"
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="facilityLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Facility license number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes about this client" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingClient(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addClientMutation.isPending || updateClientMutation.isPending}
                  >
                    {editingClient ? "Update" : "Add"} Client
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Statistics - Compact on mobile, full on desktop */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-textPrimary">
                {clients.filter((c: any) => c.type === "individual").length}
              </h3>
              <p className="text-textSecondary text-xs">Individual Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-secondary" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-textPrimary">
                {clients.filter((c: any) => c.type === "facility").length}
              </h3>
              <p className="text-textSecondary text-xs">Facility Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-textPrimary">
                {clients.filter((c: any) => c.status === "active").length}
              </h3>
              <p className="text-textSecondary text-xs">Active Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Phone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-textPrimary">
                {clients.length}
              </h3>
              <p className="text-textSecondary text-xs">Total Clients</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Statistics - Horizontal scroll */}
      <div className="md:hidden">
        <div className="flex space-x-3 overflow-x-auto pb-2">
          <Card className="flex-shrink-0 min-w-[140px]">
            <CardContent className="flex items-center p-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {clients.filter((c: any) => c.type === "individual").length}
                </h3>
                <p className="text-textSecondary text-xs">Individual</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 min-w-[140px]">
            <CardContent className="flex items-center p-3">
              <div className="p-1.5 bg-secondary/10 rounded-lg">
                <Building2 className="h-4 w-4 text-secondary" />
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {clients.filter((c: any) => c.type === "facility").length}
                </h3>
                <p className="text-textSecondary text-xs">Facility</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 min-w-[140px]">
            <CardContent className="flex items-center p-3">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Phone className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {clients.length}
                </h3>
                <p className="text-textSecondary text-xs">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Client/Company Name</label>
              <Input
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Client Group</label>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>{filteredClients.length} Records Found, Showing 1 to {filteredClients.length}</span>
        <div className="flex items-center space-x-2">
          <span>Jump to Page:</span>
          <Button variant="outline" size="sm">1</Button>
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-textPrimary mb-2">No clients found</h3>
              <p className="text-textSecondary mb-4">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-gray-700">ID</th>
                      <th className="text-left p-3 font-medium text-gray-700">First Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Last Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Company Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Email Address</th>
                      <th className="text-left p-3 font-medium text-gray-700">Services</th>
                      <th className="text-left p-3 font-medium text-gray-700">Patients</th>
                      <th className="text-left p-3 font-medium text-gray-700">Created</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client: any, index: number) => {
                      const nameParts = client.name.split(' ');
                      const firstName = nameParts[0] || '';
                      const lastName = nameParts.slice(1).join(' ') || '';
                      const companyName = client.type === 'facility' ? client.name : '';
                      
                      return (
                        <tr
                          key={client.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setViewingClientProfile(client)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectClient(client.id, e.target.checked);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 text-blue-600 font-medium">{client.id}</td>
                          <td className="p-3 text-blue-600">{firstName}</td>
                          <td className="p-3 text-blue-600">{lastName}</td>
                          <td className="p-3">{companyName}</td>
                          <td className="p-3">{client.email || client.billingEmail || '-'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span>{getClientServices(client.id).length}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddServiceDialog(client);
                                }}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span>{getClientPatients(client.id).length}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddPatientDialog(client);
                                }}
                                className="text-xs"
                              >
                                <User className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            {new Date().toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={(client.status || "inactive") === "active" ? "default" : "secondary"}
                              className={(client.status || "inactive") === "active" ? "bg-green-100 text-green-800" : ""}
                            >
                              {(client.status || "inactive").toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(client);
                                }}
                                className="text-xs"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmClient(client);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bulk Actions */}
              {selectedClients.length > 0 && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedClients.length} client(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Bulk Actions
                            <MoreHorizontal className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleBulkAction("activate")}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Mark as Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkAction("deactivate")}>
                            <Square className="mr-2 h-4 w-4" />
                            Mark as Inactive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                            <Download className="mr-2 h-4 w-4" />
                            Export to CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleBulkAction("delete")}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="border-t p-4 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>« Previous Page</Button>
                  <Button variant="default" size="sm">1</Button>
                  <Button variant="outline" size="sm" disabled>Next Page »</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Profile Dialog */}
      <Dialog open={!!viewingClientProfile} onOpenChange={() => setViewingClientProfile(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingClientProfile?.name} - Profile</DialogTitle>
          </DialogHeader>
          
          {viewingClientProfile && (
            <div className="space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Client Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Name:</label>
                      {isEditingProfile ? (
                        <Input 
                          defaultValue={viewingClientProfile.name}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-textPrimary">{viewingClientProfile.name}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Type:</label>
                      {isEditingProfile ? (
                        <Select defaultValue={viewingClientProfile.type}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="facility">Facility</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-textPrimary">{formatClientType(viewingClientProfile.type)}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Email:</label>
                      {isEditingProfile ? (
                        <Input 
                          type="email"
                          defaultValue={viewingClientProfile.email || ""}
                          className="w-full"
                          placeholder="client@example.com"
                        />
                      ) : (
                        <span className="text-textPrimary">{viewingClientProfile.email || "-"}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Phone:</label>
                      {isEditingProfile ? (
                        <Input 
                          defaultValue={viewingClientProfile.phone || ""}
                          className="w-full"
                          placeholder="(555) 123-4567"
                        />
                      ) : (
                        <span className="text-textPrimary">{viewingClientProfile.phone || "-"}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Billing Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Billing Email:</label>
                      {isEditingProfile ? (
                        <Input 
                          type="email"
                          defaultValue={viewingClientProfile.billingEmail}
                          className="w-full"
                          placeholder="billing@example.com"
                        />
                      ) : (
                        <span className="text-textPrimary">{viewingClientProfile.billingEmail}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Billing Name:</label>
                      {isEditingProfile ? (
                        <Input 
                          defaultValue={viewingClientProfile.billingName || ""}
                          className="w-full"
                          placeholder="Billing contact name"
                        />
                      ) : (
                        <span className="text-textPrimary">{viewingClientProfile.billingName || "-"}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-600 block mb-1">Address:</label>
                      {isEditingProfile ? (
                        <div className="space-y-2">
                          <Textarea 
                            defaultValue={viewingClientProfile.billingAddress || ""}
                            placeholder="Street address"
                            className="w-full"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input 
                              defaultValue={viewingClientProfile.billingCity || ""}
                              placeholder="City"
                            />
                            <Input 
                              defaultValue={viewingClientProfile.billingState || ""}
                              placeholder="State"
                            />
                            <Input 
                              defaultValue={viewingClientProfile.billingZip || ""}
                              placeholder="ZIP"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-textPrimary">
                          {viewingClientProfile.billingAddress ? (
                            <div className="text-sm">
                              {viewingClientProfile.billingAddress}<br />
                              {viewingClientProfile.billingCity}, {viewingClientProfile.billingState} {viewingClientProfile.billingZip}
                            </div>
                          ) : (
                            "-"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Services */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Active Services</h3>
                  <Button 
                    size="sm"
                    onClick={() => openAddServiceDialog(viewingClientProfile)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </div>
                
                {getClientServices(viewingClientProfile.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No active services for this client</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getClientServices(viewingClientProfile.id).map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.serviceName}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Plan: {getPlanName(service.planId)}</p>
                            <p>Price: {formatPrice(service.monthlyPrice)}/month</p>
                            <p>Schedule: {service.frequency} at {service.timeOfDay}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={service.status === "active" ? "default" : "secondary"}>
                            {service.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingClientService(service)}
                          >
                            Edit Service
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patients */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Patients</h3>
                  <Button 
                    size="sm"
                    onClick={() => openAddPatientDialog(viewingClientProfile)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </div>
                
                {getClientPatients(viewingClientProfile.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No patients registered for this client</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getClientPatients(viewingClientProfile.id).map((patient: any) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{patient.name}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Preferred Name: {patient.preferredName || "Not specified"}</p>
                            <p>Phone: {patient.primaryPhone || "Not provided"}</p>
                            <p>Age: {patient.age || "Not specified"}</p>
                            <p>Style: {patient.conversationStyle || "Friendly"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Active
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPatient(patient)}
                          >
                            Edit Patient
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setViewingClientProfile(null);
                  setIsEditingProfile(false);
                }}>
                  Close
                </Button>
                {isEditingProfile ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Handle save client info
                      toast({
                        title: "Coming Soon",
                        description: "Save functionality will be implemented",
                      });
                      setIsEditingProfile(false);
                    }}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmClient(viewingClientProfile)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Client
                    </Button>
                    <Button onClick={() => setIsEditingProfile(true)}>
                      Edit Client Info
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Service Dialog */}
      <Dialog open={!!editingClientService} onOpenChange={() => setEditingClientService(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service: {editingClientService?.serviceName}</DialogTitle>
          </DialogHeader>
          
          {editingClientService && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Changes made here only apply to this specific client service and will not affect the template service plan.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle client-specific service update
                  toast({
                    title: "Coming Soon",
                    description: "Client-specific service editing will be implemented",
                  });
                }} className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Service Name</label>
                      <Input 
                        defaultValue={editingClientService.serviceName}
                        placeholder="Custom service name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Monthly Price</label>
                      <Input 
                        type="number"
                        step="0.01"
                        defaultValue={editingClientService.monthlyPrice}
                        placeholder="99.99"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Frequency</label>
                      <Select defaultValue={editingClientService.frequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Time of Day</label>
                      <Input 
                        defaultValue={editingClientService.timeOfDay}
                        placeholder="9:00 AM"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Select defaultValue={editingClientService.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Schedule Active</label>
                      <Select defaultValue={editingClientService.isScheduleActive ? "yes" : "no"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <Textarea 
                      defaultValue={editingClientService.notes || ""}
                      placeholder="Special instructions or notes for this service"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingClientService(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Service
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client: {editingClient?.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Same form fields as add dialog */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe / Sunset Manor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingClient(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateClientMutation.isPending}
                >
                  Update Client
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Service for {selectedClientForService?.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="AI Companion Service" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={serviceForm.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Plan *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servicePlans.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name} - ${(plan.basePrice / 100).toFixed(2)}/month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Price (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Override plan price"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={serviceForm.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={serviceForm.control}
                name="contractNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Special contract terms, notes, or instructions"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddServiceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addServiceMutation.isPending}
                >
                  {addServiceMutation.isPending ? "Adding..." : "Add Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Patient for {selectedClientForPatient?.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...patientForm}>
            <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patientForm.control}
                  name="preferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Johnny" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 (555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patientForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          max="120"
                          placeholder="75"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={patientForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main St, City, State 12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patientForm.control}
                  name="conversationStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversation Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={patientForm.control}
                name="favoriteTopics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Topics</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="What does this person enjoy talking about? (e.g., gardening, family, travel, music)"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={patientForm.control}
                name="specialNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any special care instructions, medical considerations, or important notes"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddPatientDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPatientMutation.isPending}
                >
                  {addPatientMutation.isPending ? "Adding..." : "Add Patient"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmClient} onOpenChange={() => setDeleteConfirmClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmClient?.name}"? This action cannot be undone and will remove all associated services, patients, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteConfirmClient) {
                  deleteClientMutation.mutate(deleteConfirmClient.id);
                }
              }}
              disabled={deleteClientMutation.isPending}
            >
              {deleteClientMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClients.length} client(s)? This action cannot be undone and will remove all associated services, patients, and data for these clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => bulkDeleteMutation.mutate(selectedClients)}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedClients.length} Clients`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </Layout>
  );
}