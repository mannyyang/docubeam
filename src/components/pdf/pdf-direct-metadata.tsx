import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Upload, FileText } from "lucide-react";
import { ApiService } from "../../services/api-service";

interface PDFMetadataResult {
  filename: string;
  size: number;
  metadata: {
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
  };
}

export function PDFDirectMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState<PDFMetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check if file is a PDF
    if (selectedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a PDF file smaller than 10MB.",
      });
      return;
    }
    
    setFile(selectedFile);
    setMetadata(null);
    setError(null);
  };
  
  const handleExtractMetadata = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a PDF file first.",
      });
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await ApiService.extractPDFMetadata(file);
      
      if (response.status === "success" && response.data) {
        setMetadata(response.data);
        toast({
          title: "Metadata extracted",
          description: "PDF metadata has been successfully extracted.",
        });
      } else {
        throw new Error(response.error || "Failed to extract metadata");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to render metadata values
  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">None</span>;
    }
    
    if (typeof value === "object") {
      return <pre className="text-xs overflow-auto max-h-24 bg-muted p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    return String(value);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Extract PDF Metadata</CardTitle>
          <CardDescription>
            Upload a PDF file to extract its metadata using unpdf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  id="pdf-file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="pdf-file"
                  className="flex items-center gap-2 p-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span>{file ? file.name : "Choose a PDF file"}</span>
                </label>
              </div>
              <Button
                onClick={handleExtractMetadata}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Metadata"
                )}
              </Button>
            </div>
            
            {file && (
              <div className="text-sm text-muted-foreground">
                File size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle>PDF Metadata</CardTitle>
            <CardDescription>
              Metadata for {metadata.filename} ({(metadata.size / 1024 / 1024).toFixed(2)} MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Document Info Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(metadata.metadata.info).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{key}</p>
                      <div className="text-sm">{renderValue(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Document Metadata Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(metadata.metadata.metadata).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{key}</p>
                      <div className="text-sm">{renderValue(value)}</div>
                    </div>
                  ))}
                </div>
                {Object.keys(metadata.metadata.metadata).length === 0 && (
                  <p className="text-muted-foreground italic">No additional metadata available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!metadata && !isUploading && (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No metadata yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a PDF and click "Extract Metadata" to see the results
          </p>
        </div>
      )}
    </div>
  );
}
