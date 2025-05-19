import {
  FileText,
  MessageSquare,
  ListFilter,
  Shield,
} from "lucide-react";

export function ValuePropositionSection() {
  return (
    <div className="bg-black py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 text-center text-white">
          Our Solution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Streamline Data
              </h3>
            </div>
            <p className="text-white/70">
              Our AI technology automatically extracts all annotations,
              comments, and markups from your PDFs, and organizes them in one
              central data store.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                <ListFilter className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Identify & Prioritize
              </h3>
            </div>
            <p className="text-white/70">
              With your data streamlined, no more hunting through pages of
              notes. Instantly identify important feedback and review key
              discussion points.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 shadow-lg hover:shadow-green-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Secure</h3>
            </div>
            <p className="text-white/70">
              Your data is safe with us. Our industry leading security
              practices ensure data you upload and shared with AI is secure.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/10 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20 shadow-lg hover:shadow-pink-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-pink-500/20 rounded-xl mr-4">
                <MessageSquare className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                AI-First by Design
              </h3>
            </div>
            <p className="text-white/70">
              Our platform is built from the ground up with AI. Whether it's
              chatbots or agents, get instant insights and let AI enhance your
              workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
