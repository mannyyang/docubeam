import { ArrowRight, MessageSquare } from "lucide-react";
import { AuroraText } from "@/components/magicui/aurora-text";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBeamMultipleOutputDemo } from "@/components/ui/pipeline";

export function HeroSection() {
  return (
    <section id="hero" className="relative w-full min-h-screen text-center">
      {/* Particles background */}
      <div className="absolute inset-0" aria-hidden="true">
        <Particles
          className="h-full w-full"
          quantity={50}
          staticity={50}
          color="#ffffff"
          ease={50}
          size={0.3}
        />
      </div>
      <div className="mx-auto max-w-[80rem] px-6 md:px-8 pt-32 relative z-10">
        {/* Small badge/pill with shimmer animation */}
        <div className="backdrop-filter-[12px] inline-flex h-7 items-center justify-between rounded-full border border-white/5 bg-white/10 px-3 text-xs text-white dark:text-white transition-all ease-in hover:cursor-pointer hover:bg-white/20 group gap-1 translate-y-[-1rem] animate-fade-in opacity-0">
          <p
            className="mx-auto max-w-md text-white/80 dark:text-white/80 inline-flex items-center justify-center"
          >
            <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
            <span>Introducing PDF Comment Extraction</span>
            <ArrowRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
          </p>
        </div>

        {/* Main heading with animation */}
        <h1 className="py-6 text-5xl font-medium leading-none tracking-tighter text-white text-balance sm:text-6xl md:text-7xl lg:text-8xl translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          <span className="text-white">Stop Chasing Comments,</span>
          <br className="hidden md:block" />
          <AuroraText
            colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8", "#FF4D4D"]}
            speed={0.7}
          >
            Get Actionable Insights
          </AuroraText>
        </h1>

        {/* Subheading with animation */}
        <p className="mb-12 text-lg tracking-tight text-gray-400 md:text-xl text-balance translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
          Prioritize key discussions and centrally organize all data
        </p>

        {/* CTA with email input for waiting list */}
        <form className="flex flex-col sm:flex-row items-center justify-center gap-3 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
          <div className="relative w-full max-w-xs">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-primary"
            />
          </div>
          <Button
            className="h-10 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary shadow hover:bg-primary/90 px-4 gap-1 rounded-md text-white dark:text-black"
            type="submit"
          >
            <span>Join Waiting List</span>
            <ArrowRight className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </form>

        {/* Animated Beam with Border */}
        <div className="relative mt-[8rem] animate-fade-up opacity-0 [--animation-delay:400ms] [perspective:2000px]">
          <div className="rounded-xl border border-white/10 bg-transparent before:absolute before:left-0 before:top-1/4 before:h-full before:w-full before:opacity-0 before:[filter:blur(180px)] before:[background-image:linear-gradient(to_bottom,var(--color-one),var(--color-one),transparent_40%)] before:animate-image-glow">
            <BorderBeam
              size={200}
              duration={12}
              colorFrom="var(--color-one)"
              colorTo="var(--color-two)"
              delay={-11}
              className="absolute inset-[0]"
            />
            <div className="relative z-10 bg-transparent">
              <AnimatedBeamMultipleOutputDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
