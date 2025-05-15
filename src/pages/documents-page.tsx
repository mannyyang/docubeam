import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { DocumentList, Document } from "../components/pdf/document-list";
import { PDFMetadataView } from "../components/pdf/pdf-metadata";
import { useToast } from "../hooks/use-toast";
import { ApiService } from "../services/api-service";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await ApiService.getDocuments();
        
        if (response.status === "success" && response.data) {
          setDocuments(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch documents");
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch documents");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch documents. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDocuments();
  }, [toast]);

  const handleSelectDocument = (document: Document) => {
    // Navigate to the chat page with the selected document
    window.history.pushState({}, "", `/chat?documentId=${document.id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await ApiService.deleteDocument(documentId);
      
      if (response.status === "success") {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        toast({
          title: "Document deleted",
          description: "The document has been successfully deleted.",
        });
      } else {
        throw new Error(response.error || "Failed to delete document");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document. Please try again.",
      });
    }
  };

  const handleViewMetadata = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setMetadataDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your uploaded PDF documents
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDeleteDocument}
            onViewMetadata={handleViewMetadata}
          />
        )}
      </div>

      <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>PDF Metadata</DialogTitle>
          </DialogHeader>
          {selectedDocumentId && (
            <PDFMetadataView documentId={selectedDocumentId} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
