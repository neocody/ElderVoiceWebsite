import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Download, DollarSign, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function Billing() {
  const { data: billingData } = useQuery({
    queryKey: ["/api/billing"],
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription"],
  });

  // Mock data for development - replace with real API calls
  const mockBillingData = {
    currentPlan: "Professional Care Plan",
    monthlyAmount: 149.99,
    nextBillingDate: "2025-07-25",
    usageThisMonth: {
      callsPlaced: 87,
      callsIncluded: 100,
      minutesUsed: 432,
      minutesIncluded: 500,
      transcriptionMinutes: 432,
      transcriptionIncluded: 500
    },
    paymentMethod: {
      type: "card",
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2027
    },
    invoices: [
      {
        id: "inv_001",
        date: "2025-06-25",
        amount: 149.99,
        status: "paid",
        description: "Professional Care Plan - June 2025"
      },
      {
        id: "inv_002", 
        date: "2025-05-25",
        amount: 149.99,
        status: "paid",
        description: "Professional Care Plan - May 2025"
      },
      {
        id: "inv_003",
        date: "2025-04-25", 
        amount: 149.99,
        status: "paid",
        description: "Professional Care Plan - April 2025"
      }
    ]
  };

  const data = billingData || mockBillingData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, included: number) => {
    return Math.round((used / included) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">Billing & Subscription</h2>
              <p className="text-textSecondary">Manage your plan, usage, and payment methods</p>
            </div>
            <Button className="bg-primary hover:bg-blue-700">
              <Download className="mr-2" size={16} />
              Download Invoice
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Plan Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.currentPlan}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.monthlyAmount)}/month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(data.nextBillingDate)}</div>
                <p className="text-xs text-muted-foreground">
                  Auto-renewal enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.monthlyAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(data.nextBillingDate)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage This Month */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>Track your current usage against plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Calls Placed</span>
                    <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(data.usageThisMonth.callsPlaced, data.usageThisMonth.callsIncluded))}`}>
                      {data.usageThisMonth.callsPlaced} / {data.usageThisMonth.callsIncluded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${getUsagePercentage(data.usageThisMonth.callsPlaced, data.usageThisMonth.callsIncluded)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getUsagePercentage(data.usageThisMonth.callsPlaced, data.usageThisMonth.callsIncluded)}% used
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Call Minutes</span>
                    <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(data.usageThisMonth.minutesUsed, data.usageThisMonth.minutesIncluded))}`}>
                      {data.usageThisMonth.minutesUsed} / {data.usageThisMonth.minutesIncluded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${getUsagePercentage(data.usageThisMonth.minutesUsed, data.usageThisMonth.minutesIncluded)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getUsagePercentage(data.usageThisMonth.minutesUsed, data.usageThisMonth.minutesIncluded)}% used
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transcription</span>
                    <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(data.usageThisMonth.transcriptionMinutes, data.usageThisMonth.transcriptionIncluded))}`}>
                      {data.usageThisMonth.transcriptionMinutes} / {data.usageThisMonth.transcriptionIncluded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full" 
                      style={{ width: `${getUsagePercentage(data.usageThisMonth.transcriptionMinutes, data.usageThisMonth.transcriptionIncluded)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getUsagePercentage(data.usageThisMonth.transcriptionMinutes, data.usageThisMonth.transcriptionIncluded)}% used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Your current payment method and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {data.paymentMethod.brand} ending in {data.paymentMethod.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {data.paymentMethod.expiryMonth}/{data.paymentMethod.expiryYear}
                    </p>
                  </div>
                </div>
                <Button variant="outline">Update Payment</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your billing history and invoice downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.invoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {invoice.status === 'paid' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <Badge 
                          className={invoice.status === 'paid' 
                            ? "bg-green-100 text-green-800" 
                            : "bg-orange-100 text-orange-800"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </Layout>
  );
}