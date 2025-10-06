import { Button } from "@/components/ui/button";
import { Save, Download, X } from "lucide-react";

export const EmailBuilderHeader: React.FC<{
  onExport: () => void;
  onSave: () => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ onExport, onSave, onClose, isLoading }) => {
  return (
    <div className="border-b bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Email Template Builder</h2>
          <p className="text-gray-600">
            Create responsive email templates with enhanced CKEditor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export HTML
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
