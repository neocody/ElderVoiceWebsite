import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import EmailTemplateBuilder from "@/components/EmailTemplateBuilder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Mail, Edit, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmailTemplate } from "@/types/emailTemplateTypes";

export default function EmailTemplates() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/notification-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/notification-templates",
        templateData,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notification-templates"],
      });
      setShowBuilder(false);
      setIsCreating(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Created",
        description: "Email template created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Create template error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Creation Error",
        description: "Failed to create email template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: any) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/notification-templates/${id}`,
        templateData,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notification-templates"],
      });
      setShowBuilder(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Updated",
        description: "Email template updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Error",
        description: "Failed to update email template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/notification-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notification-templates"],
      });
      toast({
        title: "Template Deleted",
        description: "Email template deleted successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Delete Error",
        description: "Failed to delete email template.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setShowBuilder(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setShowBuilder(true);
  };

  const handleSaveTemplate = (templateData: any) => {
    if (isCreating) {
      createTemplateMutation.mutate({
        ...templateData,
        isActive: true,
        emailEnabled: true,
        smsEnabled: false,
      });
    } else if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        ...templateData,
      });
    }
  };

  if (showBuilder) {
    return (
      <EmailTemplateBuilder
        template={selectedTemplate || undefined}
        onSave={handleSaveTemplate}
        onClose={() => {
          setShowBuilder(false);
          setSelectedTemplate(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">
                Email Templates
              </h2>
              <p className="text-textSecondary">
                Manage and customize email notification templates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
        </header>

        {/* Templates Grid */}
        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: EmailTemplate) => (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || template.emailSubject}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>Subject:</strong> {template.emailSubject}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Target Users:</span>
                        <div className="flex flex-wrap gap-1">
                          {template.targetUserTypes
                            ?.slice(0, 2)
                            .map((userType) => (
                              <Badge
                                key={userType}
                                variant="outline"
                                className="text-xs"
                              >
                                {userType.replace("_", " ")}
                              </Badge>
                            ))}
                          {template.targetUserTypes?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.targetUserTypes.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Template Preview: {template.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Preview of the email template as it would
                                  appear to recipients
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <div className="text-sm font-medium mb-2">
                                    Subject: {template.emailSubject}
                                  </div>
                                  <div
                                    className="bg-white border rounded p-4"
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        template.emailBody ||
                                        "No content available",
                                    }}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Template
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {template.name}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteTemplateMutation.mutate(template.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && templates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No email templates
              </h3>
              <p className="mt-1 text-gray-500">
                Get started by creating your first email template.
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateTemplate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
