import { PDFUpload } from "@/components/pdf/pdf-upload";

interface CtaSectionProps {
  onUploadComplete: (file: File) => Promise<void>;
}

export function CtaSection({ onUploadComplete }: CtaSectionProps) {
  return (
    <div id="upload-section" className="bg-black py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">
          Ready to streamline your document review process?
        </h2>
        <p className="text-white/70 mb-12 text-lg">
          Upload your Bluebeam PDF to extract comments and start organizing
          your review process more efficiently.
        </p>

        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <PDFUpload
            onUploadComplete={onUploadComplete}
            darkMode={true}
          />
        </div>
      </div>
    </div>
  );
}
