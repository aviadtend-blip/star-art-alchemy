import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';
import { getNextVariation } from '@/lib/api/replicateClient';

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

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle,
    artworkAnalysis, setGeneratedImage,
  } = useGenerator();

  const [demoAnalysis, setDemoAnalysis] = useState(null);
  const [isReimagining, setIsReimagining] = useState(false);

  const isDemo = !chartData;
  const displayChart = chartData || DEMO_CHART;
  const displayImage = generatedImage || (isDemo ? demoImage : taurusExample);

  // Run AI analysis for demo mode
  useEffect(() => {
    if (isDemo && !demoAnalysis) {
      analyzeArtwork(DEMO_IMAGE_PUBLIC_URL, DEMO_CHART).then(setDemoAnalysis).catch(console.error);
    }
  }, [isDemo, demoAnalysis]);

  const handleReimagine = useCallback(() => {
    if (isDemo) return;
    const next = getNextVariation();
    if (next) {
      setIsReimagining(true);
      const img = new Image();
      img.onload = () => {
        setGeneratedImage(next.imageUrl);
        setIsReimagining(false);
      };
      img.onerror = () => setIsReimagining(false);
      img.src = next.imageUrl;
    }
  }, [isDemo, setGeneratedImage]);

  return (
    <ChartExplanation
      chartData={displayChart}
      selectedImage={displayImage}
      onGetFramed={handleGetFramed || (() => navigate('/generate/size'))}
      formData={formData}
      onEditBirthData={handleEditBirthData || (() => navigate('/'))}
      onBackToStyle={handleBackToStyle || (() => navigate('/generate/style'))}
      artworkAnalysis={isDemo ? demoAnalysis : artworkAnalysis}
      onReimagine={!isDemo ? handleReimagine : undefined}
      isReimagining={isReimagining}
    />
  );
}
