import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  PhoneCall,
  Mic,
  MessageSquare
} from "lucide-react";

type AccountType = "individual" | "facility";
type UserRole = "family_member" | "caregiver" | "administrator" | "facility_manager";

interface Facility {
  id: string;
  name: string;
  type: "nursing_home" | "assisted_living" | "memory_care" | "home_care";
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  licenseNumber: string;
  capacity: number;
  currentResidents: number;
  managerId?: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  accountType: AccountType;
  facilityId?: string;
  facilityName?: string;
  status: "active" | "pending" | "suspended";
  lastLogin?: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // AI Configuration state
  const [testCallPhone, setTestCallPhone] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [masterPrompt, setMasterPrompt] = useState("");
  const [isTestCallLoading, setIsTestCallLoading] = useState(false);

  // Fetch admin data
  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/admin/facilities"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ["/api/admin/pending-approvals"],
  });

  // Fetch master prompt when AI config tab is selected
  const { data: masterPromptData } = useQuery({
    queryKey: ["/api/admin/master-prompt"],
    enabled: selectedTab === "ai-config",
  });

  // Mutations
  const createFacilityMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("/api/admin/facilities", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowCreateFacility(false);
      toast({
        title: "Facility Created",
        description: "The facility has been successfully created.",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("/api/admin/users", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowCreateUser(false);
      toast({
        title: "User Created",
        description: "The user account has been successfully created.",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ type, id, status }: { type: "facility" | "user", id: string, status: string }) => {
      await apiRequest(`/api/admin/${type}s/${id}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Status Updated",
        description: "The status has been successfully updated.",
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string, approved: boolean }) => {
      await apiRequest(`/api/admin/approve/${id}`, "PATCH", { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Request Processed",
        description: "The approval request has been processed.",
      });
    },
  });

  // Test call mutation
  const testCallMutation = useMutation({
    mutationFn: async (data: { phone: string, voice: string, prompt?: string }) => {
      await apiRequest("/api/admin/test-call", "POST", data);
    },
    onSuccess: () => {
      setTestCallPhone("");
      toast({
        title: "Test Call Initiated",
        description: "The test call has been initiated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Call Failed",
        description: error.message || "Failed to initiate test call. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Master prompt mutation
  const updateMasterPromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      await apiRequest("/api/admin/master-prompt", "PUT", { prompt });
    },
    onSuccess: () => {
      toast({
        title: "Master Prompt Updated",
        description: "The master conversation prompt has been updated successfully.",
      });
    },
  });

  // Load master prompt when data is available
  useEffect(() => {
    if (masterPromptData?.prompt && selectedTab === "ai-config") {
      setMasterPrompt(masterPromptData.prompt);
    }
  }, [masterPromptData, selectedTab]);

  const CreateFacilityForm = () => {
    const [formData, setFormData] = useState({
      name: "",
      type: "nursing_home",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      licenseNumber: "",
      capacity: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createFacilityMutation.mutate({
        ...formData,
        capacity: parseInt(formData.capacity),
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Facility Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Facility Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nursing_home">Nursing Home</SelectItem>
                <SelectItem value="assisted_living">Assisted Living</SelectItem>
                <SelectItem value="memory_care">Memory Care</SelectItem>
                <SelectItem value="home_care">Home Care Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setShowCreateFacility(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createFacilityMutation.isPending}>
            {createFacilityMutation.isPending ? "Creating..." : "Create Facility"}
          </Button>
        </div>
      </form>
    );
  };

  const CreateUserForm = () => {
    const [formData, setFormData] = useState({
      email: "",
      firstName: "",
      lastName: "",
      role: "caregiver",
      accountType: "individual",
      facilityId: "",
      tempPassword: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createUserMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family_member">Family Member</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="facility_manager">Facility Manager</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => setFormData({ ...formData, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.accountType === "facility" && (
          <div>
            <Label htmlFor="facilityId">Facility</Label>
            <Select
              value={formData.facilityId}
              onValueChange={(value) => setFormData({ ...formData, facilityId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility: Facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="tempPassword">Temporary Password</Label>
          <Input
            id="tempPassword"
            type="password"
            value={formData.tempPassword}
            onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
            placeholder="User will be required to change on first login"
            required
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      suspended: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFacilityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Panel</h2>
          <p className="text-muted-foreground">
            Manage facilities, users, and platform operations
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalFacilities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{adminStats?.newFacilitiesThisMonth || 0} this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{adminStats?.newUsersThisMonth || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${adminStats?.monthlyRevenue || 0} MRR
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApprovals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminStats?.recentActivity?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">{activity.description}</p>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {activity.time}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice Services</span>
                    <Badge variant="secondary">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Dev Mode
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Facilities Management</h3>
            <Dialog open={showCreateFacility} onOpenChange={setShowCreateFacility}>
              <DialogTrigger asChild>
                <Button>
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Facility
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Facility</DialogTitle>
                  <DialogDescription>
                    Add a new care facility to the platform
                  </DialogDescription>
                </DialogHeader>
                <CreateFacilityForm />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((facility: Facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell>{formatFacilityType(facility.type)}</TableCell>
                      <TableCell>{facility.city}, {facility.state}</TableCell>
                      <TableCell>{facility.currentResidents}/{facility.capacity}</TableCell>
                      <TableCell>{getStatusBadge(facility.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Select
                            value={facility.status}
                            onValueChange={(status) => 
                              updateStatusMutation.mutate({ type: "facility", id: facility.id, status })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">User Management</h3>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user account to the platform
                  </DialogDescription>
                </DialogHeader>
                <CreateUserForm />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: AdminUser) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
                      </TableCell>
                      <TableCell>{user.facilityName || "-"}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Select
                            value={user.status}
                            onValueChange={(status) => 
                              updateStatusMutation.mutate({ type: "user", id: user.id, status })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Pending Approvals</h3>
            <Badge variant="secondary">{pendingApprovals.length} pending</Badge>
          </div>

          <div className="space-y-4">
            {pendingApprovals.map((request: any) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.type} Registration</CardTitle>
                      <CardDescription>
                        Submitted on {new Date(request.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Applicant Information</h4>
                      <p><strong>Name:</strong> {request.name}</p>
                      <p><strong>Email:</strong> {request.email}</p>
                      <p><strong>Phone:</strong> {request.phone}</p>
                      {request.facilityName && (
                        <p><strong>Facility:</strong> {request.facilityName}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Request Details</h4>
                      <p><strong>Role:</strong> {request.role}</p>
                      <p><strong>Account Type:</strong> {request.accountType}</p>
                      {request.notes && (
                        <p><strong>Notes:</strong> {request.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => approveRequestMutation.mutate({ id: request.id, approved: false })}
                      disabled={approveRequestMutation.isPending}
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => approveRequestMutation.mutate({ id: request.id, approved: true })}
                      disabled={approveRequestMutation.isPending}
                    >
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {pendingApprovals.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    There are no pending approval requests at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Test Call Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Test Call System
                </CardTitle>
                <CardDescription>
                  Test the AI calling system with a phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testPhone">Phone Number</Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={testCallPhone}
                    onChange={(e) => setTestCallPhone(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="voiceSelect">AI Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                      <SelectItem value="echo">Echo (Male)</SelectItem>
                      <SelectItem value="fable">Fable (British)</SelectItem>
                      <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                      <SelectItem value="nova">Nova (Female)</SelectItem>
                      <SelectItem value="shimmer">Shimmer (Feminine)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => {
                    if (testCallPhone.trim()) {
                      testCallMutation.mutate({
                        phone: testCallPhone,
                        voice: selectedVoice,
                        prompt: masterPrompt
                      });
                    }
                  }}
                  disabled={!testCallPhone.trim() || testCallMutation.isPending}
                  className="w-full"
                >
                  {testCallMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Initiating Call...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4 mr-2" />
                      Start Test Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Voice Settings
                </CardTitle>
                <CardDescription>
                  Configure AI voice parameters for all calls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy - Neutral, clear</SelectItem>
                      <SelectItem value="echo">Echo - Male, warm</SelectItem>
                      <SelectItem value="fable">Fable - British accent</SelectItem>
                      <SelectItem value="onyx">Onyx - Deep, authoritative</SelectItem>
                      <SelectItem value="nova">Nova - Female, friendly</SelectItem>
                      <SelectItem value="shimmer">Shimmer - Soft, caring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Voice Characteristics</Label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Speed: Natural conversation pace</div>
                    <div>• Tone: Warm and caring</div>
                    <div>• Style: Patient and understanding</div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Voice Settings
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Master Prompts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Master Conversation Prompts
              </CardTitle>
              <CardDescription>
                Configure the AI's conversation templates and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="masterPrompt">Primary Conversation Template</Label>
                  <textarea
                    id="masterPrompt"
                    className="w-full h-32 p-3 border rounded-md resize-none"
                    placeholder="You are a caring AI companion calling to check on an elderly person. Be warm, patient, and engaging. Ask about their day, health, and wellbeing. Listen actively and respond with empathy..."
                    value={masterPrompt}
                    onChange={(e) => setMasterPrompt(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMasterPromptMutation.mutate(masterPrompt)}
                    disabled={updateMasterPromptMutation.isPending}
                  >
                    {updateMasterPromptMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Template"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setMasterPrompt("")}>
                    Reset to Default
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Conversation Guidelines</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Always be warm and caring</li>
                    <li>• Ask open-ended questions</li>
                    <li>• Listen actively to responses</li>
                    <li>• Show genuine interest</li>
                    <li>• Keep conversations natural</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Safety Protocols</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Never provide medical advice</li>
                    <li>• Escalate emergencies immediately</li>
                    <li>• Respect privacy and boundaries</li>
                    <li>• Document concerning responses</li>
                    <li>• Follow data protection guidelines</li>
                  </ul>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}