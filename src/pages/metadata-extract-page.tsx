import { MainLayout } from "../components/layout/main-layout";
import { PDFDirectMetadata } from "../components/pdf/pdf-direct-metadata";

export function MetadataExtractPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">PDF Metadata Extractor</h1>
          <p className="text-muted-foreground mt-2">
            Extract metadata from PDF documents using unpdf without saving them
          </p>
        </div>
        
        <PDFDirectMetadata />
        
        <div className="mt-12 p-4 bg-muted/30 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">About unpdf</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This tool uses <a href="https://github.com/unjs/unpdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">unpdf</a>, 
            a collection of utilities for PDF extraction and rendering designed for serverless environments.
          </p>
          <div className="text-sm space-y-2">
            <p><strong>Features:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Made for Node.js, browser and serverless environments</li>
              <li>Includes serverless build of PDF.js</li>
              <li>Extract text and images from PDF files</li>
              <li>Perfect for AI applications and PDF summarization</li>
              <li>Zero dependencies</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
