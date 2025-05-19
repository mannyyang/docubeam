import { LandingLayout } from "@/components/layout/landing-layout";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/services/api-service";
import { 
  HeroSection, 
  ProblemSection, 
  ValuePropositionSection, 
  CtaSection 
} from "@/components/sections";

export function HomePage() {
  const { toast } = useToast();

  const handleUploadComplete = async (file: File) => {
    try {
      // Upload the document
      const result = await ApiService.uploadDocument(file);

      if (result.status === "success" && result.data) {
        toast({
          title: "Document ready",
          description: `${file.name} is now ready for chat.`,
        });

        // Navigate to chat page with the document ID
        window.history.pushState(
          {},
          "",
          `/chat?documentId=${result.data.documentId}`
        );
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process document. Please try again.",
      });
    }
  };

  return (
    <LandingLayout>
      <HeroSection />
      <ProblemSection />
      <ValuePropositionSection />
      <CtaSection onUploadComplete={handleUploadComplete} />
    </LandingLayout>
  );
}
