import { MainLayout } from "../components/layout/main-layout";
import { PDFUpload } from "../components/pdf/pdf-upload";
import { useToast } from "../hooks/use-toast";
import { ApiService } from "../services/api-service";

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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload PDF</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PDF document to start chatting with its contents. Our AI will
            analyze the document and allow you to ask questions about it.
          </p>
        </div>

        <PDFUpload onUploadComplete={handleUploadComplete} />
      </div>
    </MainLayout>
  );
}