import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BirthDataFormJsx from "./BirthDataForm.jsx";
import StyleSelection from "./StyleSelection.jsx";
import LoadingScreen from "./LoadingScreen.jsx";
import { ChartExplanation } from "../Explanation/ChartExplanation";
import { ProductCustomization } from "../Purchase/ProductCustomization";
import { OrderConfirmation } from "../Purchase/OrderConfirmation";
import { calculateNatalChart } from "@/lib/astrology/chartCalculator.js";
import { buildConcretePrompt } from "@/lib/prompts/promptBuilder.js";
import { generateImage } from "@/lib/api/replicateClient";
import { supabase } from "@/integrations/supabase/client";
import { getStyleById } from "@/config/artStyles";
import ProgressBar from '@/components/ui/ProgressBar';

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
      const data = {
        name: searchParams.get("name") || "",
        month: Number(month),
        day: Number(day),
        year: Number(year),
        hour: Number(searchParams.get("hour") || "12"),
        minute: Number(searchParams.get("minute") || "0"),
        city,
        nation: searchParams.get("nation") || "US",
      };
      handleFormSubmit(data);
    }
  }, [searchParams]);

  const handleFormSubmit = async (data) => {
    try {
      setError(null);
      setFormData(data);
      setGenerationProgress("Calculating your birth chart...");

      const chart = await calculateNatalChart(data);
      setChartData(chart);
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
      const prompt = await buildConcretePrompt(chartData, style);

      setGenerationProgress(`Creating your ${style.name} artwork...`);
      const imageUrl = await generateImage(prompt, {
        aspectRatio: "3:4",
        version: style.version,
      });

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

  const handleEditBirthData = () => {
    navigate("/");
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
        body: { orderDetails: details, chartData },
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

  // Check if returning from successful payment
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

  // Loading screen is a full-page component
  if (step === "generating") {
    return (
      <LoadingScreen
        chartData={chartData}
        selectedStyle={selectedStyle}
        generationProgress={generationProgress}
      />
    );
  }

  // Style selection is a full-page component
  if (step === "style" && chartData) {
    return (
      <StyleSelection
        onSelect={handleStyleSelect}
        onBack={handleRetry}
        chartData={chartData}
        formData={formData}
        onEditBirthData={handleEditBirthData}
      />
    );
  }

  // Customization is also full-page
  if (step === "customizing" && chartData && generatedImage) {
    return (
      <ProductCustomization
        chartData={chartData}
        artworkImage={generatedImage}
        onCheckout={handleCheckout}
        onBack={handleBackToExplanation}
        formData={formData}
        onEditBirthData={handleEditBirthData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cosmic">
      {/* Show progress bar for input step */}
      {step === "input" && <ProgressBar currentStep={1} />}

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

      <div className="relative z-10 px-4 py-12">
        <button
          onClick={() => navigate("/")}
          className="text-body-sm text-muted-foreground hover:text-primary transition-colors tracking-wide"
        >
          ← Back to Home
        </button>
        <div className="text-center mb-12">
          <h1 className="text-a1 md:text-5xl lg:text-6xl text-foreground tracking-wide mb-3">
            Celestial <span className="text-primary text-glow">Artworks</span>
          </h1>
          <p className="text-subtitle text-muted-foreground tracking-widest">
            Your birth chart, reimagined as art
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <p className="text-a4 text-destructive mb-2">⚠️ Error</p>
            <p className="text-body-sm text-destructive/80 mb-4">{error}</p>
            <button onClick={handleRetry} className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg hover:bg-destructive/90 transition-colors text-a5">
              Try Again
            </button>
          </div>
        )}

        {step === "input" && (
          <div className="max-w-2xl mx-auto animate-fade-in" style={{ maxWidth: '42rem' }}>
            <BirthDataFormJsx onSubmit={handleFormSubmit} />
          </div>
        )}




        {step === "explaining" && chartData && generatedImage && (
          <div className="animate-fade-in">
            <ProgressBar currentStep={3} />
            <ChartExplanation
              chartData={chartData}
              selectedImage={generatedImage}
              onGetFramed={handleGetFramed}
              formData={formData}
              onEditBirthData={handleEditBirthData}
            />
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={handleBackToStyle} className="text-subtitle text-muted-foreground hover:text-primary transition-colors tracking-wide">
                ← Try Different Style
              </button>
              <button onClick={handleRetry} className="text-subtitle text-muted-foreground hover:text-primary transition-colors tracking-wide">
                ← Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {isCheckingOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-2 border-transparent border-t-primary rounded-full mx-auto" />
            <p className="text-a4 text-foreground">Redirecting to secure checkout...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorFlowJsx;
