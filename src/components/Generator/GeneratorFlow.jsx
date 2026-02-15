import { useState } from "react";
import BirthDataFormJsx from "./BirthDataForm.jsx";
import { calculateNatalChart } from "@/lib/astrology/chartCalculator.js";
import { buildCanonicalPrompt } from "@/lib/prompts/promptBuilder.js";

const GeneratorFlowJsx = () => {
  const [step, setStep] = useState("input");
  const [chartData, setChartData] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFormSubmit = async (formData) => {
    console.log("[GeneratorFlow] Form submitted:", formData);
    setError(null);
    setStep("generating");
    setLoading(true);

    try {
      // 1. Calculate natal chart from birth data
      const chart = await calculateNatalChart(formData);
      console.log("[GeneratorFlow] Chart calculated:", chart);
      setChartData(chart);

      // 2. Build AI prompt from chart data
      const prompt = buildCanonicalPrompt(chart);
      console.log("[GeneratorFlow] Generated prompt:\n", prompt);

      // TODO: 3. Call image generation API with prompt
      // const image = await generateImage(prompt);
      // setGeneratedImage(image);

      setStep("explaining");
    } catch (err) {
      console.error("[GeneratorFlow] Generation failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep("input");
  };

  return (
    <div className="min-h-screen bg-cosmic py-12 px-4">
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

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-wide mb-3">
            Celestial <span className="text-primary text-glow">Canvas</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
            Your birth chart, reimagined as art
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <button
              onClick={handleRetry}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-body tracking-wide uppercase"
            >
              ← Try Again
            </button>
          </div>
        )}

        {/* Step: Input */}
        {step === "input" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <BirthDataFormJsx onSubmit={handleFormSubmit} />
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
              <div
                className="absolute inset-3 border border-accent/30 rounded-full animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "2s" }}
              />
            </div>
            <div className="text-center">
              <p className="text-foreground font-display text-lg tracking-wide mb-2">
                Generating your personalized birth chart artwork…
              </p>
              <p className="text-muted-foreground text-sm font-body">
                This takes about 30 seconds
              </p>
            </div>
          </div>
        )}

        {/* Step: Explaining */}
        {step === "explaining" && chartData && (
          <div className="max-w-2xl mx-auto space-y-10 animate-fade-in">
            {/* Placeholder for artwork */}
            <div className="bg-secondary/30 border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground font-display text-lg tracking-wide">
                Artwork will appear here
              </p>
              <p className="text-muted-foreground/60 text-xs font-body mt-2">
                Sun: {chartData.sun?.sign} · Moon: {chartData.moon?.sign} · Rising: {chartData.rising}
              </p>
            </div>

            {/* Start over */}
            <div className="text-center">
              <button
                onClick={handleRetry}
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

export default GeneratorFlowJsx;
