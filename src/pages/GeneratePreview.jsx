import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import { analyzeArtwork } from '@/lib/explanations/analyzeArtwork';

import taurusExample from '@/assets/gallery/taurus-example.jpg';
import demoImage from '@/assets/gallery/demo-cosmic-collision.webp';

const DEMO_CHART = {
  sun: { sign: 'Scorpio', house: 8 },
  moon: { sign: 'Pisces', house: 12 },
  rising: 'Capricorn',
  element_balance: { Fire: 1, Water: 5, Earth: 3, Air: 1 },
  aspects: [],
};

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle,
    artworkAnalysis,
  } = useGenerator();

  const [demoAnalysis, setDemoAnalysis] = useState(null);

  const isDemo = !chartData;
  const displayChart = chartData || DEMO_CHART;
  const displayImage = generatedImage || (isDemo ? demoImage : taurusExample);

  // Run AI analysis for demo mode
  useEffect(() => {
    if (isDemo && !demoAnalysis) {
      // Convert relative asset path to absolute URL for the edge function
      const absoluteUrl = new URL(demoImage, window.location.origin).href;
      analyzeArtwork(absoluteUrl, DEMO_CHART).then(setDemoAnalysis).catch(console.error);
    }
  }, [isDemo, demoAnalysis]);

  return (
    <ChartExplanation
      chartData={displayChart}
      selectedImage={displayImage}
      onGetFramed={handleGetFramed || (() => navigate('/generate/size'))}
      formData={formData}
      onEditBirthData={handleEditBirthData || (() => navigate('/'))}
      onBackToStyle={handleBackToStyle || (() => navigate('/generate/style'))}
      artworkAnalysis={isDemo ? demoAnalysis : artworkAnalysis}
    />
  );
}
