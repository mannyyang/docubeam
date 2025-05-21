import { FileText, MessageSquare, ListFilter, Shield } from "lucide-react";
import { BentoCard } from "@/components/magicui/bento-grid";

export function ValuePropositionSection() {
  return (
    <div className="bg-black py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">
          Our Solution
        </h2>

        <div className="grid grid-cols-5 gap-8">
          {/* Top left card - 40% width (2/5 columns) */}
          <div className="col-span-5 md:col-span-2">
            <BentoCard
              Icon={FileText}
              title="Streamline Data"
              description="Our AI technology automatically extracts all annotations, comments, and markups from your PDFs, and organizes them in one central data store."
              bgClassName="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm border border-blue-500/20 hover:shadow-blue-500/5 h-full"
              iconContainerClassName="bg-blue-500/20"
              iconClassName="text-blue-400"
            />
          </div>

          {/* Top right card - 60% width (3/5 columns) */}
          <div className="col-span-5 md:col-span-3">
            <BentoCard
              Icon={ListFilter}
              title="Identify & Prioritize"
              description="With your data streamlined, no more hunting through pages of notes. Instantly identify important feedback and review key discussion points."
              bgClassName="bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm border border-purple-500/20 hover:shadow-purple-500/5 h-full"
              iconContainerClassName="bg-purple-500/20"
              iconClassName="text-purple-400"
            />
          </div>

          {/* Bottom left card - 60% width (3/5 columns) */}
          <div className="col-span-5 md:col-span-3">
            <BentoCard
              Icon={Shield}
              title="Secure"
              description="Your data is safe with us. Our industry leading security practices ensure data you upload and shared with AI is secure."
              bgClassName="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm border border-green-500/20 hover:shadow-green-500/5 h-full"
              iconContainerClassName="bg-green-500/20"
              iconClassName="text-green-400"
            />
          </div>

          {/* Bottom right card - 40% width (2/5 columns) */}
          <div className="col-span-5 md:col-span-2">
            <BentoCard
              Icon={MessageSquare}
              title="AI-First by Design"
              description="Our platform is built from the ground up with AI. Whether it's chatbots or agents, get instant insights and let AI enhance your workflow."
              bgClassName="bg-gradient-to-br from-pink-900/20 to-pink-800/10 backdrop-blur-sm border border-pink-500/20 hover:shadow-pink-500/5 h-full"
              iconContainerClassName="bg-pink-500/20"
              iconClassName="text-pink-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
