import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateNatalChart } from '@/lib/astrology/chartCalculator.js';
import { buildConcretePrompt } from '@/lib/prompts/promptBuilder.js';
import { generateImage, resetGenerationCache } from '@/lib/api/replicateClient';
import { getStyleById } from '@/config/artStyles';
import { supabase } from '@/integrations/supabase/client';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { trackCheckoutStarted } from '@/lib/klaviyo';

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
  const [generationComplete, setGenerationComplete] = useState(cached.generationComplete || false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [orderDetails, setOrderDetails] = useState(cached.orderDetails || null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCalculatingChart, setIsCalculatingChart] = useState(false);
  const [artworkAnalysis, setArtworkAnalysis] = useState(cached.artworkAnalysis || null);
  const [artworkId, setArtworkId] = useState(cached.artworkId || null);
  const [userPhotoUrl, setUserPhotoUrl] = useState(cached.userPhotoUrl || null);
  const [isPortraitEdition, setIsPortraitEdition] = useState(cached.isPortraitEdition || false);
  const isGeneratingRef = useRef(false);
  const isCalculatingChartRef = useRef(false);

  // Persist critical state to sessionStorage
  useEffect(() => {
    saveSession({ chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis, artworkId, userPhotoUrl, isPortraitEdition, generationComplete });
  }, [chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis, artworkId, userPhotoUrl, isPortraitEdition, generationComplete]);

  const handleFormSubmit = useCallback(async (data) => {
    if (isCalculatingChartRef.current) return;

    try {
      isCalculatingChartRef.current = true;
      setIsCalculatingChart(true);
      setError(null);
      setFormData(data);

      if (data.userPhotoUrl) {
        setUserPhotoUrl(data.userPhotoUrl);
        setIsPortraitEdition(true);
      } else {
        setUserPhotoUrl(null);
        setIsPortraitEdition(false);
      }

      setGenerationProgress('Calculating your birth chart...');
      const chart = await calculateNatalChart(data);
      chart.gender = data.gender || null;
      setChartData(chart);

      // Only navigate if we're not already on the style page
      if (window.location.pathname !== '/generate/style') {
        navigate('/generate/style');
      }
    } catch (err) {
      console.error('❌ Chart calculation error:', err);

      const msg = String(err?.message || 'Failed to calculate natal chart. Please try again.');
      if (msg.includes('rate limit') || msg.includes('[429]')) {
        setError('Too many chart requests at once. Please wait about a minute and try again.');
      } else if (msg.includes('sufficient credit balance') || msg.includes('[403]')) {
        setError('Chart service is temporarily unavailable right now. Please try again shortly.');
      } else {
        setError(msg);
      }
    } finally {
      isCalculatingChartRef.current = false;
      setIsCalculatingChart(false);
    }
  }, [navigate]);

  const handleStyleSelect = useCallback(async (styleId) => {
    // Prevent double-click race condition
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    const style = getStyleById(styleId);
    setSelectedStyle(style);
    setArtworkAnalysis(null);
    setArtworkId(null);
    navigate('/generate/loading');

    try {
      setGenerationProgress('Building your personalized artwork prompt...');
      const prompt = await buildConcretePrompt(chartData, style, isPortraitEdition, formData?.gender || null);

      setGenerationProgress('Submitting your artwork...');
      const result = await generateImage(
        prompt, style.sref, style.personalization, style.profileCode, userPhotoUrl, style.id,
        // Real-time progress callback from polling
        (progressData) => {
          if (progressData.stage === 'submitting') {
            setGenerationProgress('Submitting your artwork...');
          } else if (progressData.stage === 'generating') {
            const pollCount = progressData.pollCount || 0;
            // Update progress with poll count so LoadingScreen can map to real %
            setGenerationProgress(`generating:${pollCount}`);
          }
        }
      );
      const apiframeTaskId = result.taskId;

      setGeneratedImage(result.imageUrl);

      // Pre-load image into browser cache before navigating
      setGenerationProgress('Preparing your artwork...');
      const preloadImg = new Image();
      preloadImg.src = result.imageUrl;
      await new Promise((resolve) => {
        preloadImg.onload = resolve;
        preloadImg.onerror = resolve;
        setTimeout(resolve, 5000);
      });

      // Run artwork analysis in parallel (don't block navigation)
      setGenerationProgress('Preparing your artist notes...');
      const [analysisResult] = await Promise.allSettled([
        analyzeArtwork(result.imageUrl, chartData),
      ]);

      // Store analysis if it succeeded (fallback is built into analyzeArtwork)
      const analysisValue = analysisResult.status === 'fulfilled' ? analysisResult.value : null;
      if (analysisValue) {
        setArtworkAnalysis(analysisValue);
      }

      // Signal loading screen that generation is complete (it handles the delay + navigation)
      setGenerationComplete(true);
      isGeneratingRef.current = false;

      // Fire-and-forget: persist artwork to Supabase Storage + database
      const sessionId = sessionStorage.getItem('celestial_session_id') || crypto.randomUUID();
      sessionStorage.setItem('celestial_session_id', sessionId);

      supabase.functions.invoke('store-artwork', {
        body: {
          cdnUrl: result.imageUrl,
          chartData,
          formData,
          artStyle: style.id,
          promptUsed: prompt,
          artworkAnalysis: analysisValue,
          sessionId,
          taskId: apiframeTaskId,
          isPortraitEdition,
        },
      }).then(({ data: storeData, error: storeError }) => {
        if (storeError) {
          console.warn('⚠️ Artwork storage failed (non-blocking):', storeError.message);
          return;
        }
        if (storeData?.permanentUrl) {
          console.log('✅ Artwork stored permanently:', storeData.permanentUrl);
          setGeneratedImage(storeData.permanentUrl);
          setArtworkId(storeData.artworkId);
          try {
            sessionStorage.setItem('celestial_artwork_id', storeData.artworkId);
          } catch { /* quota exceeded — ignore */ }
        }
      }).catch(err => console.warn('⚠️ Artwork storage failed (non-blocking):', err));
    } catch (err) {
      console.error('❌ Generation error:', err);
      setError(err.message);
      isGeneratingRef.current = false;
      navigate('/generate/style');
    }
  }, [chartData, formData, navigate, isPortraitEdition, userPhotoUrl]);

  const handleRetry = useCallback(() => {
    setError(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setArtworkAnalysis(null);
    setArtworkId(null);
    setUserPhotoUrl(null);
    setIsPortraitEdition(false);
    isGeneratingRef.current = false;
    resetGenerationCache();
    navigate('/');
  }, [navigate]);

  const handleEditBirthData = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleBackToStyle = useCallback(() => {
    setError(null);
    isGeneratingRef.current = false;
    navigate('/generate/style');
  }, [navigate]);

  const handleGetFramed = useCallback(() => {
    navigate('/generate/size');
  }, [navigate]);

  const handleBackToPreview = useCallback(() => {
    navigate('/generate/preview');
  }, [navigate]);

  const handleCheckout = useCallback(async (details) => {
    const enrichedDetails = {
      ...details,
      orderNumber: `#CA-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      firstName: formData?.name || '',
    };
    setOrderDetails(enrichedDetails);
    setIsCheckingOut(true);
    setError(null);

    try {
      // Step 1: Save order data to database
      let celestialOrderId = null;
      try {
        const saveResponse = await fetch(
          'https://kdfojrmzhpfphvgwgeov.supabase.co/functions/v1/save-order-data',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: formData?.name || null,
              customerEmail: sessionStorage.getItem('celestial_captured_email') || null,
              chartData: chartData,
              artworkAnalysis: artworkAnalysis,
              generatedImageUrl: generatedImage,
              subjectExplanation: artworkAnalysis?.subjectExplanation || null,
            }),
          }
        );
        const saveData = await saveResponse.json();
        celestialOrderId = saveData.orderId;
        sessionStorage.setItem('celestial_order_id', celestialOrderId);
      } catch (saveErr) {
        console.warn('⚠️ Order data save failed (non-blocking):', saveErr);
      }

      // Step 2: Create Shopify checkout
      const checkoutBody = {
        orderDetails: enrichedDetails,
        chartData,
        artworkImageUrl: generatedImage,
        customerName: formData?.name,
        artworkId,
        celestialOrderId,
      };
      const affiliateDtId = sessionStorage.getItem('affiliate_dt_id');
      if (affiliateDtId) checkoutBody.affiliate_dt_id = affiliateDtId;

      console.log('Checkout request body:', JSON.stringify(checkoutBody));
      const { data, error: fnError } = await supabase.functions.invoke('create-shopify-checkout', {
        body: checkoutBody,
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');

      const capturedEmail = sessionStorage.getItem('celestial_captured_email');
      if (capturedEmail) {
        trackCheckoutStarted({
          email: capturedEmail,
          artworkUrl: generatedImage,
          size: enrichedDetails.size || '16x24',
          price: enrichedDetails.price || 119,
          checkoutUrl: data.url,
        });
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('❌ Checkout error:', err);
      setError(err.message);
      setIsCheckingOut(false);
    }
  }, [chartData, formData, generatedImage, artworkAnalysis, artworkId]);

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
    isCalculatingChart,
    artworkAnalysis, generationComplete, artworkId,
    userPhotoUrl, isPortraitEdition,
    setFormData, setChartData, setError, setGeneratedImage, setArtworkAnalysis,
    setGenerationComplete, setArtworkId,
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