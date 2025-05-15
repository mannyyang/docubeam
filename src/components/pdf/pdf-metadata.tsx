import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ApiService } from "../../services/api-service";
import { PDFMetadata } from "../../types";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PDFMetadataViewProps {
  documentId: string;
}

export function PDFMetadataView({ documentId }: PDFMetadataViewProps) {
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchMetadata() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await ApiService.getPDFMetadata(documentId);
        
        if (response.status === "success" && response.data) {
          setMetadata(response.data as unknown as PDFMetadata);
        } else {
          setError(response.error || "Failed to fetch PDF metadata");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error || "Failed to fetch PDF metadata",
          });
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
        setLoading(false);
      }
    }
    
    if (documentId) {
      fetchMetadata();
    }
  }, [documentId, toast]);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PDF Metadata</CardTitle>
          <CardDescription>Extracting metadata from the PDF document</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PDF Metadata</CardTitle>
          <CardDescription>Error extracting metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PDF Metadata</CardTitle>
          <CardDescription>No metadata available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No metadata could be extracted from this PDF.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Metadata</CardTitle>
        <CardDescription>Metadata extracted using unpdf</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Document Info Section */}
          <div>
            <h3 className="text-lg font-medium mb-2">Document Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(metadata.info).map(([key, value]) => (
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
              {Object.entries(metadata.metadata).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{key}</p>
                  <div className="text-sm">{renderValue(value)}</div>
                </div>
              ))}
            </div>
            {Object.keys(metadata.metadata).length === 0 && (
              <p className="text-muted-foreground italic">No additional metadata available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
