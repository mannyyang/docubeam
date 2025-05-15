import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { ApiService } from "../../services/api-service";

import { UploadResponse } from "../../types";

interface PDFUploadProps {
  onUploadComplete?: (file: File, response?: UploadResponse) => void;
}

export function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      
      // Check if file is a PDF
      if (file.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF file.",
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a PDF file smaller than 10MB.",
        });
        return;
      }
      
      setUploadedFile(file);
      
      // Upload the file
      setIsUploading(true);
      
      try {
        const result = await ApiService.uploadDocument(file);
        
        if (result.status === "success" && result.data) {
          setIsUploading(false);
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded.`,
          });
          
          if (onUploadComplete) {
            onUploadComplete(file, result.data);
          }
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (error) {
        setIsUploading(false);
        setUploadedFile(null);
        
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        });
      }
    },
    [toast, onUploadComplete]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });
  
  const removeFile = () => {
    setUploadedFile(null);
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Upload PDF</h2>
        <p className="text-muted-foreground">
          Upload a PDF document to chat with its contents
        </p>
      </div>
      
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium mt-2">
              {isDragActive ? "Drop the PDF here" : "Drag & drop your PDF here"}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              PDF files only, max 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-2/3"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Uploading and processing your document...
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          By uploading a document, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
