import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { ChatInterface } from "../components/chat/chat-interface";
import { Document } from "../components/pdf/document-list";
import { Button } from "../components/ui/button";
import { FileText, ChevronLeft, Loader2 } from "lucide-react";
import { ApiService } from "../services/api-service";
import { useToast } from "../hooks/use-toast";

export function ChatPage() {
  const { toast } = useToast();
  
  // Get document ID from URL query params
  const queryParams = new URLSearchParams(window.location.search);
  const documentId = queryParams.get("documentId");
  
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchDocument() {
      if (!documentId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await ApiService.getDocument(documentId);
        
        if (response.status === "success" && response.data) {
          setSelectedDocument(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch document");
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch document");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch document. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDocument();
  }, [documentId, toast]);

  return (
    <MainLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.history.pushState({}, "", "/documents");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to documents</span>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          </div>
          
          {selectedDocument && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Chatting with: {selectedDocument.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => {
                  window.history.pushState({}, "", "/documents");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}>
                  Return to Documents
                </Button>
              </div>
            </div>
          ) : !documentId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <p className="mb-4">No document selected. Please select a document to chat with.</p>
                <Button onClick={() => {
                  window.history.pushState({}, "", "/documents");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}>
                  Browse Documents
                </Button>
              </div>
            </div>
          ) : (
            <ChatInterface document={selectedDocument} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}