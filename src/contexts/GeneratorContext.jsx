import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateNatalChart } from '@/lib/astrology/chartCalculator.js';
import { buildConcretePrompt } from '@/lib/prompts/promptBuilder.js';
import { generateImage } from '@/lib/api/replicateClient';
import { getStyleById } from '@/config/artStyles';
import { supabase } from '@/integrations/supabase/client';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';

const GeneratorContext = createContext(null);

const SESSION_KEY = 'celestial_generator_state';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSession(state) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

export function GeneratorProvider({ children }) {
  const navigate = useNavigate();
  const cached = loadSession();
  const [chartData, setChartData] = useState(cached.chartData || null);
  const [formData, setFormData] = useState(cached.formData || null);
  const [selectedStyle, setSelectedStyle] = useState(cached.selectedStyle || null);
  const [generatedImage, setGeneratedImage] = useState(cached.generatedImage || null);
  const [error, setError] = useState(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [orderDetails, setOrderDetails] = useState(cached.orderDetails || null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [artworkAnalysis, setArtworkAnalysis] = useState(cached.artworkAnalysis || null);

  // Persist critical state to sessionStorage
  useEffect(() => {
    saveSession({ chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis });
  }, [chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis]);

  const handleFormSubmit = useCallback(async (data) => {
    try {
      setError(null);
      setFormData(data);
      setGenerationProgress('Calculating your birth chart...');
      const chart = await calculateNatalChart(data);
      setChartData(chart);
      navigate('/generate/style');
    } catch (err) {
      console.error('❌ Chart calculation error:', err);
      setError(err.message);
    }
  }, [navigate]);

  const handleStyleSelect = useCallback(async (styleId) => {
    const style = getStyleById(styleId);
    setSelectedStyle(style);
    navigate('/generate/loading');

    try {
      setGenerationProgress('Building your personalized artwork prompt...');
      const prompt = await buildConcretePrompt(chartData, style);

      setGenerationProgress(`Creating your ${style.name} artwork...`);
      const imageUrl = await generateImage(prompt);

      setGeneratedImage(imageUrl);

      // Run artwork analysis and image preload in parallel
      setGenerationProgress('Preparing your artist notes...');
      const [analysisResult] = await Promise.allSettled([
        analyzeArtwork(imageUrl, chartData),
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imageUrl;
        }),
      ]);

      // Store analysis if it succeeded (fallback is built into analyzeArtwork)
      if (analysisResult.status === 'fulfilled' && analysisResult.value) {
        setArtworkAnalysis(analysisResult.value);
      }

      navigate('/generate/preview');
    } catch (err) {
      console.error('❌ Generation error:', err);
      setError(err.message);
      navigate('/generate/style');
    }
  }, [chartData, navigate]);

  const handleRetry = useCallback(() => {
    setError(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    navigate('/');
  }, [navigate]);

  const handleEditBirthData = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleBackToStyle = useCallback(() => {
    setError(null);
    navigate('/generate/style');
  }, [navigate]);

  const handleGetFramed = useCallback(() => {
    navigate('/generate/size');
  }, [navigate]);

  const handleBackToPreview = useCallback(() => {
    navigate('/generate/preview');
  }, [navigate]);

  const handleCheckout = useCallback(async (details) => {
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
      console.error('❌ Checkout error:', err);
      setError(err.message);
      setIsCheckingOut(false);
    }
  }, [chartData]);

  const handleTestCheckout = useCallback((details) => {
    setOrderDetails({
      ...details,
      orderNumber: '#CA-TEST-' + Math.floor(Math.random() * 90000 + 10000),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      firstName: formData?.name || 'Test',
      paymentLast4: '4242',
      shippingAddress: 'Test User, 123 Main Street, San Francisco, CA 94102',
    });
    navigate('/order-confirmation');
  }, [formData, navigate]);

  const value = {
    chartData, formData, selectedStyle, generatedImage,
    error, generationProgress, orderDetails, isCheckingOut,
    artworkAnalysis,
    setFormData, setChartData, setError,
    handleFormSubmit, handleStyleSelect, handleRetry,
    handleEditBirthData, handleBackToStyle, handleGetFramed,
    handleBackToPreview, handleCheckout, handleTestCheckout,
  };

  return (
    <GeneratorContext.Provider value={value}>
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (!context) {
    throw new Error('useGenerator must be used within a GeneratorProvider');
  }
  return context;
}