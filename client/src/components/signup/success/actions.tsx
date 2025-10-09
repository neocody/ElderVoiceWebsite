import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function SuccessActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/admin" className="flex-1 sm:flex-initial">
        <Button size="lg" className="w-full sm:w-auto">
          Go to Your Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
      <Link href="/contact" className="flex-1 sm:flex-initial">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Contact Support
        </Button>
      </Link>
    </div>
  );
}
