import type { MetaFunction } from "react-router";
import { LandingLayout } from "../components/layout/landing-layout";
import { useToast } from "../hooks/use-toast";
import { ApiService } from "../services/api-service";
import { HeroSection } from "../components/sections/HeroSection";
import { ProblemSection } from "../components/sections/ProblemSection";
import { ValuePropositionSection } from "../components/sections/ValuePropositionSection";
import { HowItWorksSection } from "../components/sections/HowItWorksSection";
import { CtaSection } from "../components/sections/CtaSection";

export const meta: MetaFunction = () => {
  return [
    { title: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { name: "description", content: "Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." },
    { name: "keywords", content: "PDF comments, document management, PDF extraction, comment organization, document insights, PDF annotations" },
    
    // Open Graph
    { property: "og:title", content: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { property: "og:description", content: "Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://docubeam.websyte.ai/" },
    
    // Twitter
    { name: "twitter:title", content: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { name: "twitter:description", content: "Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." },
  ];
};

export default function Index() {
  const { toast } = useToast();

  const handleJoinWaitlist = async (email: string) => {
    try {
      // Call the API service to join the waitlist
      const response = await ApiService.joinWaitlist(email);
      
      if (response.status === "error") {
        throw new Error(response.error || "Failed to join waitlist");
      }
      
      toast({
        title: "Success!",
        description: `${email} has been added to our waitlist. We'll notify you when we launch!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to join waitlist",
        description:
          error instanceof Error
            ? error.message
            : "Failed to join waitlist. Please try again.",
      });
    }
  };

  return (
    <LandingLayout>
      <HeroSection onJoinWaitlist={handleJoinWaitlist} />
      <ProblemSection />
      <ValuePropositionSection />
      <HowItWorksSection />
      <CtaSection onJoinWaitlist={handleJoinWaitlist} />
    </LandingLayout>
  );
}
