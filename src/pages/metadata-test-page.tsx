import { useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { PDFUpload } from "../components/pdf/pdf-upload";
import { PDFMetadataView } from "../components/pdf/pdf-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { UploadResponse } from "../types";

export function MetadataTestPage() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = async (file: File, response: UploadResponse) => {
    setDocumentId(response.documentId);
    setShowMetadata(false);
    
    toast({
      title: "Upload successful",
      description: `${file.name} has been uploaded. Click "Extract Metadata" to view the metadata.`,
    });
  };

  const handleExtractMetadata = () => {
    if (documentId) {
      setShowMetadata(true);
    } else {
      toast({
        variant: "destructive",
        title: "No document",
        description: "Please upload a PDF document first.",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">PDF Metadata Extractor</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PDF document to extract its metadata using unpdf
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to upload and extract metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFUpload 
                onUploadComplete={(file, response) => {
                  if (response) {
                    handleUploadComplete(file, response);
                  }
                }} 
              />
            </CardContent>
          </Card>

          {documentId && (
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleExtractMetadata}
                disabled={showMetadata}
              >
                {showMetadata ? "Metadata Extracted" : "Extract Metadata"}
              </Button>
            </div>
          )}

          {showMetadata && documentId && (
            <PDFMetadataView documentId={documentId} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
