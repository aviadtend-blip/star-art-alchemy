import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { getNextVariation, generateImage } from '@/lib/api/replicateClient';
import { preloadAllMockups, clearCompositeCache } from '@/hooks/useCompositedMockups';

import taurusExample from '@/assets/gallery/taurus-example.jpg';
import demoImage from '@/assets/gallery/demo-cosmic-collision.webp';

// Mockup imports for preloading (same sets used by ProductCustomization)
import mockup12x18_1 from '@/assets/mockups/12x18/mockup-1.webp';
import mockup12x18_2 from '@/assets/mockups/12x18/mockup-2.webp';
import mockup12x18_3 from '@/assets/mockups/12x18/mockup-3.webp';
import mockup12x18_4 from '@/assets/mockups/12x18/mockup-4.webp';
import mockup12x18_5 from '@/assets/mockups/12x18/mockup-5.webp';
import mockup12x18_6 from '@/assets/mockups/12x18/mockup-6.webp';
import mockup12x18_7 from '@/assets/mockups/12x18/mockup-7.webp';
import mockup12x18_8 from '@/assets/mockups/12x18/mockup-8.webp';

import mockup16x24_1 from '@/assets/mockups/16x24/mockup-1.webp';
import mockup16x24_2 from '@/assets/mockups/16x24/mockup-2.webp';
import mockup16x24_3 from '@/assets/mockups/16x24/mockup-3.webp';
import mockup16x24_4 from '@/assets/mockups/16x24/mockup-4.webp';
import mockup16x24_5 from '@/assets/mockups/16x24/mockup-5.webp';
import mockup16x24_6 from '@/assets/mockups/16x24/mockup-6.webp';
import mockup16x24_7 from '@/assets/mockups/16x24/mockup-7.webp';
import mockup16x24_8 from '@/assets/mockups/16x24/mockup-8.webp';

import mockup20x30_3 from '@/assets/mockups/20x30/mockup-3.webp';
import mockup20x30_4 from '@/assets/mockups/20x30/mockup-4.webp';
import mockup20x30_5 from '@/assets/mockups/20x30/mockup-5.webp';
import mockup20x30_6 from '@/assets/mockups/20x30/mockup-6.webp';
import mockup20x30_7 from '@/assets/mockups/20x30/mockup-7.webp';
import mockup20x30_8 from '@/assets/mockups/20x30/mockup-8.webp';

const ALL_MOCKUP_SETS = [
  [mockup12x18_1, mockup12x18_2, mockup12x18_3, mockup12x18_4, mockup12x18_5, mockup12x18_6, mockup12x18_7, mockup12x18_8],
  [mockup16x24_1, mockup16x24_2, mockup16x24_3, mockup16x24_4, mockup16x24_5, mockup16x24_6, mockup16x24_7, mockup16x24_8],
  [mockup20x30_3, mockup20x30_4, mockup20x30_5, mockup20x30_6, mockup20x30_7, mockup20x30_8],
];

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

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle,
    artworkAnalysis, setGeneratedImage, handleStyleSelect,
    selectedStyle,
  } = useGenerator();

  const [demoAnalysis, setDemoAnalysis] = useState(null);
  const [isReimagining, setIsReimagining] = useState(false);
  const [reimagineMessage, setReimagineMessage] = useState('');
  const [variationsExhausted, setVariationsExhausted] = useState(false);
  const preloadCleanup = useRef(null);

  const isDemo = !chartData;
  const displayChart = chartData || DEMO_CHART;
  const displayImage = generatedImage || (isDemo ? demoImage : taurusExample);

  // Run AI analysis for demo mode
  useEffect(() => {
    if (isDemo && !demoAnalysis) {
      analyzeArtwork(DEMO_IMAGE_PUBLIC_URL, DEMO_CHART).then(setDemoAnalysis).catch(console.error);
    }
  }, [isDemo, demoAnalysis]);

  // Background-preload all mockup composites when artwork is available
  useEffect(() => {
    if (!generatedImage || isDemo) return;
    // Start preloading after a short delay to not compete with initial render
    const timer = setTimeout(() => {
      preloadCleanup.current?.();
      preloadCleanup.current = preloadAllMockups(ALL_MOCKUP_SETS, generatedImage);
    }, 500);
    return () => {
      clearTimeout(timer);
      preloadCleanup.current?.();
    };
  }, [generatedImage, isDemo]);

  const handleReimagine = useCallback(() => {
    if (isDemo || isReimagining) return;

    const next = getNextVariation();
    if (!next) {
      setVariationsExhausted(true);
      return;
    }

    // Pick a random loading message
    const msg = REIMAGINE_MESSAGES[Math.floor(Math.random() * REIMAGINE_MESSAGES.length)];
    setReimagineMessage(msg);
    setIsReimagining(true);

    // Clear old mockup composites since artwork is changing
    clearCompositeCache();

    // Preload image, then show it after min 2.5s loading state
    const startTime = Date.now();
    const img = new Image();
    img.onload = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2500 - elapsed);
      setTimeout(() => {
        setGeneratedImage(next.imageUrl);
        setIsReimagining(false);
        // Start preloading mockups with new artwork
        preloadCleanup.current?.();
        preloadCleanup.current = preloadAllMockups(ALL_MOCKUP_SETS, next.imageUrl);
      }, remaining);
    };
    img.onerror = () => {
      setIsReimagining(false);
    };
    img.src = next.imageUrl;
  }, [isDemo, isReimagining, setGeneratedImage]);

  const handleGenerateNew = useCallback(() => {
    if (!selectedStyle) return;
    // Reset exhaustion and go back through the full generation flow
    setVariationsExhausted(false);
    handleStyleSelect(selectedStyle.id);
  }, [selectedStyle, handleStyleSelect]);

  return (
    <>
      <ChartExplanation
        chartData={displayChart}
        selectedImage={displayImage}
        onGetFramed={handleGetFramed || (() => navigate('/generate/size'))}
        formData={formData}
        onEditBirthData={handleEditBirthData || (() => navigate('/'))}
        onBackToStyle={handleBackToStyle || (() => navigate('/generate/style'))}
        artworkAnalysis={isDemo ? demoAnalysis : artworkAnalysis}
        onReimagine={!isDemo ? (variationsExhausted ? handleGenerateNew : handleReimagine) : undefined}
        isReimagining={isReimagining}
        variationsExhausted={variationsExhausted}
      />

      {/* Reimagine loading overlay */}
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
