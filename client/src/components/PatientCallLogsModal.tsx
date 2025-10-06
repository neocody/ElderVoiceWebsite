import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Clock,
  MessageSquare,
  FileText,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface PatientCallLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
}

interface PatientMemory {
  id: number;
  memoryType: string;
  content: string;
  context: string;
  importanceScore: number;
  tags: string[];
  createdAt: string;
}

export default function PatientCallLogsModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}: PatientCallLogsModalProps) {
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);

  // Fetch Calls filtered by patientId
  const { data: calls = [] } = useQuery({
    queryKey: ["/api/calls", patientId],
    queryFn: () =>
      fetch(`/api/calls?elderlyUserId=${patientId}`).then((res) => res.json()),
    enabled: isOpen && !!patientId,
  });

  // Fetch memories for a selected call
  const { data: memories = [] } = useQuery({
    queryKey: [`/api/calls/${selectedCallId}/extract-memories`],
    queryFn: () =>
      fetch(`/api/calls/${selectedCallId}/extract-memories`).then((res) =>
        res.json(),
      ),
    enabled: !!selectedCallId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "missed":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "missed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const callDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - callDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case "family_news":
        return "bg-blue-100 text-blue-800";
      case "health_update":
        return "bg-red-100 text-red-800";
      case "interest_mentioned":
        return "bg-green-100 text-green-800";
      case "preference_learned":
        return "bg-purple-100 text-purple-800";
      case "conversation_summary":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImportanceColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-blue-500";
    return "bg-gray-500";
  };

  const getImportanceLabel = (score: number) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Normal";
    return "Low";
  };

  const selectedCall = calls.find((c: any) => c.id === selectedCallId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History for {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {selectedCallId ? (
            // 📞 Details View
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCallId(null)}
                >
                  ← Back to Call List
                </Button>
              </div>

              <Tabs defaultValue="summary" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="memories">Memories</TabsTrigger>
                </TabsList>

                {/* Summary */}
                <TabsContent value="summary" className="flex-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        AI Generated Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCall?.summary ? (
                        <div className="prose prose-sm max-w-none">
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {selectedCall.summary}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No summary available for this call</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Transcript */}
                <TabsContent value="transcript" className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Call Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ScrollArea className="h-96">
                        {selectedCall?.transcript ? (
                          <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-gray-800">
                            {selectedCall.transcript}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No transcript available for this call</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Memories */}
                <TabsContent value="memories" className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Extracted Memories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ScrollArea className="h-96">
                        {memories.length > 0 ? (
                          <div className="space-y-4">
                            {(memories as PatientMemory[]).map((memory) => (
                              <div
                                key={memory.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={getMemoryTypeColor(
                                        memory.memoryType,
                                      )}
                                    >
                                      {memory.memoryType.replace("_", " ")}
                                    </Badge>
                                    <div
                                      className={`w-2 h-2 rounded-full ${getImportanceColor(memory.importanceScore || 50)}`}
                                      title={`Importance: ${getImportanceLabel(memory.importanceScore || 50)}`}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      memory.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {memory.context || "Memory"}
                                </h4>
                                <p className="text-gray-700 text-sm mb-2">
                                  {memory.content}
                                </p>
                                {memory.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {memory.tags.map((tag, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No memories extracted from this call</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // 📋 Calls List View
            <div className="h-full">
              <ScrollArea className="h-96">
                {calls.length > 0 ? (
                  <div className="space-y-4">
                    {calls.map((call: any) => (
                      <Card
                        key={call.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(call.status)}
                              <div>
                                <p className="font-medium">
                                  {new Date(
                                    call.scheduledAt || call.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    call.scheduledAt || call.createdAt,
                                  ).toLocaleTimeString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatTimeAgo(
                                    call.scheduledAt || call.createdAt,
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(call.status)}>
                                {call.status}
                              </Badge>
                              {call.duration && (
                                <Badge variant="outline">
                                  {formatDuration(call.duration)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {call.phoneNumber && (
                                <span>Called: {call.phoneNumber}</span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCallId(call.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No calls found for {patientName}</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
