import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { ApiService } from "../../services/api-service";

import { UploadResponse } from "../../types";

interface PDFUploadProps {
  onUploadComplete?: (file: File, response?: UploadResponse) => void;
  darkMode?: boolean;
}

export function PDFUpload({ onUploadComplete, darkMode = false }: PDFUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);

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

  // Classes based on dark mode
  const textClass = darkMode ? "text-white" : "text-foreground";
  const mutedTextClass = darkMode ? "text-white/70" : "text-muted-foreground";
  const borderClass = darkMode 
    ? (isDragActive ? "border-blue-400 bg-blue-500/10" : "border-white/20 hover:border-blue-400/50") 
    : (isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50");
  const fileIconClass = darkMode ? "bg-blue-500/20 text-blue-400" : "bg-primary/10 text-primary";
  const linkClass = darkMode ? "text-blue-400 hover:text-blue-300" : "text-primary hover:underline";
  
  return (
    <div 
      className={`w-full max-w-2xl mx-auto transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {!darkMode && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Upload PDF</h2>
          <p className="text-muted-foreground">
            Upload a PDF document to chat with its contents
          </p>
        </div>
      )}
      
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${borderClass} ${
            darkMode ? 'backdrop-blur-sm shadow-lg hover:shadow-blue-500/5' : ''
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className={`p-4 rounded-full ${darkMode ? 'bg-blue-500/20' : ''}`}>
              <Upload className={`h-10 w-10 ${darkMode ? 'text-blue-400' : 'text-muted-foreground'}`} />
            </div>
            <h3 className={`text-lg font-medium mt-2 ${textClass}`}>
              {isDragActive ? "Drop the PDF here" : "Drag & drop your PDF here"}
            </h3>
            <p className={`text-sm ${mutedTextClass} mb-2`}>
              or click to browse files
            </p>
            <p className={`text-xs ${mutedTextClass}`}>
              PDF files only, max 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-white/10 backdrop-blur-sm border border-white/20' : 'border'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${fileIconClass}`}>
                <File className="h-6 w-6" />
              </div>
              <div>
                <p className={`font-medium ${textClass}`}>{uploadedFile.name}</p>
                <p className={`text-xs ${mutedTextClass}`}>
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {isUploading ? (
              <Loader2 className={`h-5 w-5 animate-spin ${mutedTextClass}`} />
            ) : (
              <Button
                variant={darkMode ? "ghost" : "ghost"}
                size="sm"
                onClick={removeFile}
                className={darkMode ? "text-white/70 hover:text-red-400 hover:bg-red-500/10" : "text-muted-foreground hover:text-destructive"}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-6">
              <div className={`h-2 w-full ${darkMode ? 'bg-white/10' : 'bg-secondary'} rounded-full overflow-hidden`}>
                <div className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-primary'} rounded-full animate-pulse w-2/3`}></div>
              </div>
              <p className={`text-xs ${mutedTextClass} mt-3 text-center`}>
                Uploading and processing your document...
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className={`mt-6 text-center text-sm ${mutedTextClass}`}>
        <p>
          By uploading a document, you agree to our{" "}
          <a href="#" className={linkClass}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className={linkClass}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
