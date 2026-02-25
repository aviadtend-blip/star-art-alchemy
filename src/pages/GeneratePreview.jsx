import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';

// Mock data for UI development — remove when connecting to real flow
import taurusExample from '@/assets/gallery/taurus-example.jpg';

const MOCK_CHART = {
  sun: { sign: 'Taurus', house: 2 },
  moon: { sign: 'Pisces', house: 12 },
  rising: 'Scorpio',
  element_balance: { Fire: 2, Water: 4, Earth: 3, Air: 1 },
  dominant_element: 'Water',
};

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle,
  } = useGenerator();

  const displayChart = chartData || MOCK_CHART;
  const displayImage = generatedImage || taurusExample;

  return (
    <ChartExplanation
      chartData={displayChart}
      selectedImage={displayImage}
      onGetFramed={handleGetFramed}
      formData={formData}
      onEditBirthData={handleEditBirthData}
      onBackToStyle={handleBackToStyle}
    />
  );
}
