import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { getNextVariation } from '@/lib/api/replicateClient';
import { clearCompositeCache } from '@/hooks/useCompositedMockups';
import { DIGITAL_PRODUCT } from '@/lib/digitalProduct';

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
    selectedStyle, setFunnelMode,
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
      analyzeArtwork(DEMO_IMAGE_PUBLIC_URL, DEMO_CHART).then(setDemoAnalysis).catch(console.error);
    }
  }, [isDemo, demoAnalysis]);

  // Digital purchase handler (placeholder — will wire to Shopify checkout)
  const handleDigitalPurchase = useCallback(() => {
    // TODO: call create-shopify-checkout with digital variant ID
    console.log('Digital purchase initiated', DIGITAL_PRODUCT);
    navigate('/generate/size'); // fallback for now
  }, [navigate]);

  // Canvas upsell — go to existing size page
  const handleCanvasUpsell = useCallback(() => {
    navigate('/generate/size');
  }, [navigate]);

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
    const analysisPromise = analyzeArtwork(next.imageUrl, chartData).catch(() => null);

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
  }, [isDemo, isReimagining, chartData, setArtworkAnalysis, setGeneratedImage]);

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
        onGetFramed={handleDigitalPurchase}
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
