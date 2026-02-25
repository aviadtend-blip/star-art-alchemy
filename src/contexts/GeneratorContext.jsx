import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateNatalChart } from '@/lib/astrology/chartCalculator.js';
import { buildConcretePrompt } from '@/lib/prompts/promptBuilder.js';
import { generateImage } from '@/lib/api/replicateClient';
import { getStyleById } from '@/config/artStyles';
import { supabase } from '@/integrations/supabase/client';

const GeneratorContext = createContext(null);

export function GeneratorProvider({ children }) {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
      const imageUrl = await generateImage(prompt, {
        aspectRatio: '3:4',
        version: style.version,
      });

      setGeneratedImage(imageUrl);
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

  const value = {
    chartData, formData, selectedStyle, generatedImage,
    error, generationProgress, orderDetails, isCheckingOut,
    setFormData, setChartData, setError,
    handleFormSubmit, handleStyleSelect, handleRetry,
    handleEditBirthData, handleBackToStyle, handleGetFramed,
    handleBackToPreview, handleCheckout,
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
