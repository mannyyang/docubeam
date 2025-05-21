import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CtaSectionProps {
  onJoinWaitlist?: (email: string) => Promise<void>;
}

export function CtaSection({ onJoinWaitlist }: CtaSectionProps) {
  const [email, setEmail] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onJoinWaitlist) {
      await onJoinWaitlist(email);
      setEmail("");
    }
  };
  return (
    <div id="waitlist-section" className="bg-black pt-20 pb-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
          Be the first to experience our PDF review solution
        </h2>

        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-grow bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-400"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Join Waitlist
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
