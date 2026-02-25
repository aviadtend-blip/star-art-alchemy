import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import StyleSelection from '@/components/Generator/StyleSelection';

export default function GenerateStyle() {
  const navigate = useNavigate();
  const { chartData, formData, handleStyleSelect, handleEditBirthData, handleRetry } = useGenerator();

  // Guard: redirect home if no chart data
  useEffect(() => {
    if (!chartData) navigate('/');
  }, [chartData, navigate]);

  if (!chartData) return null;

  return (
    <StyleSelection
      onSelect={handleStyleSelect}
      onBack={handleRetry}
      chartData={chartData}
      formData={formData}
      onEditBirthData={handleEditBirthData}
    />
  );
}
