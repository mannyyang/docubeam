import { useRef } from "react";
import { ArrowRight, MessageSquare } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Button } from "@/components/ui/button";
import { AnimatedBeamMultipleOutputDemo } from "@/components/ui/pipeline";
import { Particles } from "@/components/magicui/particles";
import { BorderBeam } from "@/components/magicui/border-beam";

interface HeroSectionProps {
  isVisible: boolean;
}

export function HeroSection({ isVisible }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Background with particles */}
      <div className="absolute inset-0 bg-black">
        <Particles
          className="absolute inset-0 z-0"
          quantity={200}
          staticity={80}
          color="#ffffff"
          ease={50}
          size={0.3}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-12">
          {/* Small badge/pill */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 backdrop-blur-sm mb-6 border border-zinc-800">
            <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
            <AnimatedShinyText className="text-xs font-medium text-white/80">
              Introducing PDF Comment Extraction
            </AnimatedShinyText>
            <ArrowRight className="h-3 w-3 ml-2 text-white/60" />
          </div>

          {/* Main heading with animation */}
          <h1 className={`py-6 text-5xl font-medium leading-none tracking-tighter text-white text-balance sm:text-6xl md:text-7xl lg:text-8xl translate-y-[-1rem] transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}>
            <span className="text-white">
              Stop Chasing Comments,
            </span>
            <br className="hidden md:block"/>
            <AuroraText 
              colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8", "#FF4D4D"]}
              speed={0.7}
            >
              Get Actionable Insights
            </AuroraText>
          </h1>

          {/* Subheading with animation */}
          <p
            className={`text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 transition-all duration-1000 delay-300 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            Prioritize key discussions and centrally organize all data
          </p>

          {/* CTA button with animation */}
          <div
            className={`transition-all duration-1000 delay-500 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <Button
              ref={fromRef}
              className="px-8 py-6 text-lg font-medium bg-white text-black rounded-md shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-300 ease-in-out"
              onClick={() =>
                document
                  .getElementById("upload-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started for free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Animated Beam with Border */}
          {isVisible && (
            <div className="relative mt-12">
              <div className="relative rounded-xl border border-white/10 overflow-hidden">
                <BorderBeam 
                  size={200}
                  duration={12}
                  colorFrom="#ffaa40"
                  colorTo="#9c40ff"
                  delay={-11}
                  className="absolute inset-0 rounded-xl"
                />
                <div className="relative z-10">
                  <AnimatedBeamMultipleOutputDemo />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
