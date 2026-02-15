import { useState } from "react";
import BirthDataFormJsx from "./BirthDataForm.jsx";
import { calculateNatalChart } from "@/lib/astrology/chartCalculator.js";
import { buildCanonicalPrompt } from "@/lib/prompts/promptBuilder.js";
import { generateImage } from "@/lib/api/replicateClient";

const GeneratorFlowJsx = () => {
  const [step, setStep] = useState("input");
  const [chartData, setChartData] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [generationProgress, setGenerationProgress] = useState("");

  const handleFormSubmit = async (formData) => {
    try {
      setError(null);
      setStep("generating");

      // Step 1: Calculate natal chart
      setGenerationProgress("Calculating your birth chart...");
      console.log("📋 Form submitted:", formData);

      const chart = await calculateNatalChart(formData);
      setChartData(chart);
      console.log("✅ Chart calculated:", chart);

      // Step 2: Build canonical prompt with zodiac symbolism
      setGenerationProgress("Building your personalized artwork prompt...");
      const prompt = buildCanonicalPrompt(chart);
      console.log("📝 Prompt built (first 200 chars):", prompt.substring(0, 200) + "...");
      console.log("📏 Full prompt length:", prompt.length, "characters");

      // Step 3: Generate image using Replicate API
      setGenerationProgress("Generating your magical pink watercolor artwork... (this takes 30-60 seconds)");
      console.log("🎨 Calling Replicate API...");

      const imageUrl = await generateImage(prompt, { aspectRatio: "3:4" });
      console.log("✅ Image generated:", imageUrl);

      setGeneratedImage(imageUrl);
      setStep("explaining");
    } catch (err) {
      console.error("❌ Generation error:", err);
      setError(err.message);
      setStep("input");
    }
  };

  const handleRetry = () => {
    setError(null);
    setGeneratedImage(null);
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
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-wide mb-3">
            Celestial <span className="text-primary text-glow">Canvas</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
            Your birth chart, reimagined as art
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <p className="text-destructive font-display text-lg mb-2">⚠️ Generation Failed</p>
            <p className="text-destructive/80 text-sm mb-4 font-body">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg hover:bg-destructive/90 transition-colors font-body text-sm tracking-wide"
            >
              Try Again
            </button>
          </div>
        )}

        {step === "input" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <BirthDataFormJsx onSubmit={handleFormSubmit} />
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade-in">
            {chartData && (
              <div className="text-center mb-6 p-4 bg-secondary/30 border border-border rounded-lg">
                <h3 className="font-display text-foreground mb-2">Your Astrological Placements:</h3>
                <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                  <div>☀️ Sun in {chartData.sun.sign}</div>
                  <div>🌙 Moon in {chartData.moon.sign}</div>
                  <div>⬆️ {chartData.rising} Rising</div>
                </div>
              </div>
            )}
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
                Creating Your Artwork...
              </p>
              <p className="text-primary text-sm font-body mb-1">
                {generationProgress}
              </p>
              <p className="text-muted-foreground text-xs font-body">
                This usually takes 30-60 seconds
              </p>
            </div>
          </div>
        )}

        {step === "explaining" && chartData && generatedImage && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
              <p className="text-muted-foreground font-body text-xs tracking-widest uppercase mb-2">
                Your Personalized Birth Chart Artwork
              </p>
              <p className="text-muted-foreground/60 text-xs font-body">
                ☀️ {chartData.sun?.sign} · 🌙 {chartData.moon?.sign} · ⬆️ {chartData.rising} Rising
              </p>
            </div>

            <div className="bg-secondary/20 border border-border rounded-lg overflow-hidden shadow-lg">
              <img
                src={generatedImage}
                alt={`Birth chart artwork for Sun in ${chartData.sun?.sign}, Moon in ${chartData.moon?.sign}, ${chartData.rising} Rising`}
                className="w-full h-auto"
              />
            </div>

            <div className="flex justify-center gap-4">
              <a
                href={generatedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-body tracking-wide uppercase"
              >
                View Full Size ↗
              </a>
              <button
                onClick={handleRetry}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
              >
                ← Generate Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test button for quick testing */}
      <button
        onClick={() =>
          handleFormSubmit({
            year: 1995,
            month: 3,
            day: 21,
            hour: 14,
            minute: 30,
            city: "Los Angeles",
            nation: "US",
          })
        }
        className="fixed bottom-4 right-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-accent/90 transition-colors z-50 font-body"
      >
        🧪 Test Generation
      </button>
    </div>
  );
};

export default GeneratorFlowJsx;
