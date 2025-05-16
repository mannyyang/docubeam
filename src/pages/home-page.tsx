import { MainLayout } from "../components/layout/main-layout";
import { PDFUpload } from "../components/pdf/pdf-upload";
import { useToast } from "../hooks/use-toast";
import { ApiService } from "../services/api-service";
import { FileText, MessageSquare, Table, CheckSquare } from "lucide-react";

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
        window.history.pushState({}, "", `/chat?documentId=${result.data.documentId}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process document. Please try again.",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Transform PDF Comments into Actionable Insights</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Extract, organize, and prioritize Bluebeam comments to easily identify items that need discussion.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-12 bg-muted/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">The Construction Review Challenge</h2>
          <p className="mb-4">
            While Bluebeam is efficient for making and responding to comments on construction PDFs, 
            it's difficult to identify and sort comments where there's disagreement between the design 
            consultant and the owner.
          </p>
          <p>
            Without the ability to use response codes like in Excel spreadsheets, finding items that 
            require further discussion becomes a time-consuming task.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-primary/5 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 mr-2 text-primary" />
              <h3 className="text-xl font-bold">Extract PDF Comments</h3>
            </div>
            <p>
              Our AI technology extracts all comments and annotations from your Bluebeam PDF files, 
              preserving the context and relationships between comments.
            </p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Table className="h-6 w-6 mr-2 text-primary" />
              <h3 className="text-xl font-bold">Spreadsheet Organization</h3>
            </div>
            <p>
              Convert PDF comments into a structured spreadsheet format, making it easy to sort, 
              filter, and identify items that need attention.
            </p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckSquare className="h-6 w-6 mr-2 text-primary" />
              <h3 className="text-xl font-bold">Identify Disagreements</h3>
            </div>
            <p>
              Automatically flag comments where there's disagreement between parties, 
              similar to response codes in Excel, so you can quickly focus on what matters.
            </p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-6 w-6 mr-2 text-primary" />
              <h3 className="text-xl font-bold">AI-Powered Insights</h3>
            </div>
            <p>
              Ask questions about your document comments and get intelligent responses. 
              Our AI can even help draft responses to specific comments.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to streamline your document review process?</h2>
          <p className="text-muted-foreground mb-8">
            Upload your Bluebeam PDF to extract comments and start organizing your review process more efficiently.
          </p>
          
          <PDFUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    </MainLayout>
  );
}
