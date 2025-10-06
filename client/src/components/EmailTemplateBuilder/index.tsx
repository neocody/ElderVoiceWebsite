import React, { useRef, useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  EmailTemplateBuilderProps,
  EmailTemplateType,
  CustomBlock,
} from "./types";
import { defaultHtmlTemplate } from "./constants";
import { EmailBuilderSidebar } from "./Sidebar";
import { EmailEditor } from "./EmailEditor";
import { EmailBuilderHeader } from "./Header";
import { EmailPreview } from "./Preview";

export default function EmailTemplateBuilder({
  template,
  onSave,
  onClose,
}: EmailTemplateBuilderProps) {
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState(template?.name || "");
  const [emailSubject, setEmailSubject] = useState(
    template?.emailSubject || "",
  );
  const [templateType, setTemplateType] = useState<EmailTemplateType>(
    template?.type || "custom",
  );
  const [description, setDescription] = useState(template?.description || "");
  const [htmlContent, setHtmlContent] = useState(
    template?.emailBody || defaultHtmlTemplate,
  );
  const [targetUserTypes, setTargetUserTypes] = useState<string[]>(
    template?.targetUserTypes || [],
  );
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("templates");
  const [draggedBlock, setDraggedBlock] = useState<CustomBlock | null>(null);

  // Initialize with template data if provided
  useEffect(() => {
    if (template) {
      setTemplateName(template.name || "");
      setEmailSubject(template.emailSubject || "");
      setTemplateType(template.type || "custom");
      setDescription(template.description || "");
      setHtmlContent(template.emailBody || defaultHtmlTemplate);
      setTargetUserTypes(template.targetUserTypes || []);
    }
  }, [template]);

  const loadTemplateDesign = useCallback(
    (templateHtml: string) => {
      setHtmlContent(templateHtml);
      if (toast) {
        toast({
          title: "Template Loaded",
          description:
            "Pre-built template design has been loaded into the editor.",
        });
      }
    },
    [toast],
  );

  const insertVariable = useCallback(
    (variable: string) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        editor.model.change((writer: any) => {
          const insertPosition =
            editor.model.document.selection.getFirstPosition();
          writer.insertText(variable, insertPosition);
        });

        if (toast) {
          toast({
            title: "Variable Inserted",
            description: `${variable} has been inserted at cursor position.`,
          });
        }
      } else {
        navigator.clipboard.writeText(variable);
        if (toast) {
          toast({
            title: "Variable Copied",
            description: `${variable} copied to clipboard. Paste it in the editor.`,
          });
        }
      }
    },
    [toast],
  );

  const insertCustomBlock = useCallback(
    (block: CustomBlock) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        editor.model.change((writer: any) => {
          const viewFragment = editor.data.processor.toView(block.html);
          const modelFragment = editor.data.toModel(viewFragment);
          const insertPosition =
            editor.model.document.selection.getFirstPosition();
          writer.insert(modelFragment, insertPosition);
        });

        if (toast) {
          toast({
            title: "Block Inserted",
            description: `${block.name} has been inserted into the editor.`,
          });
        }
      }
    },
    [toast],
  );

  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedBlock && editorRef.current) {
      insertCustomBlock(draggedBlock);
      setDraggedBlock(null);
    }
  };

  const handleRoleToggle = (roleValue: string) => {
    setTargetUserTypes((prev) => {
      if (prev.includes(roleValue)) {
        return prev.filter((role) => role !== roleValue);
      } else {
        return [...prev, roleValue];
      }
    });
  };

  const handleSave = useCallback(async () => {
    if (!templateName.trim() || !emailSubject.trim()) {
      if (toast) {
        toast({
          title: "Validation Error",
          description: "Template name and email subject are required.",
          variant: "destructive",
        });
      }
      return;
    }

    if (targetUserTypes.length === 0) {
      if (toast) {
        toast({
          title: "Validation Error",
          description: "At least one target user role must be selected.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const templateData = {
        name: templateName,
        emailSubject: emailSubject,
        emailBody: htmlContent,
        type: templateType,
        description: description,
        targetUserTypes: targetUserTypes,
      };

      onSave(templateData);
      if (toast) {
        toast({
          title: "Template Saved",
          description: "Email template has been saved successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      if (toast) {
        toast({
          title: "Save Error",
          description: "Failed to save email template.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    templateName,
    emailSubject,
    htmlContent,
    templateType,
    description,
    targetUserTypes,
    onSave,
    toast,
  ]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail.trim()) {
      if (toast) {
        toast({
          title: "Email Required",
          description: "Please enter an email address for testing.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/email-templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          subject: emailSubject || "Test Email Template",
          html: htmlContent,
        }),
      });

      if (response.ok) {
        if (toast) {
          toast({
            title: "Test Email Sent",
            description: `Test email sent successfully to ${testEmail}`,
          });
        }
      } else {
        throw new Error("Failed to send test email");
      }
    } catch (error) {
      console.error("Test email error:", error);
      if (toast) {
        toast({
          title: "Send Error",
          description: "Failed to send test email.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [testEmail, emailSubject, htmlContent, toast]);

  const handleExport = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName || "template"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <EmailBuilderSidebar
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        onLoadTemplate={loadTemplateDesign}
        onInsertVariable={insertVariable}
        onInsertBlock={insertCustomBlock}
        templateName={templateName}
        setTemplateName={setTemplateName}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        description={description}
        setDescription={setDescription}
        templateType={templateType}
        setTemplateType={setTemplateType}
        targetUserTypes={targetUserTypes}
        onRoleToggle={handleRoleToggle}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        onSendTest={handleSendTest}
        isLoading={isLoading}
        onClose={onClose}
        toast={toast}
      />

      <div className="flex-1 flex flex-col">
        <EmailBuilderHeader
          onExport={handleExport}
          onSave={handleSave}
          onClose={onClose}
          isLoading={isLoading}
        />

        <div className="flex-1 flex">
          <EmailEditor
            htmlContent={htmlContent}
            setHtmlContent={setHtmlContent}
            onEditorReady={handleEditorReady}
            onDrop={handleEditorDrop}
          />
        </div>
      </div>
    </div>
  );
}
