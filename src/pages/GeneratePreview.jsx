import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';

import taurusExample from '@/assets/gallery/taurus-example.jpg';

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle,
  } = useGenerator();

  useEffect(() => {
    if (!chartData) navigate('/');
  }, [chartData, navigate]);

  if (!chartData) return null;

  const displayChart = chartData;
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
