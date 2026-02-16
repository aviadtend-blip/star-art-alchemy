import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import BirthDataFormJsx from "./BirthDataForm.jsx";
import { ChartExplanation } from "../Explanation/ChartExplanation";
import { ProductCustomization } from "../Purchase/ProductCustomization";
import { OrderConfirmation } from "../Purchase/OrderConfirmation";
import { calculateNatalChart } from "@/lib/astrology/chartCalculator.js";
import { buildCanonicalPrompt } from "@/lib/prompts/promptBuilder.js";
import { generateImage, testConnection } from "@/lib/api/replicateClient";
import { supabase } from "@/integrations/supabase/client";

const GeneratorFlowJsx = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState("input");
  const [chartData, setChartData] = useState(null);
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

  const handleFormSubmit = async (formData) => {
    try {
      setError(null);
      setStep("generating");

      setGenerationProgress("Calculating your birth chart...");
      console.log("📋 Form submitted:", formData);

      const chart = await calculateNatalChart(formData);
      setChartData(chart);
      console.log("✅ Chart calculated:", chart);

      setGenerationProgress("Building your personalized artwork prompt...");
      const prompt = buildCanonicalPrompt(chart);
      console.log("📝 Prompt built (first 200 chars):", prompt.substring(0, 200) + "...");

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

      // Redirect to Stripe Checkout
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
    // Show confirmation
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
          <div className="text-center mb-4">
            <button
              onClick={async () => {
                console.log("🔌 Testing Replicate API connection...");
                const result = await testConnection();
                if (result.success) {
                  alert("✅ API Connection Successful!");
                } else {
                  alert("❌ API Connection Failed\n\n" + result.error);
                }
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase border border-border rounded px-3 py-1"
            >
              🔌 Test API Connection
            </button>
          </div>
          <BirthDataFormJsx onSubmit={handleFormSubmit} />
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade-in relative z-10">
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
              onClick={handleRetry}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
            >
              ← Generate Another
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

      {/* Test button */}
      {step === "input" && (
        <button
          onClick={() =>
            handleFormSubmit({
              year: 1995, month: 3, day: 21, hour: 14, minute: 30, city: "Los Angeles", nation: "US",
            })
          }
          className="fixed bottom-4 right-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-accent/90 transition-colors z-50 font-body"
        >
          🧪 Test Generation
        </button>
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
