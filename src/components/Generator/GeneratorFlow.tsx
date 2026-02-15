import { useState } from "react";
import BirthDataForm from "./BirthDataForm";
import ChartExplanation from "@/components/Explanation/ChartExplanation";
import { calculateChart, type BirthData, type ChartData } from "@/lib/astrology/chartCalculator";
import { buildArtworkPrompt } from "@/lib/prompts/promptBuilder";

type FlowStep = "input" | "calculating" | "result";

const GeneratorFlow = () => {
  const [step, setStep] = useState<FlowStep>("input");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [artworkPrompt, setArtworkPrompt] = useState<string>("");

  const handleSubmit = async (birthData: BirthData) => {
    setStep("calculating");
    try {
      const chart = await calculateChart(birthData);
      const prompt = buildArtworkPrompt(chart);
      setChartData(chart);
      setArtworkPrompt(prompt);
      setStep("result");
    } catch (err) {
      console.error("Chart calculation failed:", err);
      setStep("input");
    }
  };

  const handleReset = () => {
    setStep("input");
    setChartData(null);
    setArtworkPrompt("");
  };

  return (
    <div className="min-h-screen bg-cosmic flex flex-col items-center justify-center px-4 py-16">
      {/* Decorative stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-foreground/40 rounded-full animate-pulse-glow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-wide mb-3">
            Celestial <span className="text-primary text-glow">Canvas</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
            Your birth chart, reimagined as art
          </p>
        </div>

        {/* Flow Steps */}
        {step === "input" && <BirthDataForm onSubmit={handleSubmit} />}

        {step === "calculating" && (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-3 border border-accent/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "2s" }} />
            </div>
            <p className="text-muted-foreground font-display text-lg tracking-wide">
              Aligning the celestial bodies…
            </p>
          </div>
        )}

        {step === "result" && chartData && (
          <div className="space-y-10 animate-fade-in">
            <ChartExplanation chartData={chartData} />

            {artworkPrompt && (
              <div className="bg-secondary/30 rounded-lg p-5 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-body mb-2">
                  Generated Prompt
                </p>
                <p className="text-sm text-secondary-foreground font-body leading-relaxed">
                  {artworkPrompt}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratorFlow;
