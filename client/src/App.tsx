import { Router, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Marketing pages only
import Landing from "@/pages/Landing";
import Features from "@/pages/Features";
import Individuals from "@/pages/Individuals";
import Facilities from "@/pages/Facilities";
import Vision from "@/pages/Vision";
import Careers from "@/pages/Careers";
import FAQs from "@/pages/FAQs";
import Contact from "@/pages/Contact";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import GetStarted from "@/pages/GetStarted";
import FacilityDemo from "@/pages/FacilityDemo";

import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Router>
      <Switch>
        {/* Marketing website routes */}
        <Route path="/" component={Landing} />
        <Route path="/features" component={Features} />
        <Route path="/individuals" component={Individuals} />
        <Route path="/facilities" component={Facilities} />
        <Route path="/vision" component={Vision} />
        <Route path="/careers" component={Careers} />
        <Route path="/faqs" component={FAQs} />
        <Route path="/contact" component={Contact} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />

        {/* Signup Flow */}
        <Route path="/getstarted" component={GetStarted} />
        <Route path="/getstarted/facility-demo" component={FacilityDemo} />

        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

// Declare global types for Tawk.to
declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

function App() {
  // Load Tawk.to live chat widget
  useEffect(() => {
    // Check if Tawk.to is already loaded
    if (window.Tawk_API) {
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create and load the Tawk.to script
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://embed.tawk.to/68dc2e7e311aad1952563515/1j6e1b7th";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    // Insert the script into the document
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
