export function HowItWorksSection() {
  return (
    <div className="bg-black py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">
          How It Works
        </h2>
        
        <div className="mb-8 max-w-3xl mx-auto">
          <p className="text-white/70 text-lg text-center mb-8">
            Just 3 steps to get started
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">1. Upload Documents</h3>
            <p className="text-white/70">
              Upload your PDF documents containing comments, annotations, and markups from Bluebeam or other PDF tools.
            </p>
          </div>
          
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">2. Extract & Organize</h3>
            <p className="text-white/70">
              Our AI automatically extracts all comments and annotations, organizing them in a structured database for easy access.
            </p>
          </div>
          
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">3. Access & Analyze</h3>
            <p className="text-white/70">
              Access your data through our chat interface or insights dashboard to quickly find and analyze important feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
