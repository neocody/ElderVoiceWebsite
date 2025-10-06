import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Image, Trash2, Download, Eye } from "lucide-react";

interface FileUpload {
  id: string;
  url: string;
  originalName: string;
  size: number;
  metadata?: any;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, { count: number; size: number }>;
}

export default function FileManager() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState<'profile_photo' | 'document' | 'attachment'>('document');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch storage statistics
  const { data: stats, isLoading: statsLoading } = useQuery<StorageStats>({
    queryKey: ['/api/files/admin/stats'],
    retry: false,
  });

  // Upload profile photo mutation
  const uploadProfilePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/files/upload/profile-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile photo uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/admin/stats'] });
      setSelectedFiles(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata?: any }) => {
      const formData = new FormData();
      formData.append('document', file);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const response = await fetch('/api/files/upload/document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/admin/stats'] });
      setSelectedFiles(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('attachments', file);
      });
      
      const response = await fetch('/api/files/upload/attachments', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.files.length} files uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/admin/stats'] });
      setSelectedFiles(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cleanup old files mutation
  const cleanupMutation = useMutation({
    mutationFn: async (olderThanDays: number) => {
      return apiRequest("POST", "/api/files/admin/cleanup", { olderThanDays });
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Complete",
        description: `${data.deletedCount} files were deleted`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/admin/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    const file = selectedFiles[0];

    switch (uploadCategory) {
      case 'profile_photo':
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File Type",
            description: "Profile photos must be image files",
            variant: "destructive",
          });
          return;
        }
        uploadProfilePhotoMutation.mutate(file);
        break;

      case 'document':
        uploadDocumentMutation.mutate({ 
          file,
          metadata: { category: 'admin_upload', uploadedAt: new Date() }
        });
        break;

      case 'attachment':
        uploadAttachmentsMutation.mutate(selectedFiles);
        break;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile_photo':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">File Manager</h1>
          <p className="text-muted-foreground">
            Upload and manage profile photos, documents, and attachments
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="stats">Storage Statistics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload profile photos, documents, or multiple attachments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Upload Category</Label>
                  <select
                    id="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="profile_photo">Profile Photo</option>
                    <option value="document">Document</option>
                    <option value="attachment">Attachment</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="files">Select Files</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple={uploadCategory === 'attachment'}
                    accept={uploadCategory === 'profile_photo' ? 'image/*' : undefined}
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                </div>
              </div>

              {selectedFiles && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  <div className="space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleFileUpload}
                disabled={
                  !selectedFiles ||
                  uploadProfilePhotoMutation.isPending ||
                  uploadDocumentMutation.isPending ||
                  uploadAttachmentsMutation.isPending
                }
                className="w-full"
              >
                {(uploadProfilePhotoMutation.isPending || 
                  uploadDocumentMutation.isPending || 
                  uploadAttachmentsMutation.isPending) && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                )}
                Upload Files
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalFiles || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : formatFileSize(stats?.totalSize || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Photos</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.byCategory?.profile_photo?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? "..." : formatFileSize(stats?.byCategory?.profile_photo?.size || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.byCategory?.document?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? "..." : formatFileSize(stats?.byCategory?.document?.size || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Storage Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of storage usage by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byCategory).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{data.count} files</div>
                        <div className="text-sm text-muted-foreground">{formatFileSize(data.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                File Cleanup
              </CardTitle>
              <CardDescription>
                Remove old files to free up storage space
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => cleanupMutation.mutate(7)}
                  disabled={cleanupMutation.isPending}
                  variant="outline"
                >
                  {cleanupMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2" />
                  )}
                  Cleanup 7+ days
                </Button>

                <Button
                  onClick={() => cleanupMutation.mutate(30)}
                  disabled={cleanupMutation.isPending}
                  variant="outline"
                >
                  {cleanupMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2" />
                  )}
                  Cleanup 30+ days
                </Button>

                <Button
                  onClick={() => cleanupMutation.mutate(90)}
                  disabled={cleanupMutation.isPending}
                  variant="outline"
                >
                  {cleanupMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2" />
                  )}
                  Cleanup 90+ days
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> File cleanup is permanent and cannot be undone. 
                  Make sure you have backups of important files before proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}