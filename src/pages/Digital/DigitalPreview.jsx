import { useEffect, useState, useCallback, useRef } from 'react';
import { trackViewArtwork, trackEvent } from '@/lib/analytics';
import { trackMetaViewArtwork, trackMetaDigitalDownload, trackMetaCanvasUpsellClick } from '@/lib/meta-pixel';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { getNextVariation } from '@/lib/api/replicateClient';
import { clearCompositeCache } from '@/hooks/useCompositedMockups';
import { DIGITAL_PRODUCT } from '@/lib/digitalProduct';
import { invokeProjectFunction } from '@/lib/api/invokeProjectFunction';
import { toast } from '@/hooks/use-toast';

import taurusExample from '@/assets/gallery/taurus-example.jpg';
import demoImage from '@/assets/gallery/demo-cosmic-collision.webp';

const DEMO_CHART = {
  sun: { sign: 'Scorpio', house: 8 },
  moon: { sign: 'Pisces', house: 12 },
  rising: 'Capricorn',
  element_balance: { Fire: 1, Water: 5, Earth: 3, Air: 1 },
  aspects: [],
};

const DEMO_IMAGE_PUBLIC_URL = 'https://zuzbwklzmcrszdjyepqe.supabase.co/storage/v1/object/public/demo-assets/demo-cosmic-collision.webp';

const REIMAGINE_MESSAGES = [
  'Realigning your cosmic energies...',
  'Shifting the celestial perspective...',
  'Reweaving your star map...',
  'Channeling a new constellation...',
];

/**
 * Digital funnel preview page (/d/preview).
 * Primary CTA: digital download purchase. Secondary: canvas upsell.
 */
export default function DigitalPreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleEditBirthData, handleBackToStyle,
    artworkAnalysis, setArtworkAnalysis, setGeneratedImage, handleStyleSelect,
    selectedStyle, setFunnelMode, generationPrompt,
  } = useGenerator();

  const [demoAnalysis, setDemoAnalysis] = useState(null);
  const [isReimagining, setIsReimagining] = useState(false);
  const [reimagineMessage, setReimagineMessage] = useState('');
  const [variationsExhausted, setVariationsExhausted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // 'standard' | 'high_resolution' | null

  // Ensure digital mode
  useEffect(() => {
    setFunnelMode('digital');
  }, [setFunnelMode]);

  const isDemo = !chartData;
  const displayChart = chartData || DEMO_CHART;
  const displayImage = generatedImage || (isDemo ? demoImage : taurusExample);
  const matchedAnalysis = !isDemo ? artworkAnalysis : null;

  // Demo analysis
  useEffect(() => {
    if (isDemo && !demoAnalysis) {
      analyzeArtwork(DEMO_IMAGE_PUBLIC_URL, DEMO_CHART, null).then(setDemoAnalysis).catch(console.error);
    }
  }, [isDemo, demoAnalysis]);

  // Track artwork view once
  useEffect(() => {
    if (!isDemo && generatedImage && selectedStyle?.id) {
      trackViewArtwork(selectedStyle.id);
      trackMetaViewArtwork(selectedStyle.id);
    }
  }, [isDemo, generatedImage, selectedStyle?.id]);

  // Digital checkout handler
  const handleDigitalCheckout = useCallback(async (resolution) => {
    if (checkoutLoading) return;
    trackEvent('digital_download', { funnel_step: 'digital_checkout', style_id: selectedStyle?.id || '', resolution });
    trackMetaDigitalDownload(selectedStyle?.id || '');
    setCheckoutLoading(resolution);

    try {
      const styleId = selectedStyle?.id || '';
      const customerEmail = sessionStorage.getItem('celestial_captured_email') || '';
      const artworkImageUrl = generatedImage || '';
      const dtId = sessionStorage.getItem('affiliate_dt_id') || '';

      // Persist order data (same pattern as canvas funnel) — non-blocking
      let celestialOrderId = sessionStorage.getItem('celestial_order_id') || '';
      try {
        const customerName = formData?.name || sessionStorage.getItem('celestial_captured_first_name') || '';
        const saveResponse = await fetch(
          'https://kdfojrmzhpfphvgwgeov.supabase.co/functions/v1/save-order-data',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName,
              customerEmail,
              chartData: displayChart,
              artworkAnalysis: artworkAnalysis || null,
              generatedImageUrl: artworkImageUrl,
              subjectExplanation: artworkAnalysis?.subjectExplanation || null,
              fulfillmentType: 'digital',
            }),
          }
        );
        const saveData = await saveResponse.json();
        console.log('[digital-checkout] save-order-data result:', saveData);
        if (saveData?.orderId) {
          celestialOrderId = saveData.orderId;
          sessionStorage.setItem('celestial_order_id', celestialOrderId);
        }
      } catch (saveErr) {
        console.warn('⚠️ save-order-data failed (non-blocking):', saveErr);
      }

      sessionStorage.setItem('funnel_type', 'digital');

      const data = await invokeProjectFunction('create-woocommerce-digital-checkout', {
        resolution,
        styleId,
        customerEmail,
        chartData: displayChart,
        artworkImageUrl,
        celestialOrderId: celestialOrderId || undefined,
        dtId: dtId || undefined,
      });

      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err) {
      console.error('❌ Digital checkout error:', err);
      toast({ title: 'Checkout failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setCheckoutLoading(null);
    }
  }, [checkoutLoading, selectedStyle, generatedImage, displayChart, formData, artworkAnalysis]);

  // Canvas upsell — go to existing size page
  const handleCanvasUpsell = useCallback(() => {
    trackEvent('canvas_upsell_click', { funnel_step: 'upsell', style_id: selectedStyle?.id || '' });
    trackMetaCanvasUpsellClick(selectedStyle?.id || '');
    navigate('/generate/size');
  }, [navigate, selectedStyle]);

  // Reimagine
  const handleReimagine = useCallback(() => {
    if (isDemo || isReimagining) return;
    const next = getNextVariation();
    if (!next) { setVariationsExhausted(true); return; }
    setArtworkAnalysis(null);
    const msg = REIMAGINE_MESSAGES[Math.floor(Math.random() * REIMAGINE_MESSAGES.length)];
    setReimagineMessage(msg);
    setIsReimagining(true);
    clearCompositeCache();

    const startTime = Date.now();
    const imgPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = next.imageUrl;
    });
    const analysisPromise = analyzeArtwork(next.imageUrl, chartData, generationPrompt).catch(() => null);

    Promise.all([imgPromise, analysisPromise])
      .then(([, analysisResult]) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 2500 - elapsed);
        setTimeout(() => {
          if (analysisResult) setArtworkAnalysis(analysisResult);
          setGeneratedImage(next.imageUrl);
          setIsReimagining(false);
        }, remaining);
      })
      .catch(() => setIsReimagining(false));
  }, [isDemo, isReimagining, chartData, setArtworkAnalysis, setGeneratedImage, generationPrompt]);

  const handleGenerateNew = useCallback(() => {
    if (!selectedStyle) return;
    setVariationsExhausted(false);
    handleStyleSelect(selectedStyle.id);
  }, [selectedStyle, handleStyleSelect]);

  return (
    <>
      <ChartExplanation
        chartData={displayChart}
        selectedImage={displayImage}
        onGetFramed={handleCanvasUpsell}
        formData={formData}
        onEditBirthData={handleEditBirthData || (() => navigate('/'))}
        onBackToStyle={handleBackToStyle || (() => navigate('/d/style'))}
        artworkAnalysis={isDemo ? demoAnalysis : matchedAnalysis}
        onReimagine={!isDemo ? (variationsExhausted ? handleGenerateNew : handleReimagine) : undefined}
        isReimagining={isReimagining}
        variationsExhausted={variationsExhausted}
        funnelMode="digital"
        digitalPrice={DIGITAL_PRODUCT.price}
        onCanvasUpsell={handleCanvasUpsell}
        onDigitalCheckout={handleDigitalCheckout}
        checkoutLoading={checkoutLoading}
      />

      {isReimagining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center space-y-5 px-8">
            <div className="relative w-16 h-16 mx-auto">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: '#FE6781',
                  borderRightColor: '#FFBF00',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent"
                style={{
                  borderBottomColor: '#FE6781',
                  borderLeftColor: '#FFBF00',
                  animation: 'spin 1.5s linear infinite reverse',
                }}
              />
            </div>
            <p className="text-a3 text-white font-display tracking-wide">
              {reimagineMessage}
            </p>
            <p className="text-body-sm text-white/50 font-body">
              Your new variation is almost ready
            </p>
          </div>
        </div>
      )}
    </>
  );
}
