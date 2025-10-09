import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Mail, Phone } from "lucide-react";

type SupportInfo = {
  phone: string;
  email: string;
  hours: string;
};

type SupportInfoCardProps = {
  info: SupportInfo;
};

export function SupportInfoCard({ info }: SupportInfoCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <Phone className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <div className="font-medium text-gray-900">Call Us</div>
            <div className="text-sm text-gray-600">{info.phone}</div>
          </div>
          <div>
            <Mail className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <div className="font-medium text-gray-900">Email Us</div>
            <div className="text-sm text-gray-600">{info.email}</div>
          </div>
          <div>
            <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
            <div className="font-medium text-gray-900">Availability</div>
            <div className="text-sm text-gray-600">{info.hours}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
