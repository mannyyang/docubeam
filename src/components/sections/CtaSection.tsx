import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CtaSectionProps {
  onJoinWaitlist?: (email: string) => Promise<void>;
}

export function CtaSection({ onJoinWaitlist }: CtaSectionProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      // Use the provided handler or default to API call
      if (onJoinWaitlist) {
        await onJoinWaitlist(email);
      } else {
        try {
          const response = await fetch('/api/waitlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed with status: ${response.status}`);
          }
          
          await response.json();
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          // Show a toast but don't rethrow to prevent form submission
          toast({
            title: "Something went wrong",
            description: "Failed to join the waitlist. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return; // Early return to prevent showing success toast
        }
      }
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You've been added to the Docubeam waitlist.",
        variant: "default",
      });
      
      // Clear the form
      setEmail("");
    } catch (error) {
      console.error('Waitlist submission error:', error);
      
      // Show error toast
      toast({
        title: "Something went wrong",
        description: "Failed to join the waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div id="waitlist-section" className="bg-black pt-20 pb-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
          Be the first to experience Docubeam
        </h2>

        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-primary"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-10 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary shadow hover:bg-primary/90 px-4 gap-1 rounded-md text-white dark:text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Join Waitlist</span>
                  <ArrowRight className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
