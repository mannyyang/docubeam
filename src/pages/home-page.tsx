import { LandingLayout } from "@/components/layout/landing-layout";
import { PDFUpload } from "@/components/pdf/pdf-upload";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/services/api-service";
import {
  FileText,
  MessageSquare,
  ListFilter,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { AnimatedBeamDemo } from "@/components/ui/pipeline";

export function HomePage() {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLButtonElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);

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
      {/* Hero Section */}
      <div className="relative overflow-hidden" ref={containerRef}>
        {/* Background with subtle gradient and animated dots */}
        <div className="absolute inset-0 bg-black">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(white 1px, transparent 0)",
              backgroundSize: "40px 40px",
              backgroundPosition: "0 0",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-12">
            {/* Small badge/pill */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 backdrop-blur-sm mb-6 border border-zinc-800">
              <span className="text-xs font-medium text-white/80">
                Introducing PDF Comment Extraction
              </span>
              <ArrowRight className="h-3 w-3 ml-2 text-white/60" />
            </div>

            {/* Main heading with animation */}
            <h1 className={`bg-gradient-to-br dark:from-white from-black from-30% dark:to-white/40 to-black/40 py-6 text-5xl font-medium leading-none tracking-tighter text-white text-balance sm:text-6xl md:text-7xl lg:text-8xl translate-y-[-1rem] transition-all duration-1000 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}>
              Stop Chasing Comments,<br className="hidden md:block"/> Get Actionable Insights
            </h1>

            {/* Subheading with animation */}
            <p
              className={`text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 transition-all duration-1000 delay-300 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              Prioritize key discussions and centrally organize all data
            </p>

            {/* CTA button with animation */}
            <div
              className={`transition-all duration-1000 delay-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Button
                ref={fromRef}
                className="px-8 py-6 text-lg font-medium bg-white text-black rounded-md shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-300 ease-in-out"
                onClick={() =>
                  document
                    .getElementById("upload-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get Started for free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Target element for the beam */}
            <div ref={toRef} className="h-4 w-4 mx-auto mt-24 opacity-0"></div>

            {/* Animated Beam */}
            {isVisible && <AnimatedBeamDemo />}
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-black py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-white">
              The Bluebeam Challenge
            </h2>
            <p className="mb-4 text-white/80">
              Bluebeam is a vital tool to efficiently collaborate on PDFs, but a
              common challenge is difficulty in organizing feedback between key
              stakeholders.
            </p>
            <p className="text-white/80">
              Collaborators often waste hours on clunky spreadsheets in order to
              organize and further key discussions.
            </p>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-black py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">
            Our Solution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Streamline Data
                </h3>
              </div>
              <p className="text-white/70">
                Our AI technology automatically extracts all annotations,
                comments, and markups from your PDFs, and organizes them in one
                central data store.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                  <ListFilter className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Identify & Prioritize
                </h3>
              </div>
              <p className="text-white/70">
                With your data streamlined, no more hunting through pages of
                notes. Instantly identify important feedback and review key
                discussion points.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 shadow-lg hover:shadow-green-500/5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Secure</h3>
              </div>
              <p className="text-white/70">
                Your data is safe with us. Our industry leading security
                practices ensure data you upload and shared with AI is secure.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/10 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20 shadow-lg hover:shadow-pink-500/5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-pink-500/20 rounded-xl mr-4">
                  <MessageSquare className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  AI-First by Design
                </h3>
              </div>
              <p className="text-white/70">
                Our platform is built from the ground up with AI. Whether it's
                chatbots or agents, get instant insights and let AI enhance your
                workflow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="upload-section" className="bg-black py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to streamline your document review process?
          </h2>
          <p className="text-white/70 mb-12 text-lg">
            Upload your Bluebeam PDF to extract comments and start organizing
            your review process more efficiently.
          </p>

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <PDFUpload
              onUploadComplete={handleUploadComplete}
              darkMode={true}
            />
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
