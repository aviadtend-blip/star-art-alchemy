import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';

export default function GenerateLoading() {
  const navigate = useNavigate();
  const { chartData, selectedStyle, generationProgress } = useGenerator();

  // Guard: redirect home if no chart data
  useEffect(() => {
    if (!chartData) navigate('/');
  }, [chartData, navigate]);

  if (!chartData) return null;

  return (
    <LoadingScreen
      chartData={chartData}
      selectedStyle={selectedStyle}
      generationProgress={generationProgress}
    />
  );
}
