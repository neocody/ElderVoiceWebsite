import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Heart, CheckCircle, Copy, MousePointer } from "lucide-react";
import { EmailTemplateType, CustomBlock } from "./types";
import {
  customBlocks,
  prebuiltTemplates,
  availableRoles,
  availableVariables,
  templateTypes,
} from "./constants";

export const EmailBuilderSidebar: React.FC<{
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
  onLoadTemplate: (html: string) => void;
  onInsertVariable: (variable: string) => void;
  onInsertBlock: (block: CustomBlock) => void;
  templateName: string;
  setTemplateName: (name: string) => void;
  emailSubject: string;
  setEmailSubject: (subject: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  templateType: EmailTemplateType;
  setTemplateType: (type: EmailTemplateType) => void;
  targetUserTypes: string[];
  onRoleToggle: (role: string) => void;
  testEmail: string;
  setTestEmail: (email: string) => void;
  onSendTest: () => void;
  isLoading: boolean;
  onClose: () => void;
  toast: any;
}> = ({
  sidebarTab,
  setSidebarTab,
  onLoadTemplate,
  onInsertVariable,
  onInsertBlock,
  templateName,
  setTemplateName,
  emailSubject,
  setEmailSubject,
  description,
  setDescription,
  templateType,
  setTemplateType,
  targetUserTypes,
  onRoleToggle,
  testEmail,
  setTestEmail,
  onSendTest,
  isLoading,
  onClose,
  toast,
}) => {
  const handleBlockDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    block: CustomBlock,
  ) => {
    e.dataTransfer.setData("text/html", block.html);
    e.dataTransfer.setData("text/plain", block.name);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-80 bg-white border-r shadow-sm flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Email Builder</h3>
        </div>
      </div>

      <Tabs
        value={sidebarTab}
        onValueChange={setSidebarTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="text-xs">
              Templates
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs">
              Variables
            </TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs">
              Blocks
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1">
          <TabsContent value="templates" className="h-full m-0">
            <ScrollArea className="h-[calc(100vh-7rem)]">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Pre-built Templates</h4>
                  <div className="space-y-2">
                    {prebuiltTemplates.map((template, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => onLoadTemplate(template.html)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">
                                {template.name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables" className="h-full m-0">
            <ScrollArea className="h-[calc(100vh-7rem)]">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Available Variables</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Click any variable to insert it at cursor position
                  </p>
                  <div className="space-y-1">
                    {availableVariables.map((variable) => (
                      <div
                        key={variable}
                        onClick={() => onInsertVariable(variable)}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 text-sm"
                      >
                        <code className="text-blue-600">{variable}</code>
                        <Copy className="w-3 h-3 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="blocks" className="h-full m-0">
            <ScrollArea className="h-[calc(100vh-7rem)]">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Custom Blocks</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag blocks to editor or click to insert
                  </p>
                  <div className="space-y-2">
                    {customBlocks.map((block) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleBlockDragStart(e, block)}
                        onClick={() => onInsertBlock(block)}
                        className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-0.5">
                            {block.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{block.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {block.description}
                            </p>
                          </div>
                          <MousePointer className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Drag & Drop
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Drag any block directly into the editor or click to
                        insert at cursor position.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0">
            <ScrollArea className="h-[calc(100vh-7rem)]">
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Template Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter template description"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select
                    value={templateType}
                    onValueChange={(val: EmailTemplateType) =>
                      setTemplateType(val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {templateTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">
                    Target User Roles *
                  </Label>
                  <p className="text-xs text-gray-600 mb-3">
                    Select which user roles should receive this template
                  </p>
                  <div className="space-y-2">
                    {availableRoles.map((role) => (
                      <div
                        key={role.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          targetUserTypes.includes(role.value)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => onRoleToggle(role.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {role.label}
                          </span>
                          {targetUserTypes.includes(role.value) && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {targetUserTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {targetUserTypes.map((roleValue) => {
                        const role = availableRoles.find(
                          (r) => r.value === roleValue,
                        );
                        return (
                          <Badge key={roleValue} variant="secondary">
                            {role?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Test Email</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="testEmail">Email Address</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={onSendTest}
                      disabled={isLoading || !testEmail}
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Email
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
