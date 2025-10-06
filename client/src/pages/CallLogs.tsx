import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  MessageSquare,
  FileText,
  Brain,
  Clock,
  User,
} from "lucide-react";

interface CallTranscript {
  id: number;
  speaker: "patient" | "ai" | "system";
  message: string;
  timestamp: string;
  confidence?: number;
}

interface PatientMemory {
  id: number;
  elderlyUserId: number;
  callId?: number;
  memoryType: string;
  content: string;
  tags?: string[];
  context?: string;
  importanceScore?: number;
  isVerified?: boolean;
  lastReferenced?: string;
  createdAt: string;
}
export interface Call {
  id: number;
  elderlyUserId: number;
  status: string;
  duration?: number;
  transcript?: string;
  summary?: string;
  sentiment?: string;
  callSid?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export default function CallLogs() {
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [selectedCall, setSelectedCall] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: calls = [], isLoading: isCallsLoading } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const { data: memories = [] } = useQuery<PatientMemory[]>({
    queryKey: [`/api/calls/${selectedCallId}/extract-memories`],
    enabled: !!selectedCallId,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-secondary/10 text-secondary";
      case "missed":
        return "bg-red-100 text-red-600";
      case "failed":
        return "bg-red-100 text-red-600";
      case "in_progress":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatCallStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      case "failed":
        return "Failed";
      case "in_progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case "patient":
        return <User className="h-4 w-4" />;
      case "ai":
        return <Brain className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case "patient":
        return "text-blue-600";
      case "ai":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case "personal_fact":
        return "bg-blue-100 text-blue-800";
      case "health_update":
        return "bg-red-100 text-red-800";
      case "family_info":
        return "bg-green-100 text-green-800";
      case "preference":
        return "bg-purple-100 text-purple-800";
      case "concern":
        return "bg-orange-100 text-orange-800";
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

  // Call search handler function
  const handleCallSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());

    if (searchTerm.trim().length !== 0) {
      console.log(calls);
      const filteredCalls = (calls as any[]).filter((call) =>
        call.elderlyUser.name.toLowerCase().includes(searchTerm.trim()),
      );

      setSearchResults(filteredCalls);
      console.log(filteredCalls);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">
                Call Logs
              </h2>
              <p className="text-textSecondary">
                View call history and transcripts
              </p>
            </div>
            <div className="relative">
              <Input
                type="search"
                placeholder="Search calls..."
                className="pl-10 pr-4 py-2 w-64"
                value={searchTerm}
                onChange={handleCallSearch}
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary"
                size={16}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {searchTerm.trim() === "" ? (
            <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
              {calls.length === 0 ? (
                <div className="p-12 text-center text-textSecondary">
                  <p>No call logs found.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {calls.map((call: any) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-textPrimary font-medium">
                              {call.elderlyUser
                                ? getInitials(call.elderlyUser.name)
                                : "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-textPrimary">
                              {call.elderlyUser?.name || "Unknown name"}
                            </p>
                            <p className="text-sm text-textSecondary">
                              {call.elderlyUser?.phone || ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                className={getCallStatusColor(call.status)}
                              >
                                {formatCallStatus(call.status)}
                              </Badge>
                              <span className="text-sm text-textSecondary flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(call.duration)}
                              </span>
                            </div>
                            <p className="text-xs text-textSecondary">
                              {call.createdAt
                                ? formatTimeAgo(call.createdAt)
                                : ""}
                            </p>
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCallId(call.id);
                                  setSelectedCall(call);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>
                                  Call Details - {call.elderlyUser?.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Call on{" "}
                                  {new Date(
                                    call.scheduledTime || call.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    call.scheduledTime || call.createdAt,
                                  ).toLocaleTimeString()}
                                </DialogDescription>
                              </DialogHeader>

                              <Tabs defaultValue="summary" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="summary">
                                    Summary
                                  </TabsTrigger>
                                  <TabsTrigger value="transcript">
                                    Transcript
                                  </TabsTrigger>
                                  <TabsTrigger value="memories">
                                    Memories
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                  value="summary"
                                  className="mt-4 h-64"
                                >
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
                                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                              {selectedCall.summary}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8 text-gray-500">
                                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                          <p>
                                            No summary available for this call
                                          </p>
                                          <p className="text-sm">
                                            Summary will be generated
                                            automatically after call completion
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent
                                  value="transcript"
                                  className="mt-4"
                                >
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Call Transcript
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ScrollArea className="h-64">
                                        {selectedCall?.transcript ? (
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                                              {selectedCall.transcript}
                                            </pre>
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>
                                              No transcript available for this
                                              call
                                            </p>
                                            <p className="text-sm">
                                              Transcripts are generated during
                                              live calls
                                            </p>
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="memories" className="mt-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        Extracted Patient Memories
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ScrollArea className="h-64">
                                        {memories.length > 0 ? (
                                          <div className="space-y-4">
                                            {(memories as PatientMemory[]).map(
                                              (memory) => (
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
                                                        {memory.memoryType.replace(
                                                          "_",
                                                          " ",
                                                        )}
                                                      </Badge>
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getImportanceColor(
                                                          memory.importanceScore ||
                                                            50,
                                                        )}`}
                                                        title={`Importance: ${getImportanceLabel(
                                                          memory.importanceScore ||
                                                            50,
                                                        )}`}
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
                                                  {memory.tags &&
                                                    Array.isArray(
                                                      memory.tags,
                                                    ) &&
                                                    memory.tags.length > 0 && (
                                                      <div className="flex flex-wrap gap-1">
                                                        {memory.tags.map(
                                                          (tag, index) => (
                                                            <Badge
                                                              key={index}
                                                              variant="secondary"
                                                              className="text-xs"
                                                            >
                                                              {tag}
                                                            </Badge>
                                                          ),
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>
                                              No memories extracted from this
                                              call
                                            </p>
                                            <p className="text-sm">
                                              Memories are automatically
                                              extracted after call completion
                                            </p>
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
              {searchResults.length === 0 ? (
                <div className="p-12 text-center text-textSecondary">
                  <p>No call logs found.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {searchResults.map((call: any) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-textPrimary font-medium">
                              {call.elderlyUser
                                ? getInitials(call.elderlyUser.name)
                                : "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-textPrimary">
                              {call.elderlyUser?.name || "Unknown name"}
                            </p>
                            <p className="text-sm text-textSecondary">
                              {call.elderlyUser?.phone || ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                className={getCallStatusColor(call.status)}
                              >
                                {formatCallStatus(call.status)}
                              </Badge>
                              <span className="text-sm text-textSecondary flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(call.duration)}
                              </span>
                            </div>
                            <p className="text-xs text-textSecondary">
                              {call.createdAt
                                ? formatTimeAgo(call.createdAt)
                                : ""}
                            </p>
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCallId(call.id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>
                                  Call Details - {call.elderlyUser?.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Call on{" "}
                                  {new Date(
                                    call.scheduledTime || call.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    call.scheduledTime || call.createdAt,
                                  ).toLocaleTimeString()}
                                </DialogDescription>
                              </DialogHeader>

                              <Tabs defaultValue="summary" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="summary">
                                    Summary
                                  </TabsTrigger>
                                  <TabsTrigger value="transcript">
                                    Transcript
                                  </TabsTrigger>
                                  <TabsTrigger value="memories">
                                    Memories
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="summary" className="mt-4">
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
                                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                                              {selectedCall.summary}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8 text-gray-500">
                                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                          <p>
                                            No summary available for this call
                                          </p>
                                          <p className="text-sm">
                                            Summary will be generated
                                            automatically after call completion
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent
                                  value="transcript"
                                  className="mt-4"
                                >
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Call Transcript
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ScrollArea className="h-64">
                                        {selectedCall?.transcripts &&
                                        selectedCall.transcripts.length > 0 ? (
                                          <div className="space-y-4">
                                            {(
                                              selectedCall.transcripts as CallTranscript[]
                                            ).map((transcript) => (
                                              <div
                                                key={transcript.id}
                                                className="flex gap-3"
                                              >
                                                <div
                                                  className={`flex-shrink-0 ${getSpeakerColor(
                                                    transcript.speaker,
                                                  )}`}
                                                >
                                                  {getSpeakerIcon(
                                                    transcript.speaker,
                                                  )}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                      className={`text-sm font-medium ${getSpeakerColor(
                                                        transcript.speaker,
                                                      )}`}
                                                    >
                                                      {transcript.speaker ===
                                                      "patient"
                                                        ? call.elderlyUser?.name
                                                        : transcript.speaker.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {new Date(
                                                        transcript.timestamp,
                                                      ).toLocaleTimeString()}
                                                    </span>
                                                    {transcript.confidence && (
                                                      <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                      >
                                                        {transcript.confidence}%
                                                        confidence
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <p className="text-gray-700">
                                                    {transcript.message}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>
                                              No transcript available for this
                                              call
                                            </p>
                                            <p className="text-sm">
                                              Transcripts are generated during
                                              live calls
                                            </p>
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="memories" className="mt-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        Extracted Patient Memories
                                      </CardTitle>
                                      <CardDescription>
                                        AI-extracted insights and memories from
                                        this conversation
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <ScrollArea className="h-64">
                                        {memories.length > 0 ? (
                                          <div className="space-y-4">
                                            {(memories as PatientMemory[]).map(
                                              (memory) => (
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
                                                        {memory.memoryType.replace(
                                                          "_",
                                                          " ",
                                                        )}
                                                      </Badge>
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getImportanceColor(
                                                          memory.importanceScore ||
                                                            50,
                                                        )}`}
                                                        title={`Importance: ${getImportanceLabel(
                                                          memory.importanceScore ||
                                                            50,
                                                        )}`}
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
                                                  {memory.tags &&
                                                    Array.isArray(
                                                      memory.tags,
                                                    ) &&
                                                    memory.tags.length > 0 && (
                                                      <div className="flex flex-wrap gap-1">
                                                        {memory.tags.map(
                                                          (tag, index) => (
                                                            <Badge
                                                              key={index}
                                                              variant="secondary"
                                                              className="text-xs"
                                                            >
                                                              {tag}
                                                            </Badge>
                                                          ),
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>
                                              No memories extracted from this
                                              call
                                            </p>
                                            <p className="text-sm">
                                              Memories are automatically
                                              extracted after call completion
                                            </p>
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
