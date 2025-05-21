import { LandingLayout } from "@/components/layout/landing-layout";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/services/api-service";
import { 
  HeroSection, 
  ProblemSection, 
  ValuePropositionSection,
  HowItWorksSection,
  CtaSection 
} from "@/components/sections";

export function HomePage() {
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
