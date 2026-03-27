import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateNatalChart } from '@/lib/astrology/chartCalculator.js';
import { buildConcretePrompt } from '@/lib/prompts/promptBuilder.js';
import { generateImage, resetGenerationCache } from '@/lib/api/replicateClient';
import { getStyleById } from '@/config/artStyles';
import { supabase } from '@/integrations/supabase/client';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { trackCheckoutStarted } from '@/lib/klaviyo';
import { trackGenerateArtwork, trackBeginCheckout } from '@/lib/analytics';
import { trackMetaGenerateArtwork, trackMetaBeginCheckout } from '@/lib/meta-pixel';

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

function readSessionJSON(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toBirthDate(data) {
  if (!data) return null;
  if (data.date) return String(data.date);

  const year = data.year ?? data.birthYear;
  const month = data.month ?? data.birthMonth;
  const day = data.day ?? data.birthDay;

  if (!year || !month || !day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toBirthTime(data) {
  if (!data) return null;
  if (data.time) return String(data.time);

  const hour = data.hour ?? data.birthHour;
  const minute = data.minute ?? data.birthMinute;

  if (hour === undefined || hour === null || minute === undefined || minute === null) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toBirthPlace(data) {
  if (!data) return null;
  if (data.location) return String(data.location);

  const city = data.city ?? data.birthCity;
  const country = data.nation ?? data.birthCountry;
  if (!city) return null;
  return country ? `${city}, ${country}` : String(city);
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
  const [funnelMode, setFunnelMode] = useState(cached.funnelMode || 'default');
  const [generationPrompt, setGenerationPrompt] = useState(cached.generationPrompt || null);
  const isGeneratingRef = useRef(false);
  const isCalculatingChartRef = useRef(false);

  // Persist critical state to sessionStorage
  useEffect(() => {
    saveSession({ chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis, artworkId, userPhotoUrl, isPortraitEdition, generationComplete, funnelMode, generationPrompt });
  }, [chartData, formData, selectedStyle, generatedImage, orderDetails, artworkAnalysis, artworkId, userPhotoUrl, isPortraitEdition, generationComplete, funnelMode, generationPrompt]);

  const handleFormSubmit = useCallback(async (data) => {
    if (isCalculatingChartRef.current) return;

    try {
      isCalculatingChartRef.current = true;
      setIsCalculatingChart(true);
      setError(null);
      setFormData(data);
      sessionStorage.setItem('celestial_form_data', JSON.stringify(data));
      sessionStorage.setItem('celestial_birth_details', JSON.stringify({
        customerName: data?.name || null,
        birthDate: toBirthDate(data),
        birthTime: toBirthTime(data),
        birthPlace: toBirthPlace(data),
      }));

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

      // Navigate based on funnel mode
      if (funnelMode === 'digital') {
        if (window.location.pathname !== '/d/style') {
          navigate('/d/style');
        }
      } else if (window.location.pathname !== '/generate/product' && window.location.pathname !== '/generate/style') {
        navigate('/generate/product');
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
  }, [navigate, funnelMode]);

  const handleStyleSelect = useCallback(async (styleId) => {
    // Prevent double-click race condition
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    const style = getStyleById(styleId);
    setSelectedStyle(style);

    // Fire GA4 event before generation starts
    const dtId = sessionStorage.getItem('affiliate_dt_id') || undefined;
    trackGenerateArtwork(styleId, dtId || 'direct');
    trackMetaGenerateArtwork(styleId);
    setArtworkAnalysis(null);
    setArtworkId(null);
    navigate(funnelMode === 'digital' ? '/d/loading' : '/generate/loading');

    try {
      setGenerationProgress('Building your personalized artwork prompt...');
      const prompt = await buildConcretePrompt(chartData, style, isPortraitEdition, formData?.gender || null);
      setGenerationPrompt(prompt);

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
        analyzeArtwork(result.imageUrl, chartData, { promptUsed: prompt, styleId: style.id }),
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

      const storedImageUrl = result.imageUrl;
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
          // Only update if the user hasn't reimagined to a different image
          setGeneratedImage(prev => prev === storedImageUrl ? storeData.permanentUrl : prev);
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
      navigate(funnelMode === 'digital' ? '/d/style' : '/generate/style');
    }
  }, [chartData, formData, navigate, isPortraitEdition, userPhotoUrl, funnelMode]);

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
    navigate(funnelMode === 'digital' ? '/d/style' : '/generate/style');
  }, [navigate, funnelMode]);

  const handleGetFramed = useCallback(() => {
    navigate('/generate/size');
  }, [navigate]);

  const handleBackToPreview = useCallback(() => {
    navigate('/generate/preview');
  }, [navigate]);

  const handleCheckout = useCallback(async (details) => {
    // Prevent double-click / repeated checkout submissions
    if (isCheckingOut) return;

    const checkoutFormData = {
      ...(readSessionJSON('celestial_form_data') || {}),
      ...(formData || {}),
    };
    const persistedBirthDetails = readSessionJSON('celestial_birth_details') || {};

    const enrichedDetails = {
      ...details,
      orderNumber: `#CA-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      firstName: checkoutFormData?.name || persistedBirthDetails?.customerName || '',
    };
    setOrderDetails(enrichedDetails);
    setIsCheckingOut(true);
    setError(null);

    try {
      // Save order data to production Supabase
      const resolvedFormData = checkoutFormData;
      const customerName =
        resolvedFormData?.name ||
        persistedBirthDetails?.customerName ||
        sessionStorage.getItem('celestial_captured_first_name') ||
        chartData?.customer_name ||
        null;
      const customerEmail =
        sessionStorage.getItem('celestial_captured_email') ||
        resolvedFormData?.email ||
        details?.email ||
        null;
      const birthDate = toBirthDate(resolvedFormData) || persistedBirthDetails?.birthDate || chartData?.birth_date || null;
      const birthTime = toBirthTime(resolvedFormData) || persistedBirthDetails?.birthTime || chartData?.birth_time || null;
      const birthPlace = toBirthPlace(resolvedFormData) || persistedBirthDetails?.birthPlace || chartData?.birth_place || null;

      sessionStorage.setItem('celestial_birth_details', JSON.stringify({
        customerName,
        customerEmail,
        birthDate,
        birthTime,
        birthPlace,
      }));

      console.log('formData at checkout:', formData);
      console.log('resolvedFormData at checkout:', resolvedFormData);
      console.log('insert card fields at checkout:', { customerName, customerEmail, birthDate, birthTime, birthPlace });

      let celestialOrderId = sessionStorage.getItem('celestial_order_id') || '';
      try {
        const saveResponse = await fetch(
          'https://kdfojrmzhpfphvgwgeov.supabase.co/functions/v1/save-order-data',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerName,
              customerEmail,
              chartData: {
                ...chartData,
                customer_name: customerName,
                birth_date: birthDate,
                birth_time: birthTime,
                birth_place: birthPlace,
              },
              artworkAnalysis: artworkAnalysis,
              generatedImageUrl: generatedImage,
              subjectExplanation: artworkAnalysis?.subjectExplanation || null,
              fulfillmentType: 'canvas',
            }),
          }
        );
        const saveData = await saveResponse.json();
        console.log('[canvas-checkout] save-order-data result:', saveData);
        if (saveData?.orderId) {
          celestialOrderId = saveData.orderId;
          sessionStorage.setItem('celestial_order_id', celestialOrderId);
        }
      } catch (saveErr) {
        console.warn('⚠️ save-order-data failed (non-blocking):', saveErr);
      }

      // Step 2: Create WooCommerce checkout
      const checkoutBody = {
        orderDetails: enrichedDetails,
        chartData,
        artworkImageUrl: generatedImage,
        customerName,
        customerEmail,
        artworkId,
        celestialOrderId,
        styleId: selectedStyle?.id || '',
      };
      const affiliateDtId = sessionStorage.getItem('affiliate_dt_id');
      if (affiliateDtId) checkoutBody.dtId = affiliateDtId;

      // Fire GA4 event before checkout
      trackBeginCheckout(enrichedDetails.size || '16x24', enrichedDetails.price || 119);
      trackMetaBeginCheckout(enrichedDetails.price || 119);

      const { data, error: fnError } = await supabase.functions.invoke('create-woocommerce-checkout', {
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
  }, [chartData, formData, generatedImage, artworkAnalysis, artworkId, selectedStyle, isCheckingOut]);


  const value = {
    chartData, formData, selectedStyle, generatedImage,
    error, generationProgress, orderDetails, isCheckingOut,
    isCalculatingChart,
    artworkAnalysis, generationComplete, artworkId,
    userPhotoUrl, isPortraitEdition,
    funnelMode, setFunnelMode, generationPrompt,
    setFormData, setChartData, setError, setGeneratedImage, setArtworkAnalysis,
    setGenerationComplete, setArtworkId,
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