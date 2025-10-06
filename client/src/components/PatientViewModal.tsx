import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Phone,
  Calendar,
  Heart,
  MessageCircle,
  History,
  MapPin,
  Users,
  BookOpen,
  Music,
  Plane,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
} from "lucide-react";
import type { ElderlyUser } from "@shared/schema";

interface PatientViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: ElderlyUser | null;
  onEditClick?: () => void;
}

export default function PatientViewModal({
  open,
  onOpenChange,
  patient,
  onEditClick,
}: PatientViewModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch call history for the patient
  const { data: callHistory = [] } = useQuery({
    queryKey: ["/api/calls", patient?.id],
    queryFn: () =>
      fetch(`/api/calls?elderlyUserId=${patient?.id}`).then((res) =>
        res.json(),
      ),
    enabled: open && !!patient?.id,
  });

  if (!patient) return null;

  const formatAge = () => {
    if (patient.age) return `${patient.age} years old`;
    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return `${age} years old`;
    }
    return "Age not provided";
  };

  const getCallStatusIcon = (status: string) => {
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

  const getCallStatusColor = (status: string) => {
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

  const parseJSONField = (field: any): string[] => {
    if (Array.isArray(field)) return field;
    if (typeof field === "string") {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const parseObjectField = (field: any): Record<string, any> => {
    if (typeof field === "object" && field !== null) return field;
    if (typeof field === "string") {
      try {
        const parsed = JSON.parse(field);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  // Calculate profile completeness
  const getProfileCompleteness = () => {
    const fields = [
      patient.name,
      patient.phone,
      patient.dateOfBirth || patient.age,
      patient.preferredCallTime,
      patient.callFrequency,
      parseJSONField(patient.preferredCallDays).length > 0,
      patient.healthConcerns,
      parseJSONField(patient.topicsOfInterest).length > 0,
      patient.conversationTone,
      patient.lifeHistory,
      parseJSONField(patient.personalityTraits).length > 0,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const recentCalls = callHistory.slice(0, 5);

  const primary = patient.primaryEmergencyContact
    ? parseObjectField(patient.primaryEmergencyContact)
    : null;

  const secondary = patient.secondaryEmergencyContact
    ? parseObjectField(patient.secondaryEmergencyContact)
    : null;

  const primaryContactNode: JSX.Element | null = primary ? (
    <div>
      <h4 className="font-medium text-sm text-gray-600 mb-3">
        Primary Emergency Contact
      </h4>
      <div className="space-y-2">
        {primary.name && (
          <p>
            <span className="font-medium">Name:</span> {String(primary.name)}
          </p>
        )}
        {primary.relationship && (
          <p>
            <span className="font-medium">Relationship:</span>{" "}
            {String(primary.relationship)}
          </p>
        )}
        {primary.phone && (
          <p>
            <span className="font-medium">Phone:</span>{" "}
            <a
              href={`tel:${primary.phone}`}
              className="text-blue-600 hover:underline"
              data-testid="link-primary-contact-phone"
            >
              {String(primary.phone)}
            </a>
          </p>
        )}
      </div>
    </div>
  ) : null;

  const secondaryContactNode: JSX.Element | null = secondary ? (
    <div>
      <h4 className="font-medium text-sm text-gray-600 mb-3">
        Secondary Emergency Contact
      </h4>
      <div className="space-y-2">
        {secondary.name && (
          <p>
            <span className="font-medium">Name:</span> {String(secondary.name)}
          </p>
        )}
        {secondary.relationship && (
          <p>
            <span className="font-medium">Relationship:</span>{" "}
            {String(secondary.relationship)}
          </p>
        )}
        {secondary.phone && (
          <p>
            <span className="font-medium">Phone:</span>{" "}
            <a
              href={`tel:${secondary.phone}`}
              className="text-blue-600 hover:underline"
              data-testid="link-secondary-contact-phone"
            >
              {String(secondary.phone)}
            </a>
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Profile - {patient.preferredName || patient.name}
            </DialogTitle>
            <Button
              onClick={onEditClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-edit-patient"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="personal" data-testid="tab-personal">
              Personal Profile
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health">
              Health & Care
            </TabsTrigger>
            <TabsTrigger value="calls" data-testid="tab-calls">
              Call History ({callHistory.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[550px] mt-4">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Summary Card */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Summary
                    </CardTitle>
                    <CardDescription>
                      Profile is {getProfileCompleteness()}% complete
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-600">
                          Full Name
                        </h4>
                        <p className="text-lg" data-testid="text-patient-name">
                          {patient.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-600">
                          Preferred Name
                        </h4>
                        <p
                          className="text-lg"
                          data-testid="text-preferred-name"
                        >
                          {patient.preferredName || "Same as full name"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <h4 className="font-medium text-sm text-gray-600">
                            Age
                          </h4>
                          <p data-testid="text-patient-age">{formatAge()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <h4 className="font-medium text-sm text-gray-600">
                            Phone
                          </h4>
                          <p data-testid="text-patient-phone">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-2">
                        Call Preferences
                      </h4>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {parseJSONField(patient.preferredCallDays).map(
                            (day: string) => (
                              <Badge key={day} variant="secondary">
                                {day}
                              </Badge>
                            ),
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {patient.preferredCallTime &&
                            `Prefers ${patient.preferredCallTime} calls, ${patient.callFrequency}`}
                        </p>
                      </div>
                    </div>

                    {patient.conversationTone && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Communication Style
                        </h4>
                        <Badge variant="outline">
                          {patient.conversationTone} tone
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">
                        Current Status
                      </h4>
                      <Badge
                        variant={
                          patient.status === "active" ? "default" : "secondary"
                        }
                        data-testid="badge-patient-status"
                      >
                        {patient.status === "active"
                          ? "Active"
                          : patient.status === "needs_attention"
                            ? "Needs Attention"
                            : patient.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-gray-600">
                        Recent Activity
                      </h4>
                      <p className="text-sm text-gray-600">
                        {recentCalls.length > 0
                          ? `Last call ${format(
                              new Date(recentCalls[0].scheduledTime),
                              "MMM dd",
                            )}`
                          : "No recent calls"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-gray-600">
                        Total Calls
                      </h4>
                      <p
                        className="text-2xl font-bold"
                        data-testid="text-total-calls"
                      >
                        {callHistory.length}
                      </p>
                    </div>

                    {patient.mobilityLevel && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600">
                          Mobility Level
                        </h4>
                        <Badge variant="outline">
                          {patient.mobilityLevel.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Call Activity */}
              {recentCalls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Recent Call Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentCalls.map((call: any) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`call-${call.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {getCallStatusIcon(call.status)}
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(call.scheduledTime),
                                  "MMM dd, yyyy 'at' h:mm a",
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Duration:{" "}
                                {call.duration
                                  ? formatDuration(call.duration)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getCallStatusColor(call.status)}
                          >
                            {call.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Life & Background */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Life & Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.lifeHistory && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Life History
                        </h4>
                        <p
                          className="text-sm leading-relaxed"
                          data-testid="text-life-history"
                        >
                          {patient.lifeHistory}
                        </p>
                      </div>
                    )}

                    {patient.favoriteMemories && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Favorite Memories
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.favoriteMemories}
                        </p>
                      </div>
                    )}

                    {patient.pastCareers && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Career Background
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.pastCareers}
                        </p>
                      </div>
                    )}

                    {patient.educationBackground && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Education
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.educationBackground}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personality & Interests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Personality & Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parseJSONField(patient.personalityTraits).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Personality Traits
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {parseJSONField(patient.personalityTraits).map(
                            (trait: string) => (
                              <Badge
                                key={trait}
                                variant="secondary"
                                data-testid={`trait-${trait.toLowerCase()}`}
                              >
                                {trait}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {parseJSONField(patient.topicsOfInterest).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Topics of Interest
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {parseJSONField(patient.topicsOfInterest).map(
                            (topic: string) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                data-testid={`interest-${topic.toLowerCase()}`}
                              >
                                {topic}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {patient.hobbiesAndCrafts && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Hobbies & Crafts
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.hobbiesAndCrafts}
                        </p>
                      </div>
                    )}

                    {patient.favoriteBooks && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Favorite Books
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.favoriteBooks}
                        </p>
                      </div>
                    )}

                    {patient.favoriteMusic && (
                      <div className="flex items-start gap-2">
                        <Music className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-1">
                            Favorite Music
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {patient.favoriteMusic}
                          </p>
                        </div>
                      </div>
                    )}

                    {patient.travelExperiences && (
                      <div className="flex items-start gap-2">
                        <Plane className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-1">
                            Travel Experiences
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {patient.travelExperiences}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Social & Cultural */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Social & Cultural
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.socialConnections && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Social Connections
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.socialConnections}
                        </p>
                      </div>
                    )}

                    {patient.culturalBackground && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Cultural Background
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.culturalBackground}
                        </p>
                      </div>
                    )}

                    {patient.religiousSpiritual && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Religious & Spiritual
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.religiousSpiritual}
                        </p>
                      </div>
                    )}

                    {patient.currentLivingSituation && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-1">
                            Living Situation
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {patient.currentLivingSituation}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Daily Routine & Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Daily Life & Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.dailyRoutine && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Daily Routine
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.dailyRoutine}
                        </p>
                      </div>
                    )}

                    {patient.motivationsGoals && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Motivations & Goals
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.motivationsGoals}
                        </p>
                      </div>
                    )}

                    {patient.currentChallenges && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Current Challenges
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.currentChallenges}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Health Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.healthConcerns && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Health Concerns
                        </h4>
                        <p
                          className="text-sm leading-relaxed"
                          data-testid="text-health-concerns"
                        >
                          {patient.healthConcerns}
                        </p>
                      </div>
                    )}

                    {patient.medications && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Current Medications
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.medications}
                        </p>
                      </div>
                    )}

                    {patient.allergies && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Allergies & Restrictions
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.allergies}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {patient.mobilityLevel && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-2">
                            Mobility Level
                          </h4>
                          <Badge variant="outline">
                            {patient.mobilityLevel.replace("_", " ")}
                          </Badge>
                        </div>
                      )}

                      {patient.cognitiveStatus && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-2">
                            Cognitive Status
                          </h4>
                          <Badge variant="outline">
                            {patient.cognitiveStatus.replace("_", " ")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Communication Considerations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Communication Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.communicationPreferences && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Communication Preferences
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.communicationPreferences}
                        </p>
                      </div>
                    )}

                    {patient.sensoryPreferences && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Sensory Considerations
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.sensoryPreferences}
                        </p>
                      </div>
                    )}

                    {patient.memoryConsiderations && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Memory Considerations
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.memoryConsiderations}
                        </p>
                      </div>
                    )}

                    {patient.specialInstructions && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          Special Instructions
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {patient.specialInstructions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {primaryContactNode}
                    {secondaryContactNode}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calls" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Call History
                  </CardTitle>
                  <CardDescription>
                    {callHistory.length} total calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {callHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No calls recorded yet</p>
                      <p className="text-sm">
                        Call history will appear here once calls are made.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {callHistory.map((call: any) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          data-testid={`call-history-${call.id}`}
                        >
                          <div className="flex items-center gap-4">
                            {getCallStatusIcon(call.status)}
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(call.scheduledTime),
                                  "EEEE, MMM dd, yyyy 'at' h:mm a",
                                )}
                              </p>
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>
                                  Duration:{" "}
                                  {call.duration
                                    ? formatDuration(call.duration)
                                    : "N/A"}
                                </span>
                                {call.cost && <span>Cost: ${call.cost}</span>}
                                {call.sentiment && (
                                  <span>Sentiment: {call.sentiment}</span>
                                )}
                              </div>
                              {call.summary && (
                                <p className="text-sm text-gray-600 mt-1 max-w-md">
                                  {call.summary}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getCallStatusColor(call.status)}
                          >
                            {call.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
