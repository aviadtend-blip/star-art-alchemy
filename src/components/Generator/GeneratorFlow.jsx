import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BirthDataFormJsx from "./BirthDataForm.jsx";
import StyleSelection from "./StyleSelection.jsx";
import { ChartExplanation } from "../Explanation/ChartExplanation";
import { ProductCustomization } from "../Purchase/ProductCustomization";
import { OrderConfirmation } from "../Purchase/OrderConfirmation";
import { calculateNatalChart } from "@/lib/astrology/chartCalculator.js";
import { buildConcretePrompt } from "@/lib/prompts/promptBuilder.js";
import { generateImage, testConnection } from "@/lib/api/replicateClient";
import { supabase } from "@/integrations/supabase/client";
import { getStyleById } from "@/config/artStyles";

const GeneratorFlowJsx = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState("input");
  const [chartData, setChartData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [generationProgress, setGenerationProgress] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const autoSubmitted = useRef(false);

  // Auto-submit if query params are present from landing page
  useEffect(() => {
    if (autoSubmitted.current) return;
    const month = searchParams.get("month");
    const day = searchParams.get("day");
    const year = searchParams.get("year");
    const city = searchParams.get("city");
    if (month && day && year && city) {
      autoSubmitted.current = true;
      handleFormSubmit({
        name: searchParams.get("name") || "",
        month: Number(month),
        day: Number(day),
        year: Number(year),
        hour: Number(searchParams.get("hour") || "12"),
        minute: Number(searchParams.get("minute") || "0"),
        city,
        nation: searchParams.get("nation") || "US",
      });
    }
  }, [searchParams]);

  const handleFormSubmit = async (data) => {
    try {
      setError(null);
      setFormData(data);

      setGenerationProgress("Calculating your birth chart...");
      console.log("📋 Form submitted:", data);

      const chart = await calculateNatalChart(data);
      setChartData(chart);
      console.log("✅ Chart calculated:", chart);

      // Go to style selection instead of generating immediately
      setStep("style");
    } catch (err) {
      console.error("❌ Chart calculation error:", err);
      setError(err.message);
      setStep("input");
    }
  };

  const handleStyleSelect = async (styleId) => {
    const style = getStyleById(styleId);
    setSelectedStyle(style);
    setStep("generating");

    try {
      setGenerationProgress("Building your personalized artwork prompt...");
      const prompt = buildConcretePrompt(chartData, style);
      console.log("📝 Concrete prompt built:", prompt.substring(0, 200) + "...");

      setGenerationProgress(`Generating your ${style.name} artwork... (this takes 30-60 seconds)`);
      console.log("🎨 Calling Replicate API with style:", style.name);

      const imageUrl = await generateImage(prompt, {
        aspectRatio: "3:4",
        version: style.version,
      });
      console.log("✅ Image generated:", imageUrl);

      setGeneratedImage(imageUrl);
      setStep("explaining");
    } catch (err) {
      console.error("❌ Generation error:", err);
      setError(err.message);
      setStep("style");
    }
  };

  const handleRetry = () => {
    setError(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setStep("input");
  };

  const handleBackToStyle = () => {
    setError(null);
    setStep("style");
  };

  const handleGetFramed = () => {
    setStep("customizing");
  };

  const handleCheckout = async (details) => {
    setOrderDetails(details);
    setIsCheckingOut(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: {
          orderDetails: details,
          chartData,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err) {
      console.error("❌ Checkout error:", err);
      setError(err.message);
      setIsCheckingOut(false);
    }
  };

  const handleBackToExplanation = () => {
    setStep("explaining");
  };

  // Check if we're returning from a successful payment
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  if (sessionId && step !== "confirmed") {
    return (
      <OrderConfirmation
        chartData={chartData}
        artworkImage={generatedImage}
        orderDetails={orderDetails}
        onNewChart={handleRetry}
      />
    );
  }

  return (
    <div className={step === "customizing" ? "" : "min-h-screen bg-cosmic py-12 px-4"}>
      {step !== "customizing" && (
        <>
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
            <button
              onClick={() => navigate("/")}
              className="absolute top-0 left-0 text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide"
            >
              ← Back to Home
            </button>
            <div className="text-center mb-12">
              <h1 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-wide mb-3">
                Celestial <span className="text-primary text-glow">Canvas</span>
              </h1>
              <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
                Your birth chart, reimagined as art
              </p>
            </div>
          </div>
        </>
      )}

      {error && step !== "customizing" && (
        <div className="max-w-md mx-auto mb-8 bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center relative z-10">
          <p className="text-destructive font-display text-lg mb-2">⚠️ Error</p>
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
        <div className="max-w-2xl mx-auto animate-fade-in relative z-10" style={{ maxWidth: '42rem' }}>
          <BirthDataFormJsx onSubmit={handleFormSubmit} />
        </div>
      )}

      {step === "style" && chartData && (
        <div className="animate-fade-in">
          {/* Show chart summary */}
          <div className="text-center mb-8 p-4 bg-secondary/30 border border-border rounded-lg max-w-md mx-auto relative z-10">
            <h3 className="font-display text-foreground mb-2">Your Astrological Placements:</h3>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <div>☀️ Sun in {chartData.sun.sign}</div>
              <div>🌙 Moon in {chartData.moon.sign}</div>
              <div>⬆️ {chartData.rising} Rising</div>
            </div>
          </div>
          <StyleSelection onSelect={handleStyleSelect} onBack={handleRetry} chartData={chartData} />
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade-in relative z-10">
          {chartData && selectedStyle && (
            <div className="text-center mb-6 p-4 bg-secondary/30 border border-border rounded-lg">
              <h3 className="font-display text-foreground mb-2">Your Astrological Placements:</h3>
              <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-2">
                <div>☀️ Sun in {chartData.sun.sign}</div>
                <div>🌙 Moon in {chartData.moon.sign}</div>
                <div>⬆️ {chartData.rising} Rising</div>
              </div>
              <div className="text-xs text-primary font-body">Style: {selectedStyle.name}</div>
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
            <p className="text-foreground font-display text-lg tracking-wide mb-2">Creating Your Artwork...</p>
            <p className="text-primary text-sm font-body mb-1">{generationProgress}</p>
            <p className="text-muted-foreground text-xs font-body">This usually takes 30-60 seconds</p>
          </div>
        </div>
      )}

      {step === "explaining" && chartData && generatedImage && (
        <div className="animate-fade-in relative z-10">
          <ChartExplanation
            chartData={chartData}
            selectedImage={generatedImage}
            onGetFramed={handleGetFramed}
          />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleBackToStyle}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
            >
              ← Try Different Style
            </button>
            <button
              onClick={handleRetry}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
            >
              ← Start Over
            </button>
          </div>
        </div>
      )}

      {step === "customizing" && chartData && generatedImage && (
        <ProductCustomization
          chartData={chartData}
          artworkImage={generatedImage}
          onCheckout={handleCheckout}
          onBack={handleBackToExplanation}
        />
      )}

      {isCheckingOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-2 border-transparent border-t-primary rounded-full mx-auto" />
            <p className="text-foreground font-display text-lg">Redirecting to secure checkout...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorFlowJsx;
