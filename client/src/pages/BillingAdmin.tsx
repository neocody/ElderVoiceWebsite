import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import AdminTabs from "@/components/AdminTabs";
import { useAuth } from "@/hooks/useAuth";
import {
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  Building2,
  Receipt,
  Target,
  AlertCircle,
} from "lucide-react";

// TypeScript interfaces for billing data
interface Subscription {
  id: number;
  userId: string;
  amount: number;
  planName: string;
  facilityId: string | null;
  planId: string;
  status: string;
  patientCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface BillingTransaction {
  id: number;
  subscriptionId: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  description: string;
  processedAt: string;
  createdAt: string;
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

export default function BillingAdmin() {
  const { isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  const billingTabs = [
    { id: "overview", label: "Overview", icon: DollarSign },
    { id: "subscriptions", label: "Subscriptions", icon: Users },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Fetch billing data with proper error handling
  const { data: billingStats, isLoading: statsLoading } =
    useQuery<BillingStats>({
      queryKey: ["billing", "stats"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/stats/billing");
        return response.json();
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } =
    useQuery<Subscription[]>({
      queryKey: ["billing", "subscriptions"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/billing/subscriptions");
        return response.json();
      },
    });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<
    BillingTransaction[]
  >({
    queryKey: ["billing", "transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/billing/transactions");
      return response.json();
    },
  });

  const { data: billingSettings } = useQuery({
    queryKey: ["billing", "settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/billing/settings");
      return response.json();
    },
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await apiRequest(
        "PUT",
        "/api/billing/settings",
        settingsData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
      toast({
        title: "Success",
        description: "Billing settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update billing settings",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      trialing: "bg-blue-100 text-blue-800",
      canceled: "bg-red-100 text-red-800",
      incomplete: "bg-yellow-100 text-yellow-800",
      past_due: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      open: "bg-yellow-100 text-yellow-800",
      draft: "bg-gray-100 text-gray-800",
      void: "bg-red-100 text-red-800",
      uncollectible: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Billing Administration
                  </h1>
                  <p className="text-muted-foreground">
                    Configure billing settings and monitor transactions
                  </p>
                </div>
              </div>

              <AdminTabs
                tabs={billingTabs}
                activeTab={selectedTab}
                onTabChange={setSelectedTab}
                className="mb-6"
              />

              {selectedTab === "overview" && (
                <div className="space-y-6">
                  {/* Revenue Statistics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statsLoading ? (
                            <div className="animate-pulse bg-muted h-6 w-20 rounded" />
                          ) : (
                            formatCurrency(billingStats?.totalRevenue || 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Monthly Revenue
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statsLoading ? (
                            <div className="animate-pulse bg-muted h-6 w-20 rounded" />
                          ) : (
                            formatCurrency(billingStats?.monthlyRevenue || 0)
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Active Subscriptions
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statsLoading ? (
                            <div className="animate-pulse bg-muted h-6 w-16 rounded" />
                          ) : (
                            billingStats?.activeSubscriptions || 0
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Trial Subscriptions
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statsLoading ? (
                            <div className="animate-pulse bg-muted h-6 w-16 rounded" />
                          ) : (
                            billingStats?.trialSubscriptions || 0
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Transactions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>
                        Latest billing transactions and payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse flex space-x-4"
                            >
                              <div className="bg-muted h-4 w-20 rounded" />
                              <div className="bg-muted h-4 w-16 rounded" />
                              <div className="bg-muted h-4 w-12 rounded" />
                              <div className="bg-muted h-4 w-32 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.slice(0, 5).map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  {formatDate(transaction.createdAt)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    transaction.amountPaid ??
                                      transaction.amountDue,
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(transaction.status)}
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedTab === "subscriptions" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Active Subscriptions</h2>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Management</CardTitle>
                      <CardDescription>
                        Monitor and manage all active subscriptions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscriptionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse flex space-x-4"
                            >
                              <div className="bg-muted h-4 w-24 rounded" />
                              <div className="bg-muted h-4 w-16 rounded" />
                              <div className="bg-muted h-4 w-12 rounded" />
                              <div className="bg-muted h-4 w-8 rounded" />
                              <div className="bg-muted h-4 w-20 rounded" />
                              <div className="bg-muted h-4 w-20 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User/Facility</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Patients</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Next Billing</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subscriptions.map((subscription) => (
                              <TableRow key={subscription.id}>
                                <TableCell>
                                  {subscription.facilityId ||
                                    subscription.userId}
                                </TableCell>
                                <TableCell>{subscription.planName}</TableCell>
                                <TableCell>
                                  {getStatusBadge(subscription.status)}
                                </TableCell>
                                <TableCell>
                                  {subscription.patientCount}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(subscription.amount)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(subscription.currentPeriodEnd)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedTab === "transactions" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Transaction History</h2>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>All Transactions</CardTitle>
                      <CardDescription>
                        Complete transaction history and payment records
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(15)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse flex space-x-4"
                            >
                              <div className="bg-muted h-4 w-20 rounded" />
                              <div className="bg-muted h-4 w-16 rounded" />
                              <div className="bg-muted h-4 w-16 rounded" />
                              <div className="bg-muted h-4 w-12 rounded" />
                              <div className="bg-muted h-4 w-32 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Subscription ID</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  {formatDate(transaction.createdAt)}
                                </TableCell>
                                <TableCell>
                                  {transaction.subscriptionId}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    transaction.amountPaid ??
                                      transaction.amountDue,
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(transaction.status)}
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedTab === "settings" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Billing Settings</h2>
                  </div>

                  <BillingSettingsForm
                    settings={billingSettings}
                    onSubmit={(data: any) =>
                      updateSettingsMutation.mutate(data)
                    }
                    isSubmitting={updateSettingsMutation.isPending}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

// Billing Settings Form Component with comprehensive features
function BillingSettingsForm({ settings, onSubmit, isSubmitting }: any) {
  const [activeTab, setActiveTab] = useState("invoice-payment");
  const [formData, setFormData] = useState({
    // Invoice & Payment Settings
    invoiceDueDays: settings?.invoiceDueDays?.toString() || "7",
    latePaymentGracePeriod: settings?.latePaymentGracePeriod?.toString() || "3",
    paymentRetryAttempts: settings?.paymentRetryAttempts?.toString() || "3",
    paymentRetryIntervalDays:
      settings?.paymentRetryIntervalDays?.toString() || "2",
    autoSuspendDays: settings?.autoSuspendDays?.toString() || "30",
    invoiceReminderDaysBefore:
      settings?.invoiceReminderDaysBefore?.toString() || "3",
    invoiceReminderDaysAfter:
      settings?.invoiceReminderDaysAfter?.toString() || "1",
    enableAdminAlerts: settings?.enableAdminAlerts ?? true,
    adminAlertEmail: settings?.adminAlertEmail || "",
    // Payment Methods
    enableCreditCard: settings?.enableCreditCard ?? true,
    enableACH: settings?.enableACH ?? false,
    enablePayPal: settings?.enablePayPal ?? false,
    enableAutoPayDefault: settings?.enableAutoPayDefault ?? true,
    // Facility-Specific Settings
    facilityBillingType: settings?.facilityBillingType || "postpaid",
    enableInvoiceRollup: settings?.enableInvoiceRollup ?? true,
    // Service Mapping
    maxPatientsPerIndividual:
      settings?.maxPatientsPerIndividual?.toString() || "5",
    maxCallMinutesPerMonth:
      settings?.maxCallMinutesPerMonth?.toString() || "1000",
    enableSentimentReporting: settings?.enableSentimentReporting ?? true,
    enableMultiLanguageSupport: settings?.enableMultiLanguageSupport ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      // Invoice & Payment Settings
      invoiceDueDays: parseInt(formData.invoiceDueDays),
      latePaymentGracePeriod: parseInt(formData.latePaymentGracePeriod),
      paymentRetryAttempts: parseInt(formData.paymentRetryAttempts),
      paymentRetryIntervalDays: parseInt(formData.paymentRetryIntervalDays),
      autoSuspendDays: parseInt(formData.autoSuspendDays),
      invoiceReminderDaysBefore: parseInt(formData.invoiceReminderDaysBefore),
      invoiceReminderDaysAfter: parseInt(formData.invoiceReminderDaysAfter),
      enableAdminAlerts: formData.enableAdminAlerts,
      adminAlertEmail: formData.adminAlertEmail || null,
      // Payment Methods
      enableCreditCard: formData.enableCreditCard,
      enableACH: formData.enableACH,
      enablePayPal: formData.enablePayPal,
      enableAutoPayDefault: formData.enableAutoPayDefault,
      // Facility-Specific Settings
      facilityBillingType: formData.facilityBillingType,
      enableInvoiceRollup: formData.enableInvoiceRollup,
      // Service Mapping
      maxPatientsPerIndividual: parseInt(formData.maxPatientsPerIndividual),
      maxCallMinutesPerMonth: parseInt(formData.maxCallMinutesPerMonth),
      enableSentimentReporting: formData.enableSentimentReporting,
      enableMultiLanguageSupport: formData.enableMultiLanguageSupport,
    };
    onSubmit(submitData);
  };

  const settingsTabs = [
    { id: "invoice-payment", label: "Invoice & Payment", icon: Receipt },
    { id: "facility", label: "Facility Settings", icon: Building2 },
    { id: "service-mapping", label: "Service Mapping", icon: Target },
    { id: "audit-logs", label: "Audit Logs", icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Invoice & Payment Settings Tab */}
        {activeTab === "invoice-payment" && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice & Payment Settings</CardTitle>
              <CardDescription>
                Configure payment terms, retry logic, and notification
                preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDueDays">
                    Payment Terms (Net Days)
                  </Label>
                  <Input
                    id="invoiceDueDays"
                    type="number"
                    value={formData.invoiceDueDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiceDueDays: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Days until invoice is due
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latePaymentGracePeriod">
                    Late Payment Grace Period (days)
                  </Label>
                  <Input
                    id="latePaymentGracePeriod"
                    type="number"
                    value={formData.latePaymentGracePeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latePaymentGracePeriod: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Days before service restriction
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentRetryAttempts">
                    Payment Retry Attempts
                  </Label>
                  <Input
                    id="paymentRetryAttempts"
                    type="number"
                    value={formData.paymentRetryAttempts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentRetryAttempts: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentRetryIntervalDays">
                    Retry Interval (days)
                  </Label>
                  <Input
                    id="paymentRetryIntervalDays"
                    type="number"
                    value={formData.paymentRetryIntervalDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentRetryIntervalDays: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoSuspendDays">
                  Auto-Suspend Threshold (days past due)
                </Label>
                <Input
                  id="autoSuspendDays"
                  type="number"
                  value={formData.autoSuspendDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoSuspendDays: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Days past due before account is automatically suspended
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceReminderDaysBefore">
                      Reminder Days Before Due
                    </Label>
                    <Input
                      id="invoiceReminderDaysBefore"
                      type="number"
                      value={formData.invoiceReminderDaysBefore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoiceReminderDaysBefore: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceReminderDaysAfter">
                      Reminder Days After Due
                    </Label>
                    <Input
                      id="invoiceReminderDaysAfter"
                      type="number"
                      value={formData.invoiceReminderDaysAfter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoiceReminderDaysAfter: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAdminAlerts"
                    checked={formData.enableAdminAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableAdminAlerts: checked })
                    }
                  />
                  <Label htmlFor="enableAdminAlerts">
                    Enable admin alerts for payment failures
                  </Label>
                </div>

                {formData.enableAdminAlerts && (
                  <div className="space-y-2">
                    <Label htmlFor="adminAlertEmail">Admin Alert Email</Label>
                    <Input
                      id="adminAlertEmail"
                      type="email"
                      value={formData.adminAlertEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          adminAlertEmail: e.target.value,
                        })
                      }
                      placeholder="admin@example.com"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Accepted Payment Methods
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCreditCard"
                      checked={formData.enableCreditCard}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableCreditCard: checked })
                      }
                    />
                    <Label htmlFor="enableCreditCard">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableACH"
                      checked={formData.enableACH}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableACH: checked })
                      }
                    />
                    <Label htmlFor="enableACH">ACH Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enablePayPal"
                      checked={formData.enablePayPal}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enablePayPal: checked })
                      }
                    />
                    <Label htmlFor="enablePayPal">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAutoPayDefault"
                      checked={formData.enableAutoPayDefault}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableAutoPayDefault: checked,
                        })
                      }
                    />
                    <Label htmlFor="enableAutoPayDefault">
                      Enable auto-pay by default
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facility-Specific Settings Tab */}
        {activeTab === "facility" && (
          <Card>
            <CardHeader>
              <CardTitle>Facility-Specific Settings</CardTitle>
              <CardDescription>
                Configure billing behavior for care facilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Facility Billing Type</Label>
                  <Select
                    value={formData.facilityBillingType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        facilityBillingType: value as "prepaid" | "postpaid",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">
                        Prepaid (Bill before usage)
                      </SelectItem>
                      <SelectItem value="postpaid">
                        Postpaid (Bill after usage)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableInvoiceRollup"
                    checked={formData.enableInvoiceRollup}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableInvoiceRollup: checked })
                    }
                  />
                  <Label htmlFor="enableInvoiceRollup">
                    Enable invoice rollup (combine all resident usage into
                    single invoice)
                  </Label>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    Facility Billing Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Custom Per-User Pricing</p>
                      <p className="text-muted-foreground">
                        Override default pricing for specific facilities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Billing Contact Management</p>
                      <p className="text-muted-foreground">
                        Separate billing contacts and CC emails for finance
                        teams
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Purchase Order Support</p>
                      <p className="text-muted-foreground">
                        Track PO numbers and custom payment terms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Service Mapping Tab */}
        {activeTab === "service-mapping" && (
          <Card>
            <CardHeader>
              <CardTitle>Product/Service Mapping</CardTitle>
              <CardDescription>
                Configure what features and limits are included with plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPatientsPerIndividual">
                    Max Patients per Individual Plan
                  </Label>
                  <Input
                    id="maxPatientsPerIndividual"
                    type="number"
                    value={formData.maxPatientsPerIndividual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPatientsPerIndividual: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCallMinutesPerMonth">
                    Max Call Minutes per Month
                  </Label>
                  <Input
                    id="maxCallMinutesPerMonth"
                    type="number"
                    value={formData.maxCallMinutesPerMonth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCallMinutesPerMonth: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add-on Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSentimentReporting"
                      checked={formData.enableSentimentReporting}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableSentimentReporting: checked,
                        })
                      }
                    />
                    <Label htmlFor="enableSentimentReporting">
                      Sentiment Analysis & Reporting
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMultiLanguageSupport"
                      checked={formData.enableMultiLanguageSupport}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          enableMultiLanguageSupport: checked,
                        })
                      }
                    />
                    <Label htmlFor="enableMultiLanguageSupport">
                      Multi-language Support
                    </Label>
                  </div>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    Plan Feature Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>
                    Each service plan can have specific features enabled with
                    custom limits. Use the Plans tab to configure individual
                    plan features including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Number of active patients allowed</li>
                    <li>Included call minutes and overage pricing</li>
                    <li>Maximum calls per day/month</li>
                    <li>Custom voice options and API access</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit-logs" && <BillingAuditLogs />}

        {/* Submit Button */}
        {activeTab !== "audit-logs" && (
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Settings..." : "Save All Settings"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

// Billing Audit Logs Component
function BillingAuditLogs() {
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["/api/billing/audit-logs"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-green-600";
      case "updated":
        return "text-blue-600";
      case "deleted":
        return "text-red-600";
      case "failed":
        return "text-yellow-600";
      case "suspended":
        return "text-orange-600";
      case "reactivated":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatChanges = (previousData: any, newData: any) => {
    if (!previousData || !newData) return null;

    const changes = [];
    for (const key in newData) {
      if (previousData[key] !== newData[key]) {
        changes.push({
          field: key,
          old: previousData[key],
          new: newData[key],
        });
      }
    }
    return changes;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Audit Logs</CardTitle>
        <CardDescription>
          Track all billing-related changes and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(auditLogs as any[]).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No audit logs available
            </p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(auditLogs) &&
                auditLogs.map((log: any) => (
                  <Card key={log.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {log.entityType}
                            </span>
                            <span
                              className={`text-sm font-medium ${getActionColor(log.action)}`}
                            >
                              {log.action}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.userEmail || "System"} •{" "}
                            {formatDate(log.createdAt)}
                          </p>
                          {log.notes && (
                            <p className="text-sm mt-2">{log.notes}</p>
                          )}
                          {log.previousData && log.newData && (
                            <div className="mt-3 space-y-1">
                              <p className="text-sm font-medium">Changes:</p>
                              {formatChanges(
                                log.previousData,
                                log.newData,
                              )?.map((change: any, idx: number) => (
                                <div key={idx} className="text-xs pl-4">
                                  <span className="text-muted-foreground">
                                    {change.field}:
                                  </span>{" "}
                                  <span className="line-through text-red-600">
                                    {change.old}
                                  </span>{" "}
                                  →{" "}
                                  <span className="text-green-600">
                                    {change.new}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {log.ipAddress && (
                          <div className="text-xs text-muted-foreground">
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
